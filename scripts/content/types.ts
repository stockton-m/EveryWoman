export const ARCHIVE_SCHEMA_VERSION = 1 as const;

export type ContentSource = "instagram" | "substack";
export type InstagramMediaType = "CAROUSEL_ALBUM" | "IMAGE" | "VIDEO";
export type ImageSizeName = "full" | "large" | "medium" | "small";

export interface ImageSize {
  height: number;
  mediaUrl: string;
  width: number;
}

export type ImageSizes = Partial<Record<ImageSizeName, ImageSize>>;

export type ColorPalette = Record<string, string>;

export interface ArchiveMediaChild {
  altText?: string;
  colorPalette?: ColorPalette;
  id: string;
  mediaType: Exclude<InstagramMediaType, "CAROUSEL_ALBUM">;
  mediaUrl: string;
  sizes: ImageSizes;
  thumbnailUrl?: string;
}

export interface ArchiveMedia {
  altText?: string;
  children?: ArchiveMediaChild[];
  colorPalette?: ColorPalette;
  id?: string;
  mediaType: InstagramMediaType;
  mediaUrl: string;
  sizes?: ImageSizes;
  thumbnailUrl?: string;
}

interface ArchivePostBase {
  description?: string;
  id: string;
  media: ArchiveMedia[];
  publishedAt: string;
  source: ContentSource;
  sourceId: string;
  sourceUrl: string;
}

export interface SubstackPost extends ArchivePostBase {
  bodyHtml: string;
  metadata: {
    author?: string;
  };
  slug: string;
  source: "substack";
  title: string;
}

export interface InstagramPost extends ArchivePostBase {
  metadata: {
    caption?: string;
    colorPalette?: ColorPalette;
    commentsCount?: number;
    hashtags?: string[];
    isReel?: boolean;
    likeCount?: number;
    mediaType: InstagramMediaType;
    mentions?: string[];
    prunedCaption?: string;
  };
  source: "instagram";
}

export type ArchivePost = InstagramPost | SubstackPost;

export interface ContentArchive {
  schemaVersion: typeof ARCHIVE_SCHEMA_VERSION;
  posts: ArchivePost[];
}

export interface ContentProvider {
  fetchPosts: () => Promise<ArchivePost[]>;
  source: ContentSource;
}

export interface SourceReconciliationStats {
  added: number;
  duplicates: number;
  fetched: number;
  unchanged: number;
  updated: number;
}

export interface ReconciliationStats {
  bySource: Record<ContentSource, SourceReconciliationStats>;
  totalAdded: number;
  totalRecords: number;
  totalUpdated: number;
}

export interface ReconciliationResult {
  archive: ContentArchive;
  stats: ReconciliationStats;
}
