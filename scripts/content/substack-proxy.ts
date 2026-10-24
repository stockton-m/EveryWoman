import { createHash, timingSafeEqual } from "node:crypto";

import {
  getSubstackHeaderProfile,
  isHtmlDocument,
  isRssDocument,
  SUBSTACK_FEED_HOST,
  SUBSTACK_FEED_URL,
} from "./substack-profiles.js";

export const SUBSTACK_UPSTREAM_TIMEOUT_MS = 12_000;

export const PROXY_ERROR = {
  invalidProfile: "invalid_profile",
  methodNotAllowed: "method_not_allowed",
  notConfigured: "not_configured",
  unauthorized: "unauthorized",
  upstreamFailed: "upstream_failed",
  upstreamInvalid: "upstream_invalid",
  upstreamUnreachable: "upstream_unreachable",
} as const;

export interface SubstackProxyDependencies {
  fetchImpl?: typeof fetch;
  log?: (message: string) => void;
  now?: () => number;
  token?: string;
}

function jsonResponse(
  status: number,
  body: Record<string, number | string>,
  extraHeaders?: Record<string, string>,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "cache-control": "no-store",
      "content-type": "application/json; charset=utf-8",
      ...extraHeaders,
    },
  });
}

function tokensMatch(presented: string, expected: string): boolean {
  const presentedDigest = createHash("sha256").update(presented).digest();
  const expectedDigest = createHash("sha256").update(expected).digest();
  return timingSafeEqual(presentedDigest, expectedDigest);
}

function presentedBearerToken(request: Request): string | undefined {
  const header = request.headers.get("authorization");
  if (!header) {
    return undefined;
  }
  const match = /^Bearer\s+(\S+)\s*$/i.exec(header);
  return match?.[1];
}

function safeRetryAfter(value: string | null): string | undefined {
  if (!value) {
    return undefined;
  }
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > 128) {
    return undefined;
  }
  if (!/^[\w\s,:+-]+$/.test(trimmed)) {
    return undefined;
  }
  return trimmed;
}

function upstreamHostAllowed(response: Response): boolean {
  if (!response.url) {
    return true;
  }
  try {
    return new URL(response.url).host === SUBSTACK_FEED_HOST;
  } catch {
    return false;
  }
}

export async function handleSubstackRssRequest(
  request: Request,
  dependencies: SubstackProxyDependencies = {},
): Promise<Response> {
  const fetchImpl = dependencies.fetchImpl ?? fetch;
  const now = dependencies.now ?? Date.now;
  const log = dependencies.log ?? ((message: string) => console.log(message));
  const configuredToken = dependencies.token?.trim() ?? "";

  if (request.method !== "POST") {
    return jsonResponse(405, { error: PROXY_ERROR.methodNotAllowed });
  }
  if (!configuredToken) {
    log("substack-rss not_configured");
    return jsonResponse(503, { error: PROXY_ERROR.notConfigured });
  }

  const presented = presentedBearerToken(request);
  if (!presented || !tokensMatch(presented, configuredToken)) {
    log("substack-rss unauthorized");
    return jsonResponse(401, { error: PROXY_ERROR.unauthorized });
  }

  const profileParam = new URL(request.url).searchParams.get("profile");
  if (!profileParam || !/^[0-5]$/.test(profileParam)) {
    log("substack-rss invalid_profile");
    return jsonResponse(400, { error: PROXY_ERROR.invalidProfile });
  }

  const profile = getSubstackHeaderProfile(Number(profileParam));
  if (!profile) {
    log("substack-rss invalid_profile");
    return jsonResponse(400, { error: PROXY_ERROR.invalidProfile });
  }

  const started = now();
  let upstream: Response;
  try {
    upstream = await fetchImpl(SUBSTACK_FEED_URL, {
      headers: profile.headers,
      signal: AbortSignal.timeout(SUBSTACK_UPSTREAM_TIMEOUT_MS),
    });
  } catch {
    log(
      `substack-rss profile=${profile.id} upstreamStatus=network elapsedMs=${Math.max(0, now() - started)}`,
    );
    return jsonResponse(502, { error: PROXY_ERROR.upstreamUnreachable });
  }

  const elapsedMs = Math.max(0, now() - started);
  log(
    `substack-rss profile=${profile.id} upstreamStatus=${upstream.status} elapsedMs=${elapsedMs}`,
  );

  if (!upstream.ok) {
    await upstream.body?.cancel();
    const retryAfter =
      upstream.status === 429 || upstream.status === 503
        ? safeRetryAfter(upstream.headers.get("retry-after"))
        : undefined;
    return jsonResponse(
      502,
      {
        error: PROXY_ERROR.upstreamFailed,
        upstreamStatus: upstream.status,
      },
      retryAfter ? { "retry-after": retryAfter } : undefined,
    );
  }

  let body: string;
  try {
    body = await upstream.text();
  } catch {
    return jsonResponse(502, { error: PROXY_ERROR.upstreamUnreachable });
  }

  if (
    !upstreamHostAllowed(upstream) ||
    !isRssDocument(body) ||
    isHtmlDocument(body, upstream.headers.get("content-type"))
  ) {
    return jsonResponse(502, {
      error: PROXY_ERROR.upstreamInvalid,
      upstreamStatus: upstream.status,
    });
  }

  return new Response(body, {
    status: 200,
    headers: {
      "cache-control": "no-store",
      "content-type": "application/rss+xml; charset=utf-8",
    },
  });
}
