import { ArrowRight, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
import { PlatformLabels } from "@/app/components/posts/PlatformLabels";
import {
  InstagramIcon,
  TikTokIcon,
} from "@/app/components/posts/PlatformIcons";
import { TierIconNameTooltip } from "@/app/components/TierIconNameTooltip";
import { newerPost } from "@/app/content/postGroups";
import {
  formatPostDate,
  getEmbedUrl,
  getPlatformColor,
  getPlatformLabel,
  getPostLabel,
  getPostPlainText,
  getPostThumbnail,
  isSubstackPost,
  type ArchivePost,
  type PostSource,
  type SubstackArticle,
} from "@/app/content/posts";
import { EMBER, SANS, SERIF, STONE } from "@/app/constants";

const TITLE_ID = "post-embed-modal-title";

type EmbedModalProps = {
  filter: PostSource | null;
  hasNext: boolean;
  hasPrevious: boolean;
  members: ArchivePost[];
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
  showAllPostsLink?: boolean;
};

function stopOverlayClose(event: MouseEvent) {
  event.stopPropagation();
}

function blurFocus() {
  const active = document.activeElement;
  if (active instanceof HTMLElement) active.blur();
}

function Player({ post, label }: { post: ArchivePost; label: string }) {
  const embedUrl = getEmbedUrl(post);
  if (embedUrl) {
    return (
      <iframe
        key={embedUrl}
        src={embedUrl}
        title={label}
        scrolling="no"
        className="h-full w-full"
        style={{ border: 0, overflow: "hidden" }}
        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
        allowFullScreen
      />
    );
  }

  const thumbnail = getPostThumbnail(post);
  if (thumbnail) {
    return (
      <ImageWithFallback
        src={thumbnail}
        alt=""
        className="h-full w-full object-cover"
      />
    );
  }

  return <p className="embed-modal__player-empty">This post doesn&apos;t have a preview.</p>;
}

function TextPane({ post }: { post: ArchivePost }) {
  return (
    <div className="embed-modal__copy" style={{ fontFamily: SANS }}>
      <p className="mb-2">
        <PlatformLabels sources={[post.source]} />
      </p>
      <h2
        id={TITLE_ID}
        className="embed-modal__title"
        style={{ fontFamily: SERIF }}
      >
        {getPostLabel(post)}
      </h2>
      <p className="mt-3 text-sm" style={{ color: STONE }}>
        {formatPostDate(post.publishedAt)}
      </p>
    </div>
  );
}

function ArticlePane({ post }: { post: SubstackArticle }) {
  const excerptRef = useRef<HTMLParagraphElement>(null);

  useLayoutEffect(() => {
    const excerpt = excerptRef.current;
    const article = excerpt?.parentElement;
    if (!excerpt || !article) return;

    const fit = () => {
      excerpt.style.webkitLineClamp = "";
      const excerptStyle = getComputedStyle(excerpt);
      const lineHeight = parseFloat(excerptStyle.lineHeight);
      const cap = Number.parseInt(excerptStyle.webkitLineClamp, 10);
      const maxLines = Number.isFinite(cap) && cap > 0 ? cap : 16;
      if (!lineHeight) return;

      const articleStyle = getComputedStyle(article);
      const padding =
        parseFloat(articleStyle.paddingTop) +
        parseFloat(articleStyle.paddingBottom);
      let siblings = 0;
      for (const child of article.children) {
        if (child === excerpt) continue;
        const childStyle = getComputedStyle(child);
        siblings +=
          child.getBoundingClientRect().height +
          parseFloat(childStyle.marginTop) +
          parseFloat(childStyle.marginBottom);
      }
      const excerptMargin =
        parseFloat(excerptStyle.marginTop) +
        parseFloat(excerptStyle.marginBottom);
      const available =
        article.clientHeight - padding - siblings - excerptMargin;
      const lines = Math.min(
        maxLines,
        Math.max(1, Math.floor((available + 1) / lineHeight)),
      );
      excerpt.style.webkitLineClamp = String(lines);
    };

    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(article);
    observer.observe(document.documentElement);
    window.addEventListener("resize", fit);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", fit);
    };
  }, [post.slug]);

  return (
    <div
      className="embed-modal__article"
      style={{ fontFamily: SANS }}
      onMouseDown={stopOverlayClose}
    >
      <p className="mb-3">
        <PlatformLabels sources={[post.source]} />
      </p>
      <h2
        id={TITLE_ID}
        className="embed-modal__title"
        style={{ fontFamily: SERIF }}
      >
        {post.title}
      </h2>
      <p ref={excerptRef} className="embed-modal__excerpt">
        {getPostPlainText(post.bodyHtml)}
      </p>
      <Link
        to={`/posts/${post.slug}`}
        className="pill-btn pill-btn--ember embed-modal__continue inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold"
        style={{ fontFamily: SANS, textDecoration: "none" }}
      >
        Continue reading
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function PlatformToggles({
  members,
  selectedId,
  onSelect,
}: {
  members: ArchivePost[];
  selectedId: string;
  onSelect: (postId: string) => void;
}) {
  const options = (["instagram", "tiktok"] as const)
    .map((source) => members.find((member) => member.source === source))
    .filter((member): member is ArchivePost => member !== undefined);

  if (options.length < 2) return null;

  return (
    <div className="embed-modal__toggles">
      {options.map((member) => {
        const selected = member.id === selectedId;
        const Icon = member.source === "instagram" ? InstagramIcon : TikTokIcon;
        const name = getPlatformLabel(member.source);
        return (
          <TierIconNameTooltip
            key={member.id}
            placement="after"
            shape="pill"
            zIndex={80}
            content="This post is cross-platform."
          >
            <button
              type="button"
              className="embed-modal__toggle"
              aria-pressed={selected}
              aria-label={`View ${name}`}
              onClick={() => onSelect(member.id)}
              style={{
                borderColor: selected ? EMBER : "transparent",
              }}
            >
              <Icon />
            </button>
          </TierIconNameTooltip>
        );
      })}
    </div>
  );
}

function ChevronButton({
  direction,
  enabled,
  onNavigate,
}: {
  direction: "previous" | "next";
  enabled: boolean;
  onNavigate: () => void;
}) {
  const Icon = direction === "previous" ? ChevronLeft : ChevronRight;
  const name = direction === "previous" ? "Previous post" : "Next post";

  return (
    <button
      type="button"
      className={`embed-modal__chevron embed-modal__chevron--${
        direction === "previous" ? "prev" : "next"
      }`}
      onClick={onNavigate}
      onMouseDown={stopOverlayClose}
      disabled={!enabled}
      aria-label={name}
    >
      <Icon className="h-6 w-6" />
    </button>
  );
}

export function EmbedModal({
  filter,
  hasNext,
  hasPrevious,
  members,
  onClose,
  onNext,
  onPrevious,
  showAllPostsLink = false,
}: EmbedModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const sideRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const onNextRef = useRef(onNext);
  const onPreviousRef = useRef(onPrevious);
  const hasNextRef = useRef(hasNext);
  const hasPreviousRef = useRef(hasPrevious);
  onCloseRef.current = onClose;
  onNextRef.current = onNext;
  onPreviousRef.current = onPrevious;
  hasNextRef.current = hasNext;
  hasPreviousRef.current = hasPrevious;

  const groupKey = `${members
    .map((member) => member.id)
    .sort()
    .join("|")}:${filter ?? ""}`;
  const [selection, setSelection] = useState<{
    groupKey: string;
    postId: string | null;
  }>({ groupKey, postId: null });
  const selectionMatches = selection.groupKey === groupKey;
  const selectedId = selectionMatches ? selection.postId : null;
  if (!selectionMatches) {
    setSelection({ groupKey, postId: null });
  }

  const filteredMember = filter
    ? members.find((member) => member.source === filter)
    : undefined;
  const post =
    members.find((member) => member.id === selectedId) ??
    filteredMember ??
    (members.length > 0 ? newerPost(members) : null);
  const isOpen = post !== null;

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus({ preventScroll: true });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        blurFocus();
        onCloseRef.current();
        return;
      }

      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        blurFocus();
        if (event.key === "ArrowLeft" && hasPreviousRef.current) {
          onPreviousRef.current();
        }
        if (event.key === "ArrowRight" && hasNextRef.current) {
          onNextRef.current();
        }
        return;
      }

      if (event.key !== "Tab") return;
      const focusable = overlayRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      blurFocus();
      requestAnimationFrame(() => {
        blurFocus();
        requestAnimationFrame(blurFocus);
      });
    };
  }, [isOpen]);

  useLayoutEffect(() => {
    const player = playerRef.current;
    const side = sideRef.current;
    if (!player || !side) return;

    const place = () => {
      const offset = Math.max(0, (player.offsetHeight - side.offsetHeight) / 8);
      const next = `${offset}px`;
      if (side.style.marginTop !== next) side.style.marginTop = next;
    };

    place();
    const observer = new ResizeObserver(place);
    observer.observe(player);
    observer.observe(side);
    window.addEventListener("resize", place);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", place);
    };
  }, [post?.id]);

  if (!post) return null;

  const label = getPostLabel(post);
  const substack = isSubstackPost(post);

  return createPortal(
    <div
      ref={overlayRef}
      className="embed-modal"
      role="presentation"
      onMouseDown={onClose}
    >
      <div className="embed-modal__toolbar">
        {filter ? (
          <p className="embed-modal__filter-pill" style={{ fontFamily: SANS }}>
            Filtering to{" "}
            <span style={{ color: getPlatformColor(filter) }}>
              {getPlatformLabel(filter)}
            </span>{" "}
            posts only
          </p>
        ) : null}
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          onMouseDown={stopOverlayClose}
          className="embed-modal__close"
          aria-label="Close"
        >
          <X className="h-6 w-6" />
        </button>
      </div>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={TITLE_ID}
        className="embed-modal__stage"
      >
        <ChevronButton
          direction="previous"
          enabled={hasPrevious}
          onNavigate={onPrevious}
        />
        {substack ? (
          <ArticlePane post={post} />
        ) : (
          <div className="embed-modal__pair">
            <div
              className="embed-modal__player-slot"
              onMouseDown={stopOverlayClose}
            >
              <div ref={playerRef} className="embed-modal__player">
                <Player post={post} label={label} />
              </div>
            </div>
            <div
              ref={sideRef}
              className="embed-modal__side"
              onMouseDown={stopOverlayClose}
            >
              <div className="embed-modal__copy-stack">
                {showAllPostsLink ? (
                  <Link
                    to="/posts"
                    className="pill-btn pill-btn--ember embed-modal__all-posts inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold"
                    style={{ fontFamily: SANS, textDecoration: "none" }}
                  >
                    See all posts
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : null}
                <TextPane post={post} />
              </div>
              <PlatformToggles
                members={members}
                selectedId={post.id}
                onSelect={(postId) => setSelection({ groupKey, postId })}
              />
            </div>
          </div>
        )}
        <ChevronButton
          direction="next"
          enabled={hasNext}
          onNavigate={onNext}
        />
      </div>
    </div>,
    document.body,
  );
}
