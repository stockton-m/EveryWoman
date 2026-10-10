import { useState } from "react";
import { EmbedModal } from "@/app/components/posts/EmbedModal";
import { FollowColumn } from "@/app/components/posts/FollowColumn";
import { PostCard } from "@/app/components/posts/PostCard";
import { PostsGuideLine } from "@/app/components/posts/PostsGuideLine";
import { SiteFooter } from "@/app/components/SiteFooter";
import { SiteNav } from "@/app/components/SiteNav";
import {
  groupCrossPlatformPosts,
  groupLabel,
  newerPost,
} from "@/app/content/postGroups";
import {
  getPostLabel,
  posts,
  recentPosts,
  type ArchivePost,
} from "@/app/content/posts";
import { BROWN, CREAM, SANS, SERIF, STONE } from "@/app/constants";

const sectionTitleStyle = {
  color: BROWN,
  fontFamily: SERIF,
  fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
} as const;

const groups = groupCrossPlatformPosts(posts);

export function PostsPage() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const activeGroup = activeIndex === null ? null : groups[activeIndex];
  const previousGroup =
    activeIndex !== null && activeIndex > 0 ? groups[activeIndex - 1] : null;
  const nextGroup =
    activeIndex !== null && activeIndex < groups.length - 1
      ? groups[activeIndex + 1]
      : null;

  function openPost(post: ArchivePost) {
    const index = groups.findIndex((group) =>
      group.members.some((member) => member.id === post.id),
    );
    if (index >= 0) setActiveIndex(index);
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
            <p className="pb-1 text-sm" style={{ color: STONE, fontFamily: SANS }}>
              {posts.length} {posts.length === 1 ? "post" : "posts"}
            </p>
          </div>
          <p className="mb-6 text-base" style={{ color: BROWN, fontFamily: SANS }}>
            All of my posts across all my social media platforms.
          </p>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {groups.map((group) => {
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
        hasNext={nextGroup !== null}
        hasPrevious={previousGroup !== null}
        members={activeGroup?.members ?? []}
        onClose={() => setActiveIndex(null)}
        onNext={() =>
          setActiveIndex((index) =>
            index === null ? index : Math.min(index + 1, groups.length - 1),
          )
        }
        onPrevious={() =>
          setActiveIndex((index) =>
            index === null ? index : Math.max(index - 1, 0),
          )
        }
      />
    </div>
  );
}
