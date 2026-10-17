import type { ArchiveMedia, TikTokPost } from "../types.js";

const APIFY_API_ORIGIN = "https://api.apify.com";
const EXPECTED_AUTHOR = "everywomanhealth";
const STALE_WARNING_MS = 3 * 24 * 60 * 60 * 1000;
const STALE_ERROR_MS = 7 * 24 * 60 * 60 * 1000;
const NAMED_TASK_ID = /^[A-Za-z0-9_-]+~[A-Za-z0-9_-]+$/;
const OWNER_TASK_ID = /^~[A-Za-z0-9_-]+$/;
const RAW_TASK_ID = /^[A-Za-z0-9]{3,}$/;
const VIDEO_PATH = /^\/@([^/]+)\/video\/(\d+)\/?$/;

const COVER_FIELDS = [
  "videoMeta.coverUrl",
  "videoMeta.originalCoverUrl",
  "covers.default",
  "coverUrl",
] as const;

export interface FetchTikTokPostsOptions {
  fetchImpl?: typeof fetch;
  now?: () => Date;
  taskId: string;
  token: string;
  warn?: (message: string) => void;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Invalid TikTok dataset: ${field} must be a nonempty string.`);
  }
  return value;
}

function readPath(record: Record<string, unknown>, path: string): unknown {
  if (Object.prototype.hasOwnProperty.call(record, path)) {
    return record[path];
  }

  const parts = path.split(".");
  let current: unknown = record;
  for (const part of parts) {
    if (!isRecord(current) || !Object.prototype.hasOwnProperty.call(current, part)) {
      return undefined;
    }
    current = current[part];
  }
  return current;
}

export function validateApifyToken(value: unknown): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(
      "Missing APIFY_TOKEN. Configure it in .env or your execution environment.",
    );
  }

  const token = value.trim();
  if (/\s/.test(token)) {
    throw new Error("Invalid APIFY_TOKEN.");
  }
  return token;
}

export function validateApifyTaskId(value: unknown): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(
      "Missing APIFY_TASK_ID. Configure it in .env or your execution environment.",
    );
  }

  let taskId = value.trim().replace(/^\/+|\/+$/g, "");
  if (!taskId.includes("~") && taskId.split("/").length === 2) {
    const [username, taskName] = taskId.split("/");
    taskId = `${username}~${taskName}`;
  }

  if (
    !NAMED_TASK_ID.test(taskId) &&
    !OWNER_TASK_ID.test(taskId) &&
    !RAW_TASK_ID.test(taskId)
  ) {
    throw new Error(
      "Invalid APIFY_TASK_ID. Expected username~task-name, such as everywoman~everywoman-tiktok.",
    );
  }

  return taskId;
}

function isEphemeralMediaUrl(url: URL): boolean {
  const host = url.hostname.toLowerCase();
  if (host.includes("tiktokcdn")) {
    return true;
  }

  for (const key of url.searchParams.keys()) {
    const normalized = key.toLowerCase();
    if (
      normalized === "x-expires" ||
      normalized === "x-signature" ||
      normalized === "expires" ||
      normalized === "signature"
    ) {
      return true;
    }
  }

  return false;
}

function readStableCover(
  record: Record<string, unknown>,
  field: string,
): string | undefined {
  for (const coverField of COVER_FIELDS) {
    const value = readPath(record, coverField);
    if (value === undefined || value === null || value === "") {
      continue;
    }
    if (typeof value !== "string") {
      throw new Error(
        `Invalid TikTok dataset: ${field}.${coverField} must be a string.`,
      );
    }

    let url: URL;
    try {
      url = new URL(value);
    } catch {
      throw new Error(
        `Invalid TikTok dataset: ${field}.${coverField} must be a valid URL.`,
      );
    }
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      throw new Error(
        `Invalid TikTok dataset: ${field}.${coverField} must use HTTP or HTTPS.`,
      );
    }
    if (isEphemeralMediaUrl(url)) {
      continue;
    }
    return url.toString();
  }

  return undefined;
}

function splitCaption(text: string): {
  caption: string;
  hashtags: string[];
  prunedCaption: string;
} {
  const caption = text.trim();
  const hashtags: string[] = [];
  const seen = new Set<string>();
  const prunedCaption = caption
    .replace(/#[\p{L}\p{N}_]+/gu, (tag) => {
      const name = tag.slice(1);
      if (!seen.has(name)) {
        seen.add(name);
        hashtags.push(name);
      }
      return "";
    })
    .replace(/\s+/g, " ")
    .trim();

  return { caption, hashtags, prunedCaption };
}

function parseVideoIdentity(
  record: Record<string, unknown>,
  field: string,
): { sourceUrl: string; videoId: string } {
  const rawUrl = requireString(readPath(record, "webVideoUrl"), `${field}.webVideoUrl`);
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error(`Invalid TikTok dataset: ${field}.webVideoUrl must be a valid URL.`);
  }

  const match = VIDEO_PATH.exec(url.pathname);
  if (url.protocol !== "https:" || url.hostname !== "www.tiktok.com" || !match) {
    throw new Error(
      `Invalid TikTok dataset: ${field}.webVideoUrl must be a TikTok video URL.`,
    );
  }

  const username = match[1]?.toLowerCase();
  const videoId = match[2];
  if (!videoId || username !== EXPECTED_AUTHOR) {
    throw new Error(
      `Invalid TikTok dataset: ${field} is not an @${EXPECTED_AUTHOR} post.`,
    );
  }

  const author = readPath(record, "authorMeta.name");
  if (typeof author !== "string" || author.trim().toLowerCase() !== EXPECTED_AUTHOR) {
    throw new Error(
      `Invalid TikTok dataset: ${field} is not an @${EXPECTED_AUTHOR} post.`,
    );
  }

  return {
    videoId,
    sourceUrl: `https://www.tiktok.com/@${EXPECTED_AUTHOR}/video/${videoId}`,
  };
}

