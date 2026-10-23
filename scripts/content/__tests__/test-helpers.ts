import {
  ARCHIVE_SCHEMA_VERSION,
  type ContentArchive,
  type InstagramPost,
  type SubstackPost,
  type TikTokPost,
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

export function makeTikTokPost(
  overrides: Partial<TikTokPost> = {},
): TikTokPost {
  const sourceId = overrides.sourceId ?? "7685236720534637837";
  return {
    id: `tiktok:${sourceId}`,
    source: "tiktok",
    sourceId,
    sourceUrl: `https://www.tiktok.com/@everywomanhealth/video/${sourceId}`,
    publishedAt: "2026-09-14T04:04:00.000Z",
    description: "Feeling initimadated by the weight room, ladies?",
    media: [],
    metadata: {
      author: "everywomanhealth",
      caption: "Feeling initimadated by the weight room, ladies? #womenshealth",
      durationSeconds: 66,
      hashtags: ["womenshealth"],
      prunedCaption: "Feeling initimadated by the weight room, ladies?",
    },
    ...overrides,
  };
}
