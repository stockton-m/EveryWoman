import type {
  ArchiveMedia,
  ArchiveMediaChild,
  ArchivePost,
  ContentArchive,
  InstagramPost,
} from "./types.js";
import {
  imageExtension,
  readThumbnailImage,
  writeThumbnail,
} from "./thumbnail-file.js";

export interface DownloadInstagramThumbnailsOptions {
  archive: ContentArchive;
  eligibleIds?: ReadonlySet<string>;
  fetchImpl?: typeof fetch;
  thumbnailDirectory: string;
  warn?: (message: string) => void;
}

export interface DownloadInstagramThumbnailsResult {
  archive: ContentArchive;
  downloaded: number;
  failed: number;
  skipped: number;
}

function isImageUrl(url: string): boolean {
  return !/\.mp4(\?|$)/i.test(url);
}

function sizedImageUrl(
  media: ArchiveMedia | ArchiveMediaChild,
): string | undefined {
  return (
    media.sizes?.medium?.mediaUrl ??
    media.sizes?.small?.mediaUrl ??
    media.sizes?.large?.mediaUrl ??
    media.sizes?.full?.mediaUrl ??
    media.thumbnailUrl
  );
}

export function instagramCoverUrl(post: InstagramPost): string | undefined {
  const media = post.media[0];
  if (!media) {
    return undefined;
  }

  const direct = sizedImageUrl(media);
  if (direct) {
    return direct;
  }

  for (const child of media.children ?? []) {
    const childUrl = sizedImageUrl(child);
    if (childUrl) {
      return childUrl;
    }
  }

  if (media.mediaUrl && isImageUrl(media.mediaUrl)) {
    return media.mediaUrl;
  }
  return undefined;
}

export function instagramPostsMissingThumbnails(
  archive: ContentArchive,
  eligibleIds?: ReadonlySet<string>,
): InstagramPost[] {
  return archive.posts.filter(
    (post): post is InstagramPost =>
      post.source === "instagram" &&
      post.metadata.thumbnailPath === undefined &&
      instagramCoverUrl(post) !== undefined &&
      (eligibleIds === undefined || eligibleIds.has(post.id)),
  );
}

async function downloadThumbnail(
  fetchImpl: typeof fetch,
  post: InstagramPost,
  thumbnailDirectory: string,
): Promise<string> {
  if (!/^[0-9]+$/.test(post.sourceId)) {
    throw new Error(
      `Instagram post ${post.id} has a sourceId that cannot be used as a file name.`,
    );
  }

  const coverUrl = instagramCoverUrl(post);
  if (coverUrl === undefined) {
    throw new Error(`Instagram post ${post.id} has no thumbnail URL.`);
  }

  let thumbnailUrl: URL;
  try {
    thumbnailUrl = new URL(coverUrl);
  } catch {
    throw new Error(`Instagram thumbnail for ${post.id} was not a URL.`);
  }
  if (thumbnailUrl.protocol !== "https:") {
    throw new Error(
      `Instagram thumbnail for ${post.id} was not an HTTPS URL.`,
    );
  }

  const bytes = await readThumbnailImage(
    fetchImpl,
    thumbnailUrl.toString(),
    post.id,
    "Instagram",
  );
  const extension = imageExtension(bytes);
  if (extension === undefined) {
    throw new Error(
      `Instagram thumbnail for ${post.id} was not a JPEG, PNG, or WebP image.`,
    );
  }

  const relativePath = `instagram/${post.sourceId}.${extension}`;
  await writeThumbnail(
    thumbnailDirectory,
    `${post.sourceId}.${extension}`,
    bytes,
  );
  return relativePath;
}

export async function downloadMissingInstagramThumbnails({
  archive,
  eligibleIds,
  fetchImpl = fetch,
  thumbnailDirectory,
  warn = (message) => console.warn(message),
}: DownloadInstagramThumbnailsOptions): Promise<DownloadInstagramThumbnailsResult> {
  let downloaded = 0;
  let failed = 0;
  let skipped = 0;
  const posts: ArchivePost[] = [];

  for (const post of archive.posts) {
    if (post.source !== "instagram") {
      posts.push(post);
      continue;
    }
    if (eligibleIds !== undefined && !eligibleIds.has(post.id)) {
      skipped += 1;
      posts.push(post);
      continue;
    }
    if (
      post.metadata.thumbnailPath !== undefined ||
      instagramCoverUrl(post) === undefined
    ) {
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
          : `Unable to save an Instagram thumbnail for ${post.id}.`;
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