function parsePublishedAt(value: unknown, field: string): string {
  const rawTimestamp = requireString(value, field);
  const date = new Date(rawTimestamp);
  if (Number.isNaN(date.valueOf())) {
    throw new Error(`Invalid TikTok dataset: ${field} must be a valid date.`);
  }
  return date.toISOString();
}

function parseDuration(value: unknown, field: string): number | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new Error(
      `Invalid TikTok dataset: ${field} must be zero or greater.`,
    );
  }
  return value;
}

function parseItem(value: unknown, index: number): TikTokPost {
  const field = `items[${index}]`;
  if (!isRecord(value)) {
    throw new Error(`Invalid TikTok dataset: ${field} must be an object.`);
  }

  const { sourceUrl, videoId } = parseVideoIdentity(value, field);
  const text = readPath(value, "text");
  if (typeof text !== "string") {
    throw new Error(`Invalid TikTok dataset: ${field}.text must be a string.`);
  }

  const { caption, hashtags, prunedCaption } = splitCaption(text);
  const durationSeconds = parseDuration(
    readPath(value, "videoMeta.duration"),
    `${field}.videoMeta.duration`,
  );
  const coverUrl = readStableCover(value, field);
  const media: ArchiveMedia[] = coverUrl
    ? [
        {
          id: videoId,
          mediaType: "VIDEO",
          mediaUrl: coverUrl,
          thumbnailUrl: coverUrl,
        },
      ]
    : [];

  return {
    id: `tiktok:${videoId}`,
    source: "tiktok",
    sourceId: videoId,
    sourceUrl,
    publishedAt: parsePublishedAt(
      readPath(value, "createTimeISO"),
      `${field}.createTimeISO`,
    ),
    media,
    metadata: {
      author: EXPECTED_AUTHOR,
      ...(caption !== "" ? { caption } : {}),
      ...(prunedCaption !== "" ? { prunedCaption } : {}),
      ...(hashtags.length > 0 ? { hashtags } : {}),
      ...(durationSeconds !== undefined ? { durationSeconds } : {}),
    },
    ...(prunedCaption !== "" ? { description: prunedCaption } : {}),
  };
}

export function parseTikTokDataset(value: unknown): TikTokPost[] {
  if (!Array.isArray(value)) {
    throw new Error("Invalid TikTok dataset: response must be an array.");
  }
  if (value.length === 0) {
    throw new Error(
      "The latest successful Apify dataset contained no TikTok posts. The dataset was not treated as empty.",
    );
  }
  return value.map(parseItem);
}

