import { Filter } from "lucide-react";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
import { EmbedModal } from "@/app/components/posts/EmbedModal";
import { FollowColumn } from "@/app/components/posts/FollowColumn";
import { PostCard } from "@/app/components/posts/PostCard";
import {
  InstagramIcon,
  SubstackIcon,
  TikTokIcon,
} from "@/app/components/posts/PlatformIcons";
import { PostsFilterModal } from "@/app/components/posts/PostsFilterModal";
import { PostsGuideLine } from "@/app/components/posts/PostsGuideLine";
import { ShortsPreview } from "@/app/components/posts/ShortsPreview";
import { SiteFooter } from "@/app/components/SiteFooter";
import { SiteNav } from "@/app/components/SiteNav";
import {
  groupLabel,
  newerPost,
  type PostGroup,
} from "@/app/content/postGroups";
import {
  getPlatformColor,
  getPlatformLabel,
  getPostThumbnail,
  groupedPosts,
  RECENT_POST_COUNT,
  type ArchivePost,
  type PostSource,
} from "@/app/content/posts";
import { BROWN, CREAM, SANS, SERIF, STONE } from "@/app/constants";
import { useMediaQuery } from "@/app/hooks/useMediaQuery";

const DESKTOP_PAGE_SIZE = 16;
const MOBILE_PAGE_SIZE = 15;

const sectionTitleStyle = {
  color: BROWN,
  fontFamily: SERIF,
} as const;

const platformFilters: { source: PostSource; Icon: typeof TikTokIcon }[] = [
  { source: "tiktok", Icon: TikTokIcon },
  { source: "instagram", Icon: InstagramIcon },
  { source: "substack", Icon: SubstackIcon },
];

const groups = groupedPosts;
const recentGroups = groups.slice(0, RECENT_POST_COUNT);

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

function withActiveGroup(
  active: PostGroup<ArchivePost> | null,
  filtered: PostGroup<ArchivePost>[],
) {
  if (!active || filtered.some((group) => group.id === active.id)) return filtered;
  const insertAt = filtered.findIndex((group) => !comesBefore(group, active));
  if (insertAt < 0) return [...filtered, active];
  return [...filtered.slice(0, insertAt), active, ...filtered.slice(insertAt)];
}

function PostThumb({
  label,
  onOpen,
  post,
}: {
  label: string;
  onOpen: () => void;
  post: ArchivePost;
}) {
  const thumbnail = getPostThumbnail(post);
  return (
    <button
      type="button"
      className="posts-thumb"
      aria-label={label}
      onClick={onOpen}
    >
      {thumbnail ? (
        <ImageWithFallback
          src={thumbnail}
          alt=""
          className="h-full w-full object-cover"
        />
      ) : null}
    </button>
  );
}

