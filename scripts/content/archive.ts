import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";

import {
  ARCHIVE_SCHEMA_VERSION,
  type ArchiveMedia,
  type ArchiveMediaChild,
  type ArchivePost,
  type ColorPalette,
  type ContentArchive,
  type ImageSizes,
  type InstagramMediaType,
} from "./types.js";

const MEDIA_TYPES = new Set<InstagramMediaType>([
  "CAROUSEL_ALBUM",
  "IMAGE",
  "VIDEO",
]);
const SIZE_NAMES = new Set(["full", "large", "medium", "small"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertNonemptyString(
  value: unknown,
  field: string,
): asserts value is string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Invalid content archive: ${field} must be a nonempty string.`);
  }
}

function assertOptionalString(value: unknown, field: string): void {
  if (value !== undefined && typeof value !== "string") {
    throw new Error(`Invalid content archive: ${field} must be a string.`);
  }
}

function assertOptionalNumber(value: unknown, field: string): void {
  if (
    value !== undefined &&
    (typeof value !== "number" || !Number.isFinite(value))
  ) {
    throw new Error(`Invalid content archive: ${field} must be a number.`);
  }
}

function assertHttpUrl(value: unknown, field: string): asserts value is string {
  assertNonemptyString(value, field);

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`Invalid content archive: ${field} must be a valid URL.`);
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error(`Invalid content archive: ${field} must use HTTP or HTTPS.`);
  }
}

function assertIsoTimestamp(
  value: unknown,
  field: string,
): asserts value is string {
  assertNonemptyString(value, field);
  const date = new Date(value);
  if (Number.isNaN(date.valueOf()) || date.toISOString() !== value) {
    throw new Error(
      `Invalid content archive: ${field} must be a normalized ISO 8601 timestamp.`,
    );
  }
}

function assertColorPalette(
  value: unknown,
  field: string,
): asserts value is ColorPalette {
  if (!isRecord(value)) {
    throw new Error(`Invalid content archive: ${field} must be an object.`);
  }

  for (const [name, color] of Object.entries(value)) {
    assertNonemptyString(name, `${field} key`);
    assertNonemptyString(color, `${field}.${name}`);
  }
}

function assertImageSizes(
  value: unknown,
  field: string,
): asserts value is ImageSizes {
  if (!isRecord(value)) {
    throw new Error(`Invalid content archive: ${field} must be an object.`);
  }

  for (const [name, size] of Object.entries(value)) {
    if (!SIZE_NAMES.has(name) || !isRecord(size)) {
      throw new Error(`Invalid content archive: ${field}.${name} is invalid.`);
    }

    assertHttpUrl(size.mediaUrl, `${field}.${name}.mediaUrl`);
    if (
      typeof size.height !== "number" ||
      !Number.isFinite(size.height) ||
      size.height <= 0 ||
      typeof size.width !== "number" ||
      !Number.isFinite(size.width) ||
      size.width <= 0
    ) {
      throw new Error(
        `Invalid content archive: ${field}.${name} dimensions must be positive numbers.`,
      );
    }
  }
}

function assertMediaChild(
  value: unknown,
  field: string,
): asserts value is ArchiveMediaChild {
  if (!isRecord(value)) {
    throw new Error(`Invalid content archive: ${field} must be an object.`);
  }

  assertNonemptyString(value.id, `${field}.id`);
  if (value.mediaType !== "IMAGE" && value.mediaType !== "VIDEO") {
    throw new Error(`Invalid content archive: ${field}.mediaType is invalid.`);
  }
  assertHttpUrl(value.mediaUrl, `${field}.mediaUrl`);
  assertOptionalString(value.altText, `${field}.altText`);
  assertOptionalString(value.thumbnailUrl, `${field}.thumbnailUrl`);
  if (value.thumbnailUrl !== undefined) {
    assertHttpUrl(value.thumbnailUrl, `${field}.thumbnailUrl`);
  }
  assertImageSizes(value.sizes, `${field}.sizes`);
  if (value.colorPalette !== undefined) {
    assertColorPalette(value.colorPalette, `${field}.colorPalette`);
  }
}

function assertMedia(
  value: unknown,
  field: string,
): asserts value is ArchiveMedia {
  if (!isRecord(value)) {
    throw new Error(`Invalid content archive: ${field} must be an object.`);
  }

  if (!MEDIA_TYPES.has(value.mediaType as InstagramMediaType)) {
    throw new Error(`Invalid content archive: ${field}.mediaType is invalid.`);
  }
  assertHttpUrl(value.mediaUrl, `${field}.mediaUrl`);
  assertOptionalString(value.id, `${field}.id`);
  assertOptionalString(value.altText, `${field}.altText`);
  assertOptionalString(value.thumbnailUrl, `${field}.thumbnailUrl`);
  if (value.thumbnailUrl !== undefined) {
    assertHttpUrl(value.thumbnailUrl, `${field}.thumbnailUrl`);
  }
  if (value.sizes !== undefined) {
    assertImageSizes(value.sizes, `${field}.sizes`);
  }
  if (value.colorPalette !== undefined) {
    assertColorPalette(value.colorPalette, `${field}.colorPalette`);
  }
  if (value.children !== undefined) {
    if (!Array.isArray(value.children)) {
      throw new Error(`Invalid content archive: ${field}.children must be an array.`);
    }
    value.children.forEach((child, index) =>
      assertMediaChild(child, `${field}.children[${index}]`),
    );
  }
}

function assertStringArray(value: unknown, field: string): void {
  if (
    !Array.isArray(value) ||
    value.some((entry) => typeof entry !== "string")
  ) {
    throw new Error(`Invalid content archive: ${field} must be a string array.`);
  }
}

export function assertArchivePost(
  value: unknown,
  field = "post",
): asserts value is ArchivePost {
  if (!isRecord(value)) {
    throw new Error(`Invalid content archive: ${field} must be an object.`);
  }

  assertNonemptyString(value.id, `${field}.id`);
  assertNonemptyString(value.sourceId, `${field}.sourceId`);
  assertHttpUrl(value.sourceUrl, `${field}.sourceUrl`);
  assertIsoTimestamp(value.publishedAt, `${field}.publishedAt`);
  assertOptionalString(value.description, `${field}.description`);

  if (value.source !== "instagram" && value.source !== "substack") {
    throw new Error(`Invalid content archive: ${field}.source is invalid.`);
  }
  if (value.id !== `${value.source}:${value.sourceId}`) {
    throw new Error(
      `Invalid content archive: ${field}.id must be derived from source and sourceId.`,
    );
  }
  if (!Array.isArray(value.media)) {
    throw new Error(`Invalid content archive: ${field}.media must be an array.`);
  }
  value.media.forEach((media, index) =>
    assertMedia(media, `${field}.media[${index}]`),
  );
  if (!isRecord(value.metadata)) {
    throw new Error(`Invalid content archive: ${field}.metadata must be an object.`);
  }

  if (value.source === "substack") {
    assertNonemptyString(value.slug, `${field}.slug`);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.slug)) {
      throw new Error(`Invalid content archive: ${field}.slug is not route-safe.`);
    }
    assertNonemptyString(value.title, `${field}.title`);
    assertNonemptyString(value.bodyHtml, `${field}.bodyHtml`);
    assertOptionalString(value.metadata.author, `${field}.metadata.author`);
    return;
  }

  if (!MEDIA_TYPES.has(value.metadata.mediaType as InstagramMediaType)) {
    throw new Error(
      `Invalid content archive: ${field}.metadata.mediaType is invalid.`,
    );
  }
  assertOptionalString(value.metadata.caption, `${field}.metadata.caption`);
  assertOptionalString(
    value.metadata.prunedCaption,
    `${field}.metadata.prunedCaption`,
  );
  assertOptionalNumber(value.metadata.likeCount, `${field}.metadata.likeCount`);
  assertOptionalNumber(
    value.metadata.commentsCount,
    `${field}.metadata.commentsCount`,
  );
  if (
    value.metadata.isReel !== undefined &&
    typeof value.metadata.isReel !== "boolean"
  ) {
    throw new Error(
      `Invalid content archive: ${field}.metadata.isReel must be a boolean.`,
    );
  }
  if (value.metadata.hashtags !== undefined) {
    assertStringArray(value.metadata.hashtags, `${field}.metadata.hashtags`);
  }
  if (value.metadata.mentions !== undefined) {
    assertStringArray(value.metadata.mentions, `${field}.metadata.mentions`);
  }
  if (value.metadata.colorPalette !== undefined) {
    assertColorPalette(
      value.metadata.colorPalette,
      `${field}.metadata.colorPalette`,
    );
  }
  if (value.media.length === 0) {
    throw new Error(`Invalid content archive: ${field}.media must not be empty.`);
  }
}

export function assertContentArchive(
  value: unknown,
): asserts value is ContentArchive {
  if (!isRecord(value)) {
    throw new Error("Invalid content archive: root must be an object.");
  }
  if (value.schemaVersion !== ARCHIVE_SCHEMA_VERSION) {
    throw new Error(
      `Invalid content archive: expected schemaVersion ${ARCHIVE_SCHEMA_VERSION}.`,
    );
  }
  if (!Array.isArray(value.posts)) {
    throw new Error("Invalid content archive: posts must be an array.");
  }

  const ids = new Set<string>();
  const substackSlugs = new Set<string>();
  value.posts.forEach((post, index) => {
    assertArchivePost(post, `posts[${index}]`);
    if (ids.has(post.id)) {
      throw new Error(`Invalid content archive: duplicate post ID "${post.id}".`);
    }
    ids.add(post.id);

    if (post.source === "substack") {
      if (substackSlugs.has(post.slug)) {
        throw new Error(
          `Invalid content archive: duplicate Substack slug "${post.slug}".`,
        );
      }
      substackSlugs.add(post.slug);
    }
  });
}

export function parseArchiveJson(json: string): ContentArchive {
  let value: unknown;
  try {
    value = JSON.parse(json);
  } catch (error) {
    throw new Error("Content archive is not valid JSON.", { cause: error });
  }

  assertContentArchive(value);
  return value;
}

export function comparePosts(left: ArchivePost, right: ArchivePost): number {
  if (left.publishedAt !== right.publishedAt) {
    return left.publishedAt > right.publishedAt ? -1 : 1;
  }
  if (left.id === right.id) {
    return 0;
  }
  return left.id < right.id ? -1 : 1;
}

function stabilize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stabilize);
  }
  if (!isRecord(value)) {
    return value;
  }

  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, stabilize(value[key])]),
  );
}

export function serializeArchive(archive: ContentArchive): string {
  assertContentArchive(archive);
  const stableArchive = {
    schemaVersion: ARCHIVE_SCHEMA_VERSION,
    posts: [...archive.posts].sort(comparePosts).map(stabilize),
  };
  return `${JSON.stringify(stableArchive, null, 2)}\n`;
}

export async function readArchiveFile(
  archivePath: string,
): Promise<{ archive: ContentArchive; raw: string }> {
  const raw = await readFile(archivePath, "utf8");
  return { archive: parseArchiveJson(raw), raw };
}

export async function writeArchiveAtomic(
  archivePath: string,
  serializedArchive: string,
): Promise<void> {
  const directory = dirname(archivePath);
  const temporaryPath = join(
    directory,
    `.${basename(archivePath)}.${process.pid}.${randomUUID()}.tmp`,
  );

  await mkdir(directory, { recursive: true });
  try {
    await writeFile(temporaryPath, serializedArchive, {
      encoding: "utf8",
      flag: "wx",
    });
    await rename(temporaryPath, archivePath);
  } finally {
    await rm(temporaryPath, { force: true });
  }
}
