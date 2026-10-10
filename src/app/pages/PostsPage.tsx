import { useState, type CSSProperties } from "react";
import { EmbedModal } from "@/app/components/posts/EmbedModal";
import { FollowColumn } from "@/app/components/posts/FollowColumn";
import { PostCard } from "@/app/components/posts/PostCard";
import {
  InstagramIcon,
  SubstackIcon,
  TikTokIcon,
} from "@/app/components/posts/PlatformIcons";
import { PostsGuideLine } from "@/app/components/posts/PostsGuideLine";
import { SiteFooter } from "@/app/components/SiteFooter";
import { SiteNav } from "@/app/components/SiteNav";
import {
  groupCrossPlatformPosts,
  groupLabel,
  newerPost,
  type PostGroup,
} from "@/app/content/postGroups";
import {
  getPlatformColor,
  getPlatformLabel,
  getPostLabel,
  posts,
  recentPosts,
  type ArchivePost,
  type PostSource,
} from "@/app/content/posts";
import { BROWN, CREAM, SANS, SERIF, STONE } from "@/app/constants";

const PAGE_SIZE = 16;

const sectionTitleStyle = {
  color: BROWN,
  fontFamily: SERIF,
  fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
} as const;

const platformFilters: { source: PostSource; Icon: typeof TikTokIcon }[] = [
  { source: "tiktok", Icon: TikTokIcon },
  { source: "instagram", Icon: InstagramIcon },
  { source: "substack", Icon: SubstackIcon },
];

const groups = groupCrossPlatformPosts(posts);

function comesBefore(
  left: { id: string; publishedAt: string },
  right: { id: string; publishedAt: string },
): boolean {
  const delta = Date.parse(left.publishedAt) - Date.parse(right.publishedAt);
  if (delta !== 0 && !Number.isNaN(delta)) return delta > 0;
  return left.id.localeCompare(right.id) < 0;
}

function listNeighbors(
  active: PostGroup<ArchivePost>,
  list: PostGroup<ArchivePost>[],
) {
  const index = list.findIndex((group) => group.id === active.id);
  if (index >= 0) {
    return {
      previous: index > 0 ? list[index - 1] : null,
      next: index < list.length - 1 ? list[index + 1] : null,
    };
  }

  let previous: PostGroup<ArchivePost> | null = null;
  let next: PostGroup<ArchivePost> | null = null;
  for (const group of list) {
    if (comesBefore(group, active)) previous = group;
    else if (!next) next = group;
  }
  return { previous, next };
}

function matchesFilter(
  group: PostGroup<ArchivePost>,
  filter: PostSource | null,
): boolean {
  if (!filter) return true;
  return group.members.some((member) => member.source === filter);
}

