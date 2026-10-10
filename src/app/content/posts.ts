import logoImage from "@/imports/logo-full.png";
import archiveFile from "@/data/content-archive.json";
import { postDisplayTitle } from "@/app/content/postGroups";
import { BLUSH, EMBER, SAGE } from "@/app/constants";

export type PostSource = "instagram" | "substack" | "tiktok";

export interface PostImageSize {
  mediaUrl: string;
}

export interface PostMedia {
  children?: PostMedia[];
  mediaType?: string;
  mediaUrl?: string;
  sizes?: Partial<Record<"full" | "large" | "medium" | "small", PostImageSize>>;
  thumbnailUrl?: string;
}

export interface ArchivePost {
  bodyHtml?: string;
  description?: string;
  id: string;
  media: PostMedia[];
  metadata?: {
    author?: string;
    caption?: string;
    prunedCaption?: string;
    thumbnailPath?: string;
  };
  publishedAt: string;
  slug?: string;
  source: PostSource;
  sourceUrl: string;
  title?: string;
}

export interface SubstackArticle extends ArchivePost {
  bodyHtml: string;
  slug: string;
  source: "substack";
  title: string;
}

interface ContentArchiveFile {
  posts: ArchivePost[];
}

const archive = archiveFile as ContentArchiveFile;

function byNewest(a: ArchivePost, b: ArchivePost): number {
  return Date.parse(b.publishedAt) - Date.parse(a.publishedAt);
}

export const posts: ArchivePost[] = [...archive.posts].sort(byNewest);

export const RECENT_POST_COUNT = 4;

export const recentPosts = posts.slice(0, RECENT_POST_COUNT);

export function isSubstackPost(post: ArchivePost): post is SubstackArticle {
  return (
    post.source === "substack" &&
    typeof post.slug === "string" &&
    post.slug.length > 0 &&
    typeof post.title === "string" &&
    typeof post.bodyHtml === "string"
  );
}

export function findSubstackPost(slug: string): SubstackArticle | undefined {
  return posts.find(
    (post): post is SubstackArticle =>
      isSubstackPost(post) && post.slug === slug,
  );
}

export function getPostLabel(post: ArchivePost): string {
  return postDisplayTitle(post);
}

export function getPlatformColor(source: PostSource): string {
  switch (source) {
    case "instagram":
      return BLUSH;
    case "substack":
      return SAGE;
    case "tiktok":
      return EMBER;
  }
}

export function getPlatformLabel(source: PostSource): string {
  switch (source) {
    case "instagram":
      return "Instagram";
    case "substack":
      return "Substack";
    case "tiktok":
      return "TikTok";
  }
}

export function formatPostDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.valueOf())) return "";
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  }).format(date);
}

function sizedImageUrl(media: PostMedia): string | undefined {
  return (
    media.sizes?.medium?.mediaUrl ??
    media.sizes?.small?.mediaUrl ??
    media.sizes?.large?.mediaUrl ??
    media.sizes?.full?.mediaUrl ??
    media.thumbnailUrl
  );
}

function isImageUrl(url: string): boolean {
  return !/\.mp4(\?|$)/i.test(url);
}

export function getPostThumbnail(post: ArchivePost): string | undefined {
  if (post.source === "tiktok") {
    const thumbnailPath = post.metadata?.thumbnailPath;
    if (thumbnailPath) return `/${thumbnailPath}`;
    return logoImage;
  }

  const media = post.media[0];
  if (!media) return undefined;

  const direct = sizedImageUrl(media);
  if (direct) return direct;

  for (const child of media.children ?? []) {
    const childUrl = sizedImageUrl(child);
    if (childUrl) return childUrl;
  }

  if (media.mediaUrl && isImageUrl(media.mediaUrl)) return media.mediaUrl;
  return undefined;
}

export function getEmbedUrl(post: ArchivePost): string | undefined {
  if (post.source === "instagram") {
    const base = post.sourceUrl.endsWith("/")
      ? post.sourceUrl
      : `${post.sourceUrl}/`;
    return `${base}embed`;
  }

  if (post.source === "tiktok") {
    const match = post.sourceUrl.match(/\/video\/(\d+)/);
    if (!match) return undefined;
    return `https://www.tiktok.com/player/v1/${match[1]}?music_info=0&description=0&rel=0&closed_caption=0`;
  }

  return undefined;
}

export function getPostPlainText(html: string): string {
  const withBreaks = html.replace(
    /<br\s*\/?>|<\/(p|h[1-6]|li|blockquote|div|ul|ol)>/gi,
    " ",
  );
  const doc = new DOMParser().parseFromString(withBreaks, "text/html");
  return (doc.body.textContent ?? "").replace(/\s+/g, " ").trim();
}
