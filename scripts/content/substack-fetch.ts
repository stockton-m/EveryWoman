import { setTimeout as delay } from "node:timers/promises";

import { PROXY_ERROR } from "./substack-proxy.js";
import {
  isHtmlDocument,
  isRssDocument,
  SUBSTACK_FEED_HOST,
  SUBSTACK_FEED_URL,
  SUBSTACK_HEADER_PROFILES,
  SUBSTACK_PROXY_URL,
  SUBSTACK_RETRY_AFTER_CAP_MS,
  SUBSTACK_RETRY_DELAYS_MS,
  type SubstackHeaderProfile,
} from "./substack-profiles.js";

export const SUBSTACK_DIRECT_TIMEOUT_MS = 15_000;
export const SUBSTACK_PROXY_TIMEOUT_MS = 20_000;

const RETRYABLE_STATUSES = new Set([403, 408, 429, 500, 502, 503, 504]);

export type SubstackUnavailableReason =
  | "direct_rejected"
  | "proxy_exhausted"
  | "proxy_invalid"
  | "proxy_not_configured"
  | "proxy_rejected"
  | "proxy_routing"
  | "proxy_token_missing"
  | "proxy_unauthorized";

export class SubstackUnavailableError extends Error {
  readonly lastStatus?: number;
  readonly reason: SubstackUnavailableReason;

  constructor(
    message: string,
    reason: SubstackUnavailableReason,
    lastStatus?: number,
  ) {
    super(message);
    this.name = "SubstackUnavailableError";
    this.reason = reason;
    this.lastStatus = lastStatus;
  }
}

export interface FetchSubstackFeedOptions {
  fetchImpl?: typeof fetch;
  log?: (message: string) => void;
  now?: () => number;
  proxyToken?: string;
  proxyUrl?: string;
  sleep?: (ms: number) => Promise<void>;
}

interface AttemptLog {
  attempt: number;
  elapsedMs: number;
  errorCode?: string;
  phase: "direct" | "proxy";
  profile: SubstackHeaderProfile;
  status: number | "network";
}

type ProxyOutcome =
  | { kind: "retry"; errorCode?: string; status: number; upstreamStatus?: number }
  | { kind: "stop"; reason: SubstackUnavailableReason; status: number }
  | { kind: "xml"; xml: string };

function formatAttempt(input: AttemptLog): string {
  const error = input.errorCode ? ` error=${input.errorCode}` : "";
  return `Substack ${input.phase} attempt ${input.attempt + 1}/${SUBSTACK_HEADER_PROFILES.length} profile=${input.profile.id} (${input.profile.name}) status=${input.status} elapsedMs=${input.elapsedMs}${error}`;
}

function retryAfterDelayMs(response: Response, nowMs: number): number | undefined {
  const header = response.headers.get("retry-after")?.trim();
  if (!header) {
    return undefined;
  }
  if (/^\d+(\.\d+)?$/.test(header)) {
    return Math.round(Number(header) * 1000);
  }
  const parsed = Date.parse(header);
  if (Number.isNaN(parsed)) {
    return undefined;
  }
  return Math.max(0, parsed - nowMs);
}

function delayAfter(
  attemptIndex: number,
  response: Response | undefined,
  upstreamStatus: number | undefined,
  nowMs: number,
): number | undefined {
  if (attemptIndex >= SUBSTACK_RETRY_DELAYS_MS.length) {
    return undefined;
  }
  const scheduled = SUBSTACK_RETRY_DELAYS_MS[attemptIndex]!;
  const status = upstreamStatus ?? response?.status;
  if (response && (status === 429 || status === 503)) {
    const hinted = retryAfterDelayMs(response, nowMs);
    if (hinted !== undefined) {
      return Math.min(
        Math.max(scheduled, hinted),
        SUBSTACK_RETRY_AFTER_CAP_MS,
      );
    }
  }
  return scheduled;
}

function isRetryableStatus(status: number): boolean {
  return RETRYABLE_STATUSES.has(status);
}

function isUsableDirectRss(response: Response, body: string): boolean {
  if (
    !isRssDocument(body) ||
    isHtmlDocument(body, response.headers.get("content-type"))
  ) {
    return false;
  }
  if (!response.url) {
    return true;
  }
  try {
    return new URL(response.url).host === SUBSTACK_FEED_HOST;
  } catch {
    return false;
  }
}

function proxyRequestUrl(proxyUrl: string, profileIndex: number): string {
  const url = new URL(proxyUrl);
  url.searchParams.set("profile", String(profileIndex));
  return url.toString();
}