export function PostsPage() {
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [filter, setFilter] = useState<PostSource | null>(null);
  const [page, setPage] = useState(0);

  const filteredGroups = filter
    ? groups.filter((group) => matchesFilter(group, filter))
    : groups;
  const total = filteredGroups.length;
  const lastPage = Math.max(0, Math.ceil(total / PAGE_SIZE) - 1);
  const currentPage = Math.min(page, lastPage);
  const pageGroups = filteredGroups.slice(
    currentPage * PAGE_SIZE,
    currentPage * PAGE_SIZE + PAGE_SIZE,
  );
  const rangeStart = total === 0 ? 0 : currentPage * PAGE_SIZE + 1;
  const rangeEnd = total === 0 ? 0 : Math.min(total, (currentPage + 1) * PAGE_SIZE);
  const totalColor = filter ? getPlatformColor(filter) : STONE;

  const activeGroup = activeGroupId
    ? (groups.find((group) => group.id === activeGroupId) ?? null)
    : null;
  const { previous: previousGroup, next: nextGroup } = activeGroup
    ? listNeighbors(activeGroup, filteredGroups)
    : { previous: null, next: null };

  function openPost(post: ArchivePost) {
    const group = groups.find((item) =>
      item.members.some((member) => member.id === post.id),
    );
    if (group) setActiveGroupId(group.id);
  }

  function toggleFilter(source: PostSource) {
    const next = filter === source ? null : source;
    setFilter(next);
    setPage(0);
    if (!next || !activeGroupId) return;
    const group = groups.find((item) => item.id === activeGroupId);
    if (!group || !matchesFilter(group, next)) setActiveGroupId(null);
  }

  return (
    <div
      className="posts-page"
      style={{
        background: CREAM,
        fontFamily: SANS,
        minHeight: "100vh",
      }}
    >
      <PostsGuideLine />

      <header
        className="posts-page__header border-b"
        style={{ borderColor: "rgba(42,31,26,0.06)" }}
      >
        <SiteNav variant="light" />
      </header>

      <main className="posts-page__main mx-auto max-w-5xl px-6 pb-20 pt-12 md:px-10 md:pt-16">
        <section aria-labelledby="recent-posts-heading">
          <h1
            id="recent-posts-heading"
            className="mb-8 font-bold"
            style={sectionTitleStyle}
          >
            Recent posts
          </h1>
          <div className="flex flex-col items-start gap-10 lg:flex-row lg:gap-8">
            <div className="grid w-full min-w-0 flex-1 grid-cols-1 gap-4 sm:grid-cols-2 lg:w-auto">
              {recentPosts.map((post) => (
                <PostCard
                  key={post.id}
                  label={getPostLabel(post)}
                  members={[post]}
                  onOpen={() => openPost(post)}
                  publishedAt={post.publishedAt}
                  thumbnailPost={post}
                  variant="featured"
                />
              ))}
            </div>
            <FollowColumn />
          </div>
        </section>

        <section className="mt-16 md:mt-20" aria-labelledby="all-posts-heading">
          <div className="mb-3 flex items-end justify-between gap-4">
            <h2
              id="all-posts-heading"
              className="font-bold"
              style={sectionTitleStyle}
            >
              All posts
            </h2>
            <div className="posts-header-tools">
              <div className="platform-filters">
                <span className="platform-filters__label">Filters</span>
                {platformFilters.map(({ source, Icon }) => {
                  const selected = filter === source;
                  const name = getPlatformLabel(source);
                  return (
                    <button
                      key={source}
                      type="button"
                      className={`platform-filter${
                        source === "substack" ? " platform-filter--substack" : ""
                      }${selected ? " platform-filter--selected" : ""}`}
                      aria-pressed={selected}
                      aria-label={
                        selected ? "Show all posts" : `Filter to ${name} posts`
                      }
                      onClick={() => toggleFilter(source)}
                      style={
                        {
                          "--platform-color": getPlatformColor(source),
                        } as CSSProperties
                      }
                    >
                      <Icon />
                    </button>
                  );
                })}
              </div>
              <div className="posts-pager">
                <div className="posts-pager__controls">
                  <button
                    type="button"
                    className="posts-pager__button"
                    aria-label="Previous page"
                    disabled={currentPage === 0}
                    onClick={() => setPage((current) => Math.max(0, current - 1))}
                  >
                    {"<"}
                  </button>
                  <button
                    type="button"
                    className="posts-pager__button"
                    aria-label="Next page"
                    disabled={currentPage >= lastPage}
                    onClick={() =>
                      setPage((current) => Math.min(current + 1, lastPage))
                    }
                  >
                    {">"}
                  </button>
                </div>
                <p className="posts-pager__count" style={{ fontFamily: SANS }}>
                  <span style={{ color: BROWN }}>
                    {rangeStart} - {rangeEnd}
                  </span>
                  {" / "}
                  <span style={{ color: totalColor }}>{total}</span>{" "}
                  {total === 1 ? "post" : "posts"}
                </p>
              </div>
            </div>
          </div>
          <p className="mb-6 text-base" style={{ color: BROWN, fontFamily: SANS }}>
            All of my posts across all my social media platforms.
          </p>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {pageGroups.map((group) => {
              const lead = newerPost(group.members);
              return (
                <PostCard
                  key={group.id}
                  label={groupLabel(group.members)}
                  members={group.members}
                  onOpen={() => openPost(lead)}
                  publishedAt={lead.publishedAt}
                  thumbnailPost={lead}
                  variant="compact"
                />
              );
            })}
          </div>
        </section>
      </main>

      <div className="posts-page__footer">
        <SiteFooter />
      </div>
      <EmbedModal
        filter={filter}
        hasNext={nextGroup !== null}
        hasPrevious={previousGroup !== null}
        members={activeGroup?.members ?? []}
        onClose={() => setActiveGroupId(null)}
        onNext={() => {
          if (nextGroup) setActiveGroupId(nextGroup.id);
        }}
        onPrevious={() => {
          if (previousGroup) setActiveGroupId(previousGroup.id);
        }}
      />
    </div>
  );
}
