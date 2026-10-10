import {
  ARCHIVE_SCHEMA_VERSION,
  type ContentArchive,
  type InstagramPost,
  type SubstackPost,
} from "../types.js";

export function emptyArchive(): ContentArchive {
  return {
    schemaVersion: ARCHIVE_SCHEMA_VERSION,
    posts: [],
  };
}

export function makeSubstackPost(
  overrides: Partial<SubstackPost> = {},
): SubstackPost {
  const sourceId = overrides.sourceId ?? "substack-guid-1";
  return {
    id: `substack:${sourceId}`,
    source: "substack",
    sourceId,
    sourceUrl: "https://everywomanhealth.substack.com/p/original-slug",
    slug: "original-slug",
    title: "Original title",
    publishedAt: "2026-09-20T15:00:00.000Z",
    description: "Original description",
    bodyHtml: "<p>Original body.</p>",
    media: [],
    metadata: {
      author: "EveryWoman",
    },
    ...overrides,
  };
}

export function makeInstagramPost(
  overrides: Partial<InstagramPost> = {},
): InstagramPost {
  const sourceId = overrides.sourceId ?? "instagram-id-1";
  return {
    id: `instagram:${sourceId}`,
    source: "instagram",
    sourceId,
    sourceUrl: "https://www.instagram.com/p/example/",
    publishedAt: "2026-09-21T15:00:00.000Z",
    description: "An Instagram caption",
    media: [
      {
        id: sourceId,
        mediaType: "IMAGE",
        mediaUrl: "https://cdn.example.com/image.jpg",
      },
    ],
    metadata: {
      caption: "An Instagram caption #health",
      mediaType: "IMAGE",
      prunedCaption: "An Instagram caption",
    },
    ...overrides,
  };
}