async function readProxyError(
  response: Response,
): Promise<{ error?: string; upstreamStatus?: number }> {
  try {
    const value: unknown = await response.json();
    if (typeof value !== "object" || value === null) {
      return {};
    }
    const record = value as Record<string, unknown>;
    return {
      ...(typeof record.error === "string" ? { error: record.error } : {}),
      ...(typeof record.upstreamStatus === "number"
        ? { upstreamStatus: record.upstreamStatus }
        : {}),
    };
  } catch {
    return {};
  }
}

async function classifyProxyResponse(response: Response): Promise<ProxyOutcome> {
  const contentType = response.headers.get("content-type");
  if (response.status === 200) {
    const body = await response.text();
    if (isHtmlDocument(body, contentType)) {
      return { kind: "stop", reason: "proxy_routing", status: response.status };
    }
    if (isRssDocument(body)) {
      return { kind: "xml", xml: body };
    }
    return {
      kind: "retry",
      errorCode: PROXY_ERROR.upstreamInvalid,
      status: response.status,
    };
  }

  if (contentType?.toLowerCase().includes("text/html")) {
    await response.body?.cancel();
    return { kind: "stop", reason: "proxy_routing", status: response.status };
  }

  if (response.status === 401) {
    await response.body?.cancel();
    return { kind: "stop", reason: "proxy_unauthorized", status: 401 };
  }
  if (response.status === 400 || response.status === 405) {
    await response.body?.cancel();
    return { kind: "stop", reason: "proxy_invalid", status: response.status };
  }

  const errorBody = await readProxyError(response);
  if (
    response.status === 503 &&
    errorBody.error === PROXY_ERROR.notConfigured
  ) {
    return { kind: "stop", reason: "proxy_not_configured", status: 503 };
  }

  if (response.status === 502 && errorBody.error === PROXY_ERROR.upstreamFailed) {
    const upstreamStatus = errorBody.upstreamStatus;
    if (upstreamStatus !== undefined && !isRetryableStatus(upstreamStatus)) {
      return { kind: "stop", reason: "proxy_rejected", status: upstreamStatus };
    }
    return {
      kind: "retry",
      errorCode: PROXY_ERROR.upstreamFailed,
      status: upstreamStatus ?? response.status,
      ...(upstreamStatus !== undefined ? { upstreamStatus } : {}),
    };
  }

  if (
    response.status === 502 &&
    (errorBody.error === PROXY_ERROR.upstreamInvalid ||
      errorBody.error === PROXY_ERROR.upstreamUnreachable)
  ) {
    return {
      kind: "retry",
      errorCode: errorBody.error,
      status: errorBody.upstreamStatus ?? response.status,
      ...(errorBody.upstreamStatus !== undefined
        ? { upstreamStatus: errorBody.upstreamStatus }
        : {}),
    };
  }

  if (isRetryableStatus(response.status)) {
    return {
      kind: "retry",
      ...(errorBody.error ? { errorCode: errorBody.error } : {}),
      status: response.status,
      ...(errorBody.upstreamStatus !== undefined
        ? { upstreamStatus: errorBody.upstreamStatus }
        : {}),
    };
  }

  return {
    kind: "stop",
    reason: "proxy_invalid",
    status: response.status,
  };
}

function stopMessage(outcome: Extract<ProxyOutcome, { kind: "stop" }>): string {
  switch (outcome.reason) {
    case "proxy_unauthorized":
      return "Substack proxy authentication failed.";
    case "proxy_not_configured":
      return "Substack proxy is not configured.";
    case "proxy_routing":
      return "Substack proxy returned HTML instead of the RSS feed. Check that /.netlify/functions/substack-rss is not shadowed by a redirect.";
    case "proxy_rejected":
      return `Substack feed request failed with HTTP ${outcome.status}.`;
    case "proxy_invalid":
      return `Substack proxy request was rejected with HTTP ${outcome.status}.`;
    default:
      return "Substack proxy request failed.";
  }
}

