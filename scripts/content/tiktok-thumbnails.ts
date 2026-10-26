import type { ArchivePost, ContentArchive, TikTokPost } from "./types.js";
import {
  imageExtension,
  readThumbnailImage,
  writeThumbnail,
} from "./thumbnail-file.js";

const OEMBED_ENDPOINT = "https://www.tiktok.com/oembed";

export interface DownloadTikTokThumbnailsOptions {
  archive: ContentArchive;
  fetchImpl?: typeof fetch;
  thumbnailDirectory: string;
  warn?: (message: string) => void;
}

export interface DownloadTikTokThumbnailsResult {
  archive: ContentArchive;
  downloaded: number;
  failed: number;
  skipped: number;
}

export function tiktokPostsMissingThumbnails(
  archive: ContentArchive,
): TikTokPost[] {
  return archive.posts.filter(
    (post): post is TikTokPost =>
      post.source === "tiktok" && post.metadata.thumbnailPath === undefined,
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function fetchOEmbedThumbnailUrl(
  fetchImpl: typeof fetch,
  post: TikTokPost,
): Promise<string> {
  const endpoint = new URL(OEMBED_ENDPOINT);
  endpoint.searchParams.set("url", post.sourceUrl);

  let response: Response;
  try {
    response = await fetchImpl(endpoint, {
      headers: {
        accept: "application/json",
        "user-agent": "EveryWoman content synchronizer",
      },
      signal: AbortSignal.timeout(15_000),
    });
  } catch (error) {
    throw new Error(`TikTok oEmbed request failed for ${post.id}.`, {
      cause: error,
    });
  }

  if (!response.ok) {
    throw new Error(
      `TikTok oEmbed request failed for ${post.id} with HTTP ${response.status}.`,
    );
  }

  let payload: unknown;
  try {
    payload = JSON.parse(await response.text());
  } catch (error) {
    throw new Error(`TikTok oEmbed returned malformed JSON for ${post.id}.`, {
      cause: error,
    });
  }

  if (!isRecord(payload) || payload.thumbnail_url === undefined) {
    throw new Error(`TikTok oEmbed did not include a thumbnail for ${post.id}.`);
  }
  if (typeof payload.thumbnail_url !== "string") {
    throw new Error(`TikTok oEmbed thumbnail for ${post.id} was not a URL.`);
  }

  let thumbnailUrl: URL;
  try {
    thumbnailUrl = new URL(payload.thumbnail_url);
  } catch {
    throw new Error(`TikTok oEmbed thumbnail for ${post.id} was not a URL.`);
  }
  if (thumbnailUrl.protocol !== "https:") {
    throw new Error(
      `TikTok oEmbed thumbnail for ${post.id} was not an HTTPS URL.`,
    );
  }
  return thumbnailUrl.toString();
}

async function downloadThumbnail(
  fetchImpl: typeof fetch,
  post: TikTokPost,
  thumbnailDirectory: string,
): Promise<string> {
  if (!/^[0-9]+$/.test(post.sourceId)) {
    throw new Error(
      `TikTok post ${post.id} has a sourceId that cannot be used as a file name.`,
    );
  }

  const thumbnailUrl = await fetchOEmbedThumbnailUrl(fetchImpl, post);
  const bytes = await readThumbnailImage(
    fetchImpl,
    thumbnailUrl,
    post.id,
    "TikTok",
  );
  const extension = imageExtension(bytes);
  if (extension === undefined) {
    throw new Error(
      `TikTok thumbnail for ${post.id} was not a JPEG, PNG, or WebP image.`,
    );
  }

  const relativePath = `tiktok/${post.sourceId}.${extension}`;
  await writeThumbnail(
    thumbnailDirectory,
    `${post.sourceId}.${extension}`,
    bytes,
  );
  return relativePath;
}

export async function downloadMissingTikTokThumbnails({
  archive,
  fetchImpl = fetch,
  thumbnailDirectory,
  warn = (message) => console.warn(message),
}: DownloadTikTokThumbnailsOptions): Promise<DownloadTikTokThumbnailsResult> {
  let downloaded = 0;
  let failed = 0;
  let skipped = 0;
  const posts: ArchivePost[] = [];

  for (const post of archive.posts) {
    if (post.source !== "tiktok") {
      posts.push(post);
      continue;
    }
    if (post.metadata.thumbnailPath !== undefined) {
      skipped += 1;
      posts.push(post);
      continue;
    }

    try {
      const thumbnailPath = await downloadThumbnail(
        fetchImpl,
        post,
        thumbnailDirectory,
      );
      downloaded += 1;
      posts.push({
        ...post,
        metadata: {
          ...post.metadata,
          thumbnailPath,
        },
      });
    } catch (error) {
      failed += 1;
      const message =
        error instanceof Error
          ? error.message
          : `Unable to save a TikTok thumbnail for ${post.id}.`;
      warn(message);
      posts.push(post);
    }
  }

  return {
    archive: {
      schemaVersion: archive.schemaVersion,
      posts,
    },
    downloaded,
    failed,
    skipped,
  };
}
