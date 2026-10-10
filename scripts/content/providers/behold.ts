import type {
  ArchiveMedia,
  ArchiveMediaChild,
  ColorPalette,
  ImageSizes,
  InstagramMediaType,
  InstagramPost,
} from "../types.js";

const MEDIA_TYPES = new Set<InstagramMediaType>([
  "CAROUSEL_ALBUM",
  "IMAGE",
  "VIDEO",
]);
const IMAGE_SIZE_NAMES = ["small", "medium", "large", "full"] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Invalid Behold feed: ${field} must be a nonempty string.`);
  }
  return value;
}

function optionalString(value: unknown, field: string): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== "string") {
    throw new Error(`Invalid Behold feed: ${field} must be a string.`);
  }
  return value;
}

function normalizeHttpUrl(value: unknown, field: string): string {
  const rawUrl = requireString(value, field);
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error(`Invalid Behold feed: ${field} must be a valid URL.`);
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error(`Invalid Behold feed: ${field} must use HTTP or HTTPS.`);
  }
  return url.toString();
}

function normalizeTimestamp(value: unknown, field: string): string {
  const rawTimestamp = requireString(value, field);
  const date = new Date(rawTimestamp);
  if (Number.isNaN(date.valueOf())) {
    throw new Error(`Invalid Behold feed: ${field} must be a valid date.`);
  }
  return date.toISOString();
}

function parseColorPalette(
  value: unknown,
  field: string,
): ColorPalette | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (!isRecord(value)) {
    throw new Error(`Invalid Behold feed: ${field} must be an object.`);
  }

  const palette: ColorPalette = {};
  for (const [name, color] of Object.entries(value)) {
    palette[name] = requireString(color, `${field}.${name}`);
  }
  return palette;
}

function parseImageSizes(value: unknown, field: string): ImageSizes {
  if (!isRecord(value)) {
    throw new Error(`Invalid Behold feed: ${field} must be an object.`);
  }

  const sizes: ImageSizes = {};
  for (const name of IMAGE_SIZE_NAMES) {
    const rawSize = value[name];
    if (!isRecord(rawSize)) {
      throw new Error(`Invalid Behold feed: ${field}.${name} is missing.`);
    }
    if (
      typeof rawSize.width !== "number" ||
      !Number.isFinite(rawSize.width) ||
      rawSize.width <= 0 ||
      typeof rawSize.height !== "number" ||
      !Number.isFinite(rawSize.height) ||
      rawSize.height <= 0
    ) {
      throw new Error(
        `Invalid Behold feed: ${field}.${name} dimensions must be positive numbers.`,
      );
    }
    sizes[name] = {
      mediaUrl: normalizeHttpUrl(
        rawSize.mediaUrl,
        `${field}.${name}.mediaUrl`,
      ),
      width: rawSize.width,
      height: rawSize.height,
    };
  }
  return sizes;
}

function parseMediaType(value: unknown, field: string): InstagramMediaType {
  if (!MEDIA_TYPES.has(value as InstagramMediaType)) {
    throw new Error(`Invalid Behold feed: ${field} is unsupported.`);
  }
  return value as InstagramMediaType;
}

function parseStringArray(
  value: unknown,
  field: string,
): string[] | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (
    !Array.isArray(value) ||
    value.some((entry) => typeof entry !== "string")
  ) {
    throw new Error(`Invalid Behold feed: ${field} must be a string array.`);
  }
  return [...value];
}

function parseOptionalCount(
  value: unknown,
  field: string,
): number | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new Error(`Invalid Behold feed: ${field} must be a positive number.`);
  }
  return value;
}

function parseChild(value: unknown, field: string): ArchiveMediaChild {
  if (!isRecord(value)) {
    throw new Error(`Invalid Behold feed: ${field} must be an object.`);
  }
  const mediaType = parseMediaType(value.mediaType, `${field}.mediaType`);
  if (mediaType === "CAROUSEL_ALBUM") {
    throw new Error(
      `Invalid Behold feed: ${field}.mediaType cannot be CAROUSEL_ALBUM.`,
    );
  }

  const altText = optionalString(value.altText, `${field}.altText`);
  const thumbnailUrl =
    value.thumbnailUrl === undefined || value.thumbnailUrl === null
      ? undefined
      : normalizeHttpUrl(value.thumbnailUrl, `${field}.thumbnailUrl`);
  const colorPalette = parseColorPalette(
    value.colorPalette,
    `${field}.colorPalette`,
  );

  return {
    id: requireString(value.id, `${field}.id`),
    mediaType,
    mediaUrl: normalizeHttpUrl(value.mediaUrl, `${field}.mediaUrl`),
    sizes: parseImageSizes(value.sizes, `${field}.sizes`),
    ...(altText !== undefined ? { altText } : {}),
    ...(thumbnailUrl !== undefined ? { thumbnailUrl } : {}),
    ...(colorPalette !== undefined ? { colorPalette } : {}),
  };
}

function parsePost(value: unknown, index: number): InstagramPost {
  const field = `posts[${index}]`;
  if (!isRecord(value)) {
    throw new Error(`Invalid Behold feed: ${field} must be an object.`);
  }

  const sourceId = requireString(value.id, `${field}.id`);
  const mediaType = parseMediaType(value.mediaType, `${field}.mediaType`);
  const caption = optionalString(value.caption, `${field}.caption`);
  const prunedCaption = optionalString(
    value.prunedCaption,
    `${field}.prunedCaption`,
  );
  const altText = optionalString(value.altText, `${field}.altText`);
  const thumbnailUrl =
    value.thumbnailUrl === undefined || value.thumbnailUrl === null
      ? undefined
      : normalizeHttpUrl(value.thumbnailUrl, `${field}.thumbnailUrl`);
  const colorPalette = parseColorPalette(
    value.colorPalette,
    `${field}.colorPalette`,
  );
  const hashtags = parseStringArray(value.hashtags, `${field}.hashtags`);
  const mentions = parseStringArray(value.mentions, `${field}.mentions`);
  const likeCount = parseOptionalCount(value.likeCount, `${field}.likeCount`);
  const commentsCount = parseOptionalCount(
    value.commentsCount,
    `${field}.commentsCount`,
  );

  let isReel: boolean | undefined;
  if (value.isReel !== undefined && value.isReel !== null) {
    if (typeof value.isReel !== "boolean") {
      throw new Error(
        `Invalid Behold feed: ${field}.isReel must be a boolean.`,
      );
    }
    isReel = value.isReel;
  }

  let children: ArchiveMediaChild[] | undefined;
  if (value.children !== undefined && value.children !== null) {
    if (!Array.isArray(value.children)) {
      throw new Error(
        `Invalid Behold feed: ${field}.children must be an array.`,
      );
    }
    children = value.children.map((child, childIndex) =>
      parseChild(child, `${field}.children[${childIndex}]`),
    );
  }
  if (
    mediaType === "CAROUSEL_ALBUM" &&
    (!children || children.length === 0)
  ) {
    throw new Error(
      `Invalid Behold feed: ${field}.children is required for a carousel.`,
    );
  }

  const media: ArchiveMedia = {
    id: sourceId,
    mediaType,
    mediaUrl: normalizeHttpUrl(value.mediaUrl, `${field}.mediaUrl`),
    sizes: parseImageSizes(value.sizes, `${field}.sizes`),
    ...(altText !== undefined ? { altText } : {}),
    ...(thumbnailUrl !== undefined ? { thumbnailUrl } : {}),
    ...(colorPalette !== undefined ? { colorPalette } : {}),
    ...(children !== undefined ? { children } : {}),
  };

  const description = prunedCaption ?? caption;
  return {
    id: `instagram:${sourceId}`,
    source: "instagram",
    sourceId,
    sourceUrl: normalizeHttpUrl(value.permalink, `${field}.permalink`),
    publishedAt: normalizeTimestamp(value.timestamp, `${field}.timestamp`),
    media: [media],
    metadata: {
      mediaType,
      ...(caption !== undefined ? { caption } : {}),
      ...(prunedCaption !== undefined ? { prunedCaption } : {}),
      ...(isReel !== undefined ? { isReel } : {}),
      ...(hashtags !== undefined ? { hashtags } : {}),
      ...(mentions !== undefined ? { mentions } : {}),
      ...(likeCount !== undefined ? { likeCount } : {}),
      ...(commentsCount !== undefined ? { commentsCount } : {}),
      ...(colorPalette !== undefined ? { colorPalette } : {}),
    },
    ...(description !== undefined ? { description } : {}),
  };
}

export function validateBeholdFeedUrl(value: unknown): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(
      "Missing BEHOLD_FEED_URL. Configure it in .env or your execution environment.",
    );
  }

  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error(
      "Invalid BEHOLD_FEED_URL. Use the HTTPS JSON feed URL from Behold.",
    );
  }

  const feedId = url.pathname.split("/").filter(Boolean);
  if (
    url.protocol !== "https:" ||
    url.hostname !== "feeds.behold.so" ||
    url.username !== "" ||
    url.password !== "" ||
    url.search !== "" ||
    url.hash !== "" ||
    feedId.length !== 1 ||
    !/^[A-Za-z0-9_-]+$/.test(feedId[0])
  ) {
    throw new Error(
      "Invalid BEHOLD_FEED_URL. Expected https://feeds.behold.so/FEED_ID.",
    );
  }

  return url.toString();
}

export function parseBeholdFeed(value: unknown): InstagramPost[] {
  if (!isRecord(value)) {
    throw new Error("Invalid Behold feed: response must be an object.");
  }
  if (!Array.isArray(value.posts)) {
    throw new Error("Invalid Behold feed: response is missing the posts array.");
  }
  return value.posts.map(parsePost);
}

export async function fetchBeholdPosts(
  feedUrl: string,
  fetchImpl: typeof fetch = fetch,
): Promise<InstagramPost[]> {
  const validatedUrl = validateBeholdFeedUrl(feedUrl);

  let response: Response;
  try {
    response = await fetchImpl(validatedUrl, {
      headers: {
        accept: "application/json",
        "user-agent": "EveryWoman content synchronizer",
      },
    });
  } catch (error) {
    throw new Error(
      "Unable to fetch the Behold feed. Verify BEHOLD_FEED_URL and feed access settings.",
      { cause: error },
    );
  }

  if (!response.ok) {
    throw new Error(
      `Behold feed request failed with HTTP ${response.status}. Verify the feed configuration and access settings.`,
    );
  }

  let json: unknown;
  try {
    json = JSON.parse(await response.text());
  } catch (error) {
    throw new Error("Behold feed returned malformed JSON.", { cause: error });
  }
  return parseBeholdFeed(json);
}
