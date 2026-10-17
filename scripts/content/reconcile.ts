import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";

import {
  assertArchivePost,
  assertContentArchive,
  comparePosts,
} from "./archive.js";
import {
  ARCHIVE_SCHEMA_VERSION,
  type ArchiveMedia,
  type ArchiveMediaChild,
  type ArchivePost,
  type ContentArchive,
  type ContentSource,
  type InstagramPost,
  type ReconciliationResult,
  type SourceReconciliationStats,
  type SubstackPost,
  type TikTokPost,
} from "./types.js";

function emptySourceStats(): SourceReconciliationStats {
  return {
    fetched: 0,
    added: 0,
    updated: 0,
    unchanged: 0,
    duplicates: 0,
  };
}

function mergeDefined<T extends object>(existing: T, incoming: T): T {
  const merged = { ...existing } as Record<string, unknown>;
  for (const [key, value] of Object.entries(incoming)) {
    if (value !== undefined && value !== null) {
      merged[key] = value;
    }
  }
  return merged as T;
}

function mergeSubstackPost(
  existing: SubstackPost,
  incoming: SubstackPost,
): SubstackPost {
  const merged: SubstackPost = {
    ...existing,
    ...incoming,
    slug: existing.slug,
    bodyHtml: incoming.bodyHtml || existing.bodyHtml,
    media: incoming.media.length > 0 ? incoming.media : existing.media,
    metadata: mergeDefined(existing.metadata, incoming.metadata),
  };
  if (incoming.description === undefined) {
    if (existing.description === undefined) {
      delete merged.description;
    } else {
      merged.description = existing.description;
    }
  }
  return merged;
}

function mergeInstagramPost(
  existing: InstagramPost,
  incoming: InstagramPost,
): InstagramPost {
  const merged: InstagramPost = {
    ...existing,
    ...incoming,
    media: mergeInstagramMedia(existing.media, incoming.media),
    metadata: mergeDefined(existing.metadata, incoming.metadata),
  };
  if (incoming.description === undefined) {
    if (existing.description === undefined) {
      delete merged.description;
    } else {
      merged.description = existing.description;
    }
  }
  return merged;
}

function mergeMediaChild(
  existing: ArchiveMediaChild,
  incoming: ArchiveMediaChild,
): ArchiveMediaChild {
  return {
    ...existing,
    ...incoming,
    sizes: {
      ...existing.sizes,
      ...incoming.sizes,
    },
  };
}

function mergeMediaItem(
  existing: ArchiveMedia,
  incoming: ArchiveMedia,
): ArchiveMedia {
  const merged: ArchiveMedia = {
    ...existing,
    ...incoming,
    ...(existing.sizes || incoming.sizes
      ? {
          sizes: {
            ...existing.sizes,
            ...incoming.sizes,
          },
        }
      : {}),
  };

  if (incoming.children === undefined) {
    if (existing.children === undefined) {
      delete merged.children;
    } else {
      merged.children = existing.children;
    }
  } else {
    const existingChildren = new Map(
      (existing.children ?? []).map((child) => [child.id, child]),
    );
    merged.children = incoming.children.map((child) => {
      const existingChild = existingChildren.get(child.id);
      return existingChild ? mergeMediaChild(existingChild, child) : child;
    });
  }
  return merged;
}

function mergeInstagramMedia(
  existing: ArchiveMedia[],
  incoming: ArchiveMedia[],
): ArchiveMedia[] {
  if (incoming.length === 0) {
    return existing;
  }

  const existingById = new Map(
    existing
      .filter(
        (media): media is ArchiveMedia & { id: string } =>
          media.id !== undefined,
      )
      .map((media) => [media.id, media]),
  );
  return incoming.map((media, index) => {
    const existingMedia =
      (media.id ? existingById.get(media.id) : undefined) ?? existing[index];
    return existingMedia ? mergeMediaItem(existingMedia, media) : media;
  });
}

function mergeTikTokPost(
  existing: TikTokPost,
  incoming: TikTokPost,
): TikTokPost {
  const merged: TikTokPost = {
    ...existing,
    ...incoming,
    media: mergeInstagramMedia(existing.media, incoming.media),
    metadata: mergeDefined(existing.metadata, incoming.metadata),
  };
  if (incoming.description === undefined) {
    if (existing.description === undefined) {
      delete merged.description;
    } else {
      merged.description = existing.description;
    }
  }
  return merged;
}