function parseLastSuccessfulRun(value: unknown): {
  datasetId: string;
  finishedAt: string;
} {
  if (!isRecord(value) || !isRecord(value.data)) {
    throw new Error("Invalid Apify task run: response must include a data object.");
  }
  if (value.data.status !== "SUCCEEDED") {
    throw new Error(
      "The latest Apify task run did not succeed. The TikTok dataset was not treated as empty.",
    );
  }

  const datasetId = value.data.defaultDatasetId;
  if (typeof datasetId !== "string" || !/^[A-Za-z0-9]+$/.test(datasetId)) {
    throw new Error("Invalid Apify task run: defaultDatasetId is missing.");
  }

  if (typeof value.data.finishedAt !== "string" || value.data.finishedAt.trim() === "") {
    throw new Error(
      "The latest successful Apify task run has no finishedAt timestamp.",
    );
  }
  const finishedAt = new Date(value.data.finishedAt);
  if (Number.isNaN(finishedAt.valueOf())) {
    throw new Error(
      "The latest successful Apify task run has no finishedAt timestamp.",
    );
  }

  return {
    datasetId,
    finishedAt: finishedAt.toISOString(),
  };
}

function assertDatasetFreshness(
  finishedAt: string,
  now: Date,
  warn: (message: string) => void,
): void {
  const age = now.getTime() - new Date(finishedAt).getTime();
  if (age > STALE_ERROR_MS) {
    throw new Error(
      "The latest successful Apify task run is older than 7 days and was treated as expired. The TikTok dataset was not treated as empty.",
    );
  }
  if (age > STALE_WARNING_MS) {
    warn(
      "The latest successful Apify TikTok dataset is more than 3 days old. A scheduled scrape may have been missed.",
    );
  }
}

async function requestJson(
  fetchImpl: typeof fetch,
  url: string,
  token: string,
  failure: { notFound: string; label: string },
): Promise<unknown> {
  let response: Response;
  try {
    response = await fetchImpl(url, {
      method: "GET",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${token}`,
        "user-agent": "EveryWoman content synchronizer",
      },
    });
  } catch (error) {
    throw new Error(`Unable to reach Apify while requesting the ${failure.label}.`, {
      cause: error,
    });
  }

  if (response.status === 401 || response.status === 403) {
    throw new Error("Apify rejected the API token.");
  }
  if (response.status === 404) {
    throw new Error(failure.notFound);
  }
  if (!response.ok) {
    throw new Error(
      `Apify request for the ${failure.label} failed with HTTP ${response.status}.`,
    );
  }

  try {
    return JSON.parse(await response.text());
  } catch (error) {
    throw new Error("Apify returned malformed JSON.", { cause: error });
  }
}

export async function fetchTikTokPosts({
  fetchImpl = fetch,
  now = () => new Date(),
  taskId,
  token,
  warn = (message) => console.warn(message),
}: FetchTikTokPostsOptions): Promise<TikTokPost[]> {
  const validatedToken = validateApifyToken(token);
  const validatedTaskId = validateApifyTaskId(taskId);
  const runUrl = `${APIFY_API_ORIGIN}/v2/actor-tasks/${encodeURIComponent(validatedTaskId)}/runs/last?status=SUCCEEDED`;
  const run = await requestJson(fetchImpl, runUrl, validatedToken, {
    label: "latest successful Apify task run",
    notFound: `No successful Apify task run is available for ${validatedTaskId}. The TikTok dataset was not treated as empty.`,
  });
  const { datasetId, finishedAt } = parseLastSuccessfulRun(run);
  assertDatasetFreshness(finishedAt, now(), warn);

  const itemsUrl = `${APIFY_API_ORIGIN}/v2/datasets/${encodeURIComponent(datasetId)}/items?format=json`;
  const items = await requestJson(fetchImpl, itemsUrl, validatedToken, {
    label: "latest successful Apify dataset",
    notFound:
      "The dataset for the latest successful Apify task run is unavailable or expired.",
  });
  return parseTikTokDataset(items);
}
