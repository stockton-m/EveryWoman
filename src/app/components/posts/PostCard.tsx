import { useEffect, useRef, useState, type RefObject } from "react";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
import { ClampedTitle } from "@/app/components/posts/ClampedTitle";
import { PlatformLabels } from "@/app/components/posts/PlatformLabels";
import { sourcesInLabelOrder } from "@/app/content/postGroups";
import {
  formatPostDate,
  getPostThumbnail,
  type ArchivePost,
} from "@/app/content/posts";
import { thumbnailEdgeBlends } from "@/app/content/thumbnailEdge";
import { BROWN, SANS, SERIF, STONE } from "@/app/constants";

type PostCardProps = {
  label: string;
  members: ArchivePost[];
  onOpen: () => void;
  publishedAt: string;
  thumbnailPost: ArchivePost;
  variant: "featured" | "compact";
};

export function PostCard({
  label,
  members,
  onOpen,
  publishedAt,
  thumbnailPost,
  variant,
}: PostCardProps) {
  const thumbnail = getPostThumbnail(thumbnailPost);
  const featured = variant === "featured";
  const blends = useThumbnailBlends(thumbnail);
  const sources = sourcesInLabelOrder(members.map((member) => member.source));
  const className = `post-card-trigger group flex h-full w-full cursor-pointer flex-col overflow-hidden text-left ${
    featured ? "rounded-[1.5rem]" : "rounded-2xl"
  }`;

  const card = (
    <article
      className={`flex h-full flex-col overflow-hidden ${
        featured
          ? "post-card--featured rounded-[1.5rem]"
          : "post-card--compact rounded-2xl"
      }`}
      style={{
        background: "#fff",
        border: "1px solid rgba(42,31,26,0.08)",
        boxShadow: "0 2px 16px rgba(42,31,26,0.06)",
      }}
    >
      <div
        ref={blends.mediaRef}
        className={`post-card__media relative overflow-hidden ${
          featured ? "aspect-[16/11]" : ""
        } ${blends.matches ? "post-card__media--blend" : ""}`}
        style={{ background: "rgba(42,31,26,0.06)" }}
      >
        {thumbnail ? (
          <ImageWithFallback
            src={thumbnail}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : null}
      </div>
      <div
        className={`post-card__body flex flex-1 flex-col ${
          featured ? "p-4" : "p-3"
        }`}
      >
        {featured ? (
          <span className="mb-2">
            <PlatformLabels sources={sources} />
          </span>
        ) : (
          <div className="mb-1.5">
            <PlatformLabels sources={sources} size="compact" />
          </div>
        )}
        <ClampedTitle
          className={`font-bold leading-snug ${featured ? "mb-3" : "mb-2"}`}
          lines={featured ? 3 : 2}
          style={{
            color: BROWN,
            fontFamily: SERIF,
            fontSize: featured
              ? "clamp(1.05rem, 1.2vw, 1.15rem)"
              : "clamp(0.8rem, 0.95vw, 0.9rem)",
          }}
          text={label}
        />
        <time
          className={`mt-auto ${featured ? "text-xs" : "text-[10px] leading-[1.2]"}`}
          dateTime={publishedAt}
          style={{ color: STONE, fontFamily: SANS }}
        >
          {formatPostDate(publishedAt)}
        </time>
      </div>
    </article>
  );

  return (
    <button
      type="button"
      className={className}
      onClick={onOpen}
      style={{
        background: "transparent",
        border: 0,
        color: "inherit",
        font: "inherit",
        padding: 0,
        textAlign: "inherit",
      }}
    >
      {card}
    </button>
  );
}

function useThumbnailBlends(src: string | undefined): {
  matches: boolean;
  mediaRef: RefObject<HTMLDivElement>;
} {
  const mediaRef = useRef<HTMLDivElement>(null);
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    setMatches(false);
    if (!src) return;

    let cancelled = false;
    const image = new Image();
    image.crossOrigin = "anonymous";

    const sample = () => {
      if (cancelled || !image.complete || image.naturalWidth === 0) return;
      const box = mediaRef.current;
      if (!box) return;
      const width = box.clientWidth;
      const height = box.clientHeight;
      if (width === 0 || height === 0) return;
      setMatches(thumbnailEdgeBlends(image, width, height));
    };

    image.onload = sample;
    image.onerror = () => {
      if (!cancelled) setMatches(false);
    };
    image.src = src;
    if (image.complete && image.naturalWidth > 0) sample();

    const box = mediaRef.current;
    const observer = box ? new ResizeObserver(sample) : null;
    if (box && observer) observer.observe(box);

    return () => {
      cancelled = true;
      observer?.disconnect();
      image.onload = null;
      image.onerror = null;
    };
  }, [src]);

  return { matches, mediaRef };
}