function mergePost(existing: ArchivePost, incoming: ArchivePost): ArchivePost {
  if (existing.source !== incoming.source) {
    throw new Error(
      `Incoming post "${incoming.id}" changed source from ${existing.source} to ${incoming.source}.`,
    );
  }
  if (existing.source === "substack" && incoming.source === "substack") {
    return mergeSubstackPost(existing, incoming);
  }
  if (existing.source === "instagram" && incoming.source === "instagram") {
    return mergeInstagramPost(existing, incoming);
  }
  if (existing.source === "tiktok" && incoming.source === "tiktok") {
    return mergeTikTokPost(existing, incoming);
  }
  throw new Error(`Unable to reconcile post "${incoming.id}".`);
}

function claimStableSlug(
  post: SubstackPost,
  ownersBySlug: Map<string, string>,
): SubstackPost {
  const existingOwner = ownersBySlug.get(post.slug);
  if (!existingOwner || existingOwner === post.id) {
    ownersBySlug.set(post.slug, post.id);
    return post;
  }

  const hash = createHash("sha256").update(post.sourceId).digest("hex");
  let suffixLength = 8;
  let candidate = `${post.slug}-${hash.slice(0, suffixLength)}`;
  while (ownersBySlug.has(candidate) && ownersBySlug.get(candidate) !== post.id) {
    suffixLength += 4;
    if (suffixLength > hash.length) {
      throw new Error(`Unable to resolve slug collision for "${post.id}".`);
    }
    candidate = `${post.slug}-${hash.slice(0, suffixLength)}`;
  }

  ownersBySlug.set(candidate, post.id);
  return { ...post, slug: candidate };
}

function incrementFetched(
  source: ContentSource,
  stats: Record<ContentSource, SourceReconciliationStats>,
): void {
  stats[source].fetched += 1;
}

export function reconcile(
  existingArchive: ContentArchive,
  incomingPosts: ArchivePost[],
): ReconciliationResult {
  assertContentArchive(existingArchive);

  const postsById = new Map(
    existingArchive.posts.map((post) => [post.id, post]),
  );
  const ownersBySlug = new Map(
    existingArchive.posts
      .filter((post): post is SubstackPost => post.source === "substack")
      .map((post) => [post.slug, post.id]),
  );
  const bySource: Record<ContentSource, SourceReconciliationStats> = {
    instagram: emptySourceStats(),
    substack: emptySourceStats(),
    tiktok: emptySourceStats(),
  };
  const seenIncoming = new Map<string, ArchivePost>();

  const sortedIncoming = [...incomingPosts].sort((left, right) =>
    left.id === right.id ? 0 : left.id < right.id ? -1 : 1,
  );

  for (const incoming of sortedIncoming) {
    assertArchivePost(incoming, `incoming post "${incoming.id}"`);
    incrementFetched(incoming.source, bySource);

    const duplicate = seenIncoming.get(incoming.id);
    if (duplicate) {
      if (!isDeepStrictEqual(duplicate, incoming)) {
        throw new Error(
          `Incoming content contains conflicting records for "${incoming.id}".`,
        );
      }
      bySource[incoming.source].duplicates += 1;
      continue;
    }
    seenIncoming.set(incoming.id, incoming);

    const existing = postsById.get(incoming.id);
    if (!existing) {
      const inserted =
        incoming.source === "substack"
          ? claimStableSlug(incoming, ownersBySlug)
          : incoming;
      postsById.set(inserted.id, inserted);
      bySource[incoming.source].added += 1;
      continue;
    }

    const merged = mergePost(existing, incoming);
    if (isDeepStrictEqual(existing, merged)) {
      bySource[incoming.source].unchanged += 1;
      continue;
    }

    postsById.set(merged.id, merged);
    bySource[incoming.source].updated += 1;
  }

  const archive: ContentArchive = {
    schemaVersion: ARCHIVE_SCHEMA_VERSION,
    posts: [...postsById.values()].sort(comparePosts),
  };
  assertContentArchive(archive);

  return {
    archive,
    stats: {
      bySource,
      totalAdded:
        bySource.instagram.added +
        bySource.substack.added +
        bySource.tiktok.added,
      totalUpdated:
        bySource.instagram.updated +
        bySource.substack.updated +
        bySource.tiktok.updated,
      totalRecords: archive.posts.length,
    },
  };
}