export async function fetchSubstackFeedXml(
  options: FetchSubstackFeedOptions = {},
): Promise<string> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const sleep = options.sleep ?? delay;
  const now = options.now ?? Date.now;
  const log = options.log ?? ((message: string) => console.log(message));
  const proxyToken = options.proxyToken?.trim() || undefined;
  const proxyUrl = options.proxyUrl ?? SUBSTACK_PROXY_URL;

  let lastStatus: number | undefined;

  for (let attempt = 0; attempt < SUBSTACK_HEADER_PROFILES.length; attempt += 1) {
    const profile = SUBSTACK_HEADER_PROFILES[attempt]!;
    const started = now();
    let response: Response;
    try {
      response = await fetchImpl(SUBSTACK_FEED_URL, {
        headers: profile.headers,
        signal: AbortSignal.timeout(SUBSTACK_DIRECT_TIMEOUT_MS),
      });
    } catch {
      const elapsedMs = Math.max(0, now() - started);
      log(formatAttempt({
        attempt,
        elapsedMs,
        phase: "direct",
        profile,
        status: "network",
      }));
      const wait = delayAfter(attempt, undefined, undefined, now());
      if (wait === undefined) {
        break;
      }
      await sleep(wait);
      continue;
    }

    const elapsedMs = Math.max(0, now() - started);
    if (response.ok) {
      let body: string;
      try {
        body = await response.text();
      } catch {
        log(formatAttempt({
          attempt,
          elapsedMs,
          errorCode: "unreadable",
          phase: "direct",
          profile,
          status: "network",
        }));
        const wait = delayAfter(attempt, undefined, undefined, now());
        if (wait === undefined) {
          break;
        }
        await sleep(wait);
        continue;
      }
      if (isUsableDirectRss(response, body)) {
        log(formatAttempt({
          attempt,
          elapsedMs,
          phase: "direct",
          profile,
          status: response.status,
        }));
        return body;
      }
      log(formatAttempt({
        attempt,
        elapsedMs,
        errorCode: "invalid",
        phase: "direct",
        profile,
        status: response.status,
      }));
      lastStatus = response.status;
    } else if (!isRetryableStatus(response.status)) {
      await response.body?.cancel();
      log(formatAttempt({
        attempt,
        elapsedMs,
        phase: "direct",
        profile,
        status: response.status,
      }));
      throw new SubstackUnavailableError(
        `Substack feed request failed with HTTP ${response.status}.`,
        "direct_rejected",
        response.status,
      );
    } else {
      await response.body?.cancel();
      log(formatAttempt({
        attempt,
        elapsedMs,
        phase: "direct",
        profile,
        status: response.status,
      }));
      lastStatus = response.status;
    }

    const wait = delayAfter(attempt, response, undefined, now());
    if (wait === undefined) {
      break;
    }
    await sleep(wait);
  }

  if (!proxyToken) {
    log("Substack proxy skipped because SUBSTACK_PROXY_TOKEN is not set.");
    throw new SubstackUnavailableError(
      "Substack proxy skipped because SUBSTACK_PROXY_TOKEN is not set.",
      "proxy_token_missing",
      lastStatus,
    );
  }

  for (let attempt = 0; attempt < SUBSTACK_HEADER_PROFILES.length; attempt += 1) {
    const profile = SUBSTACK_HEADER_PROFILES[attempt]!;
    const started = now();
    let response: Response;
    try {
      response = await fetchImpl(proxyRequestUrl(proxyUrl, profile.id), {
        headers: {
          accept: "application/rss+xml, application/xml, application/json",
          authorization: `Bearer ${proxyToken}`,
        },
        method: "POST",
        signal: AbortSignal.timeout(SUBSTACK_PROXY_TIMEOUT_MS),
      });
    } catch {
      const elapsedMs = Math.max(0, now() - started);
      log(formatAttempt({
        attempt,
        elapsedMs,
        phase: "proxy",
        profile,
        status: "network",
      }));
      lastStatus = undefined;
      const wait = delayAfter(attempt, undefined, undefined, now());
      if (wait === undefined) {
        break;
      }
      await sleep(wait);
      continue;
    }

    const elapsedMs = Math.max(0, now() - started);
    const outcome = await classifyProxyResponse(response);
    if (outcome.kind === "xml") {
      log(formatAttempt({
        attempt,
        elapsedMs,
        phase: "proxy",
        profile,
        status: response.status,
      }));
      return outcome.xml;
    }
    if (outcome.kind === "stop") {
      log(formatAttempt({
        attempt,
        elapsedMs,
        errorCode: outcome.reason,
        phase: "proxy",
        profile,
        status: outcome.status,
      }));
      throw new SubstackUnavailableError(
        stopMessage(outcome),
        outcome.reason,
        outcome.status,
      );
    }

    log(formatAttempt({
      attempt,
      elapsedMs,
      ...(outcome.errorCode ? { errorCode: outcome.errorCode } : {}),
      phase: "proxy",
      profile,
      status: outcome.status,
    }));
    lastStatus = outcome.upstreamStatus ?? outcome.status;
    const wait = delayAfter(attempt, response, outcome.upstreamStatus, now());
    if (wait === undefined) {
      break;
    }
    await sleep(wait);
  }

  throw new SubstackUnavailableError(
    lastStatus === undefined
      ? "Substack feed unavailable after direct and proxy retries."
      : `Substack feed unavailable after direct and proxy retries (last status ${lastStatus}).`,
    "proxy_exhausted",
    lastStatus,
  );
}
