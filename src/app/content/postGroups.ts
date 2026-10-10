export type GroupableSource = "instagram" | "substack" | "tiktok";

export interface GroupablePost {
  description?: string;
  id: string;
  metadata?: {
    caption?: string;
    prunedCaption?: string;
  };
  publishedAt: string;
  source: GroupableSource;
  title?: string;
}

export interface PostGroup<T extends GroupablePost> {
  id: string;
  members: T[];
  publishedAt: string;
}

const MATCH_WINDOW_MS = 24 * 60 * 60 * 1000;
const MIN_PREFIX_LENGTH = 20;

const SOURCE_ORDER: GroupableSource[] = ["instagram", "tiktok", "substack"];

export function postDisplayTitle(post: GroupablePost): string {
  if (post.title?.trim()) return post.title.trim();
  if (post.description?.trim()) return post.description.trim();
  if (post.metadata?.prunedCaption?.trim()) {
    return post.metadata.prunedCaption.trim();
  }
  if (post.metadata?.caption?.trim()) return post.metadata.caption.trim();
  return "Post";
}

export function normalizePostTitle(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function titlesMatch(left: string, right: string): boolean {
  if (!left || !right) return false;
  if (left === right) return true;
  const [shorter, longer] =
    left.length <= right.length ? [left, right] : [right, left];
  return shorter.length >= MIN_PREFIX_LENGTH && longer.startsWith(shorter);
}

function publishedTime(post: GroupablePost): number {
  return Date.parse(post.publishedAt);
}

export function newerPost<T extends GroupablePost>(members: T[]): T {
  return [...members].sort((a, b) => publishedTime(b) - publishedTime(a))[0];
}

export function groupLabel<T extends GroupablePost>(members: T[]): string {
  return members
    .map(postDisplayTitle)
    .sort((a, b) => b.length - a.length)[0];
}

export function sourcesInLabelOrder(
  sources: GroupableSource[],
): GroupableSource[] {
  return [...sources].sort(
    (a, b) => SOURCE_ORDER.indexOf(a) - SOURCE_ORDER.indexOf(b),
  );
}

export function groupCrossPlatformPosts<T extends GroupablePost>(
  items: T[],
): PostGroup<T>[] {
  const instagram = items.filter((post) => post.source === "instagram");
  const tiktok = items.filter((post) => post.source === "tiktok");
  const candidates: { distance: number; instagram: T; tiktok: T }[] = [];

  for (const igPost of instagram) {
    const igTitle = normalizePostTitle(postDisplayTitle(igPost));
    const igTime = publishedTime(igPost);
    for (const ttPost of tiktok) {
      const ttTitle = normalizePostTitle(postDisplayTitle(ttPost));
      const ttTime = publishedTime(ttPost);
      if (!titlesMatch(igTitle, ttTitle)) continue;
      const distance = Math.abs(igTime - ttTime);
      if (Number.isNaN(distance) || distance > MATCH_WINDOW_MS) continue;
      candidates.push({ distance, instagram: igPost, tiktok: ttPost });
    }
  }

  candidates.sort(
    (a, b) =>
      a.distance - b.distance ||
      a.instagram.id.localeCompare(b.instagram.id) ||
      a.tiktok.id.localeCompare(b.tiktok.id),
  );

  const used = new Set<string>();
  const groups: PostGroup<T>[] = [];

  for (const candidate of candidates) {
    if (used.has(candidate.instagram.id) || used.has(candidate.tiktok.id)) {
      continue;
    }
    used.add(candidate.instagram.id);
    used.add(candidate.tiktok.id);
    const members = [candidate.instagram, candidate.tiktok];
    const lead = newerPost(members);
    groups.push({
      id: members
        .map((post) => post.id)
        .sort()
        .join("|"),
      members,
      publishedAt: lead.publishedAt,
    });
  }

  for (const post of items) {
    if (used.has(post.id)) continue;
    groups.push({
      id: post.id,
      members: [post],
      publishedAt: post.publishedAt,
    });
  }

  return groups.sort(
    (a, b) => publishedTime(b) - publishedTime(a) || a.id.localeCompare(b.id),
  );
}