export function PostsPage() {
  const isMobile = useMediaQuery("(max-width: 767px)");
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [filter, setFilter] = useState<PostSource | null>(null);
  const [draftFilter, setDraftFilter] = useState<PostSource | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [page, setPage] = useState(0);
  const pageSize = isMobile ? MOBILE_PAGE_SIZE : DESKTOP_PAGE_SIZE;

  const filteredGroups = useMemo(
    () =>
      filter ? groups.filter((group) => matchesFilter(group, filter)) : groups,
    [filter],
  );
  const total = filteredGroups.length;
  const lastPage = Math.max(0, Math.ceil(total / pageSize) - 1);
  const currentPage = Math.min(page, lastPage);
  const pageGroups = filteredGroups.slice(
    currentPage * pageSize,
    currentPage * pageSize + pageSize,
  );
  const rangeStart = total === 0 ? 0 : currentPage * pageSize + 1;
  const rangeEnd = total === 0 ? 0 : Math.min(total, (currentPage + 1) * pageSize);
  const totalColor = filter ? getPlatformColor(filter) : STONE;

  const activeGroup = activeGroupId
    ? (groups.find((group) => group.id === activeGroupId) ?? null)
    : null;
  const { previous: previousGroup, next: nextGroup } = activeGroup
    ? listNeighbors(activeGroup, filteredGroups)
    : { previous: null, next: null };
  const slideGroups = useMemo(
    () => withActiveGroup(activeGroup, filteredGroups),
    [activeGroup, filteredGroups],
  );
  const shortsPosts = useMemo(
    () => slideGroups.map((group) => newerPost(group.members)),
    [slideGroups],
  );
  const activeShortIndex =
    activeGroup === null
      ? null
      : slideGroups.findIndex((group) => group.id === activeGroup.id);

  useEffect(() => {
    setPage((current) => (current > lastPage ? lastPage : current));
  }, [lastPage]);

  useEffect(() => {
    if (!isMobile) setFilterOpen(false);
  }, [isMobile]);

  function openPost(post: ArchivePost) {
    const group = groups.find((item) =>
      item.members.some((member) => member.id === post.id),
    );
    if (group) setActiveGroupId(group.id);
  }

  function applyFilter(next: PostSource | null) {
    setFilter(next);
    setPage(0);
    if (!next || !activeGroupId) return;
    const group = groups.find((item) => item.id === activeGroupId);
    if (!group || !matchesFilter(group, next)) setActiveGroupId(null);
  }

  function toggleFilter(source: PostSource) {
    applyFilter(filter === source ? null : source);
  }

  function openFilterModal() {
    setDraftFilter(filter);
    setFilterOpen(true);
  }

  function saveFilter() {
    applyFilter(draftFilter);
    setFilterOpen(false);
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
        className="posts-page__header md:border-b"
        style={{ borderColor: "rgba(42,31,26,0.06)" }}
      >
        <SiteNav variant="light" />
      </header>

      <main className="posts-page__main mx-auto max-w-5xl px-6 pb-20 pt-12 md:px-10 md:pt-16">
        <section aria-labelledby="recent-posts-heading">
          <h1
            id="recent-posts-heading"
            className="posts-section-title mb-3 font-bold md:mb-8"
            style={sectionTitleStyle}
          >
            Recent posts
          </h1>
          <p
            className="mb-6 text-base md:hidden"
            style={{ color: BROWN, fontFamily: SANS }}
          >
            My most recent content across all my platforms.
          </p>
          <div className="flex flex-col items-start gap-10 lg:flex-row lg:gap-8">
            <div className="posts-thumb-row grid grid-cols-2 gap-0.5 md:hidden">
              {recentGroups.map((group) => {
                const lead = newerPost(group.members);
                return (
                  <PostThumb
                    key={group.id}
                    label={groupLabel(group.members)}
                    onOpen={() => openPost(lead)}
                    post={lead}
                  />
                );
              })}
            </div>
            <div className="hidden w-full min-w-0 flex-1 grid-cols-2 gap-4 md:grid lg:w-auto">
              {recentGroups.map((group) => {
                const lead = newerPost(group.members);
                return (
                  <PostCard
                    key={group.id}
                    label={groupLabel(group.members)}
                    members={group.members}
                    onOpen={() => openPost(lead)}
                    publishedAt={lead.publishedAt}
                    thumbnailPost={lead}
                    variant="featured"
                  />
                );
              })}
            </div>
            <FollowColumn
              hideHeading={isMobile}
              layout={isMobile ? "row" : "stack"}
            />
          </div>
        </section>

        <section className="mt-16 md:mt-20" aria-labelledby="all-posts-heading">
          <div className="posts-all-header mb-3 flex items-start justify-between gap-4">
            <h2
              id="all-posts-heading"
              className="posts-section-title font-bold"
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
                  {isMobile ? (
                    <button
                      type="button"
                      className="posts-pager__button"
                      aria-label="Filter posts"
                      aria-expanded={filterOpen}
                      aria-pressed={filter !== null}
                      onClick={openFilterModal}
                    >
                      <Filter className="h-4 w-4" aria-hidden="true" />
                    </button>
                  ) : null}
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
          <div className="posts-thumb-row grid grid-cols-3 gap-0.5 md:hidden">
            {pageGroups.map((group) => {
              const lead = newerPost(group.members);
              return (
                <PostThumb
                  key={group.id}
                  label={groupLabel(group.members)}
                  onOpen={() => openPost(lead)}
                  post={lead}
                />
              );
            })}
          </div>
          <div className="hidden gap-4 md:grid md:grid-cols-4">
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
      {isMobile ? (
        <ShortsPreview
          activeIndex={activeShortIndex !== null && activeShortIndex >= 0 ? activeShortIndex : null}
          mediaWindow={1}
          onChange={(index) => {
            const group = slideGroups[index];
            if (group) setActiveGroupId(group.id);
          }}
          onClose={() => setActiveGroupId(null)}
          posts={shortsPosts}
        />
      ) : (
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
      )}
      {isMobile ? (
        <PostsFilterModal
          draft={draftFilter}
          onClose={() => setFilterOpen(false)}
          onSave={saveFilter}
          onToggle={(source) =>
            setDraftFilter((current) => (current === source ? null : source))
          }
          open={filterOpen}
        />
      ) : null}
    </div>
  );
}
