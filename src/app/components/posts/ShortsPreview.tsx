import { ArrowRight, ChevronDown, ChevronUp, Volume2, X } from "lucide-react";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type TransitionEvent,
} from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
import {
  InstagramIcon,
  SubstackIcon,
  TikTokIcon,
} from "@/app/components/posts/PlatformIcons";
import {
  getEmbedUrl,
  getPlatformLabel,
  getPostLabel,
  getPostPlainText,
  getPostThumbnail,
  isSubstackPost,
  type ArchivePost,
  type PostSource,
  type SubstackArticle,
} from "@/app/content/posts";
import { SANS } from "@/app/constants";
import logoImage from "@/imports/logo.png";

const TAP_SLOP = 10;
const SNAP_RATIO = 0.22;
const FLICK_PX_PER_MS = 0.45;
const EDGE_RESISTANCE = 0.35;
const SNAP_MS = 280;

type ShortsPreviewProps = {
  activeIndex: number | null;
  mediaWindow?: number;
  onChange: (index: number) => void;
  onClose: () => void;
  posts: ArchivePost[];
};

type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  lastY: number;
  lastTime: number;
  velocity: number;
  moved: boolean;
  height: number;
};

function OpenPlatformIcon({ source }: { source: PostSource }) {
  if (source === "instagram") return <InstagramIcon />;
  if (source === "tiktok") return <TikTokIcon />;
  return <SubstackIcon />;
}

function blurFocus() {
  const active = document.activeElement;
  if (active instanceof HTMLElement) active.blur();
}

function instagramVideoUrl(post: ArchivePost): string | undefined {
  if (post.source !== "instagram") return undefined;
  const media = post.media[0];
  if (media?.mediaType === "VIDEO" && media.mediaUrl) return media.mediaUrl;
  return undefined;
}

function tiktokPlayerUrl(post: ArchivePost): string | undefined {
  if (post.source !== "tiktok") return undefined;
  const embed = getEmbedUrl(post);
  if (!embed) return undefined;
  const url = new URL(embed);
  // TikTok already starts autoplay muted. muted=1 locks that and ignores unMute.
  url.searchParams.set("autoplay", "1");
  return url.toString();
}

function postTikTok(
  frame: HTMLIFrameElement,
  type: "play" | "pause" | "mute" | "unMute",
) {
  frame.contentWindow?.postMessage(
    { type, "x-tiktok-player": true },
    "https://www.tiktok.com",
  );
}

function isTikTokPlayerMessage(
  data: unknown,
): data is { type?: string; value?: unknown; "x-tiktok-player": true } {
  if (typeof data !== "object" || data === null || !("x-tiktok-player" in data)) {
    return false;
  }
  return data["x-tiktok-player"] === true;
}

function startVideo(video: HTMLVideoElement) {
  const playMuted = () => {
    video.muted = true;
    void video.play().catch(() => {});
  };
  video.muted = false;
  const pending = video.play();
  if (pending) void pending.catch(playMuted);
}

function mediaRef<T extends HTMLElement>(store: Map<string, T>, id: string) {
  return (node: T | null) => {
    if (node) store.set(id, node);
    else store.delete(id);
  };
}

function mountsMedia(index: number, activeIndex: number, mediaWindow: number | undefined) {
  if (mediaWindow === undefined) return true;
  return Math.abs(index - activeIndex) <= mediaWindow;
}

function SubstackExcerpt({ post }: { post: SubstackArticle }) {
  const excerptRef = useRef<HTMLParagraphElement>(null);
  const text = getPostPlainText(post.bodyHtml);

  useLayoutEffect(() => {
    const excerpt = excerptRef.current;
    const article = excerpt?.parentElement;
    if (!excerpt || !article) return;

    const fit = () => {
      excerpt.style.webkitLineClamp = "80";
      const excerptStyle = getComputedStyle(excerpt);
      const lineHeight = parseFloat(excerptStyle.lineHeight);
      if (!lineHeight) return;
      const articleStyle = getComputedStyle(article);
      const padding =
        parseFloat(articleStyle.paddingTop) + parseFloat(articleStyle.paddingBottom);
      const available = article.clientHeight - padding;
      const lines = Math.max(1, Math.floor((available + 1) / lineHeight));
      excerpt.style.webkitLineClamp = String(lines);
    };

    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(article);
    window.addEventListener("resize", fit);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", fit);
    };
  }, [post.id]);

  return (
    <div className="shorts-preview__article">
      <p
        ref={excerptRef}
        className="shorts-preview__article-text"
        style={{ fontFamily: SANS }}
      >
        {text}
      </p>
    </div>
  );
}

export function ShortsPreview({
  activeIndex,
  mediaWindow,
  onChange,
  onClose,
  posts,
}: ShortsPreviewProps) {
  const navigate = useNavigate();
  const closeRef = useRef<HTMLButtonElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef(new Map<string, HTMLVideoElement>());
  const frameRefs = useRef(new Map<string, HTMLIFrameElement>());
  const videoBind = useRef(new Map<string, (node: HTMLVideoElement | null) => void>());
  const frameBind = useRef(new Map<string, (node: HTMLIFrameElement | null) => void>());
  const onChangeRef = useRef(onChange);
  const onCloseRef = useRef(onClose);
  const postsRef = useRef(posts);
  const activeIndexRef = useRef(activeIndex);
  const reducedMotionRef = useRef(false);
  const offsetRef = useRef(0);
  const settlingRef = useRef(false);
  const pendingIndexRef = useRef<number | null>(null);
  const snapTimerRef = useRef<number | null>(null);
  const dragRef = useRef<DragState>({
    pointerId: -1,
    startX: 0,
    startY: 0,
    lastY: 0,
    lastTime: 0,
    velocity: 0,
    moved: false,
    height: 0,
  });
  const [offset, setOffset] = useState(0);
  const [animate, setAnimate] = useState(false);
  const [fallbackIds, setFallbackIds] = useState<string[]>([]);
  const [unmutedIds, setUnmutedIds] = useState<Set<string>>(() => new Set());

  onChangeRef.current = onChange;
  onCloseRef.current = onClose;
  postsRef.current = posts;
  activeIndexRef.current = activeIndex;

  const post = activeIndex === null ? null : (posts[activeIndex] ?? null);
  const hasNext = activeIndex !== null && activeIndex < posts.length - 1;
  const hasPrevious = activeIndex !== null && activeIndex > 0;
  const embedFallback =
    post !== null && post.source === "instagram" && fallbackIds.includes(post.id);

  const bindVideo = (id: string) => {
    let callback = videoBind.current.get(id);
    if (!callback) {
      callback = mediaRef(videoRefs.current, id);
      videoBind.current.set(id, callback);
    }
    return callback;
  };

  const bindFrame = (id: string) => {
    let callback = frameBind.current.get(id);
    if (!callback) {
      callback = mediaRef(frameRefs.current, id);
      frameBind.current.set(id, callback);
    }
    return callback;
  };

  const clearSnapTimer = () => {
    if (snapTimerRef.current === null) return;
    window.clearTimeout(snapTimerRef.current);
    snapTimerRef.current = null;
  };

  const finishSnap = () => {
    if (!settlingRef.current) return;
    clearSnapTimer();
    const next = pendingIndexRef.current;
    settlingRef.current = false;
    pendingIndexRef.current = null;
    const track = trackRef.current;
    if (track) track.style.transition = "none";
    offsetRef.current = 0;
    setAnimate(false);
    setOffset(0);
    if (next !== null && next !== activeIndexRef.current) onChangeRef.current(next);
    window.requestAnimationFrame(() => {
      if (trackRef.current) trackRef.current.style.transition = "";
    });
  };

  const beginSnap = (target: number, nextIndex: number | null) => {
    if (reducedMotionRef.current || target === offsetRef.current) {
      offsetRef.current = 0;
      setAnimate(false);
      setOffset(0);
      if (nextIndex !== null && nextIndex !== activeIndexRef.current) {
        onChangeRef.current(nextIndex);
      }
      return;
    }
    pendingIndexRef.current = nextIndex;
    settlingRef.current = true;
    offsetRef.current = target;
    setAnimate(true);
    setOffset(target);
    clearSnapTimer();
    snapTimerRef.current = window.setTimeout(finishSnap, SNAP_MS + 80);
  };

  const animateTo = (nextIndex: number) => {
    if (activeIndex === null || settlingRef.current || dragRef.current.pointerId !== -1) return;
    if (nextIndex === activeIndex || nextIndex < 0 || nextIndex >= posts.length) return;
    const height = viewportRef.current?.clientHeight ?? 0;
    if (reducedMotionRef.current || height === 0) {
      onChange(nextIndex);
      return;
    }
    beginSnap(nextIndex > activeIndex ? -height : height, nextIndex);
  };

  const onTap = () => {
    const index = activeIndexRef.current;
    if (index === null) return;
    const current = postsRef.current[index];
    if (!current) return;
    if (current.source === "tiktok") {
      setUnmutedIds((ids) => {
        if (ids.has(current.id)) return ids;
        const next = new Set(ids);
        next.add(current.id);
        return next;
      });
    }
    const video = videoRefs.current.get(current.id);
    if (video) {
      if (video.paused) startVideo(video);
      else video.pause();
      return;
    }
    const frame = frameRefs.current.get(current.id);
    if (!frame) return;
    postTikTok(frame, "play");
    postTikTok(frame, "unMute");
  };

  useEffect(() => {
    if (activeIndex !== null) return;
    setUnmutedIds((ids) => (ids.size === 0 ? ids : new Set()));
  }, [activeIndex]);

  useEffect(() => {
    setUnmutedIds((ids) => {
      if (ids.size === 0) return ids;
      let changed = false;
      const next = new Set<string>();
      for (const id of ids) {
        if (frameRefs.current.has(id)) next.add(id);
        else changed = true;
      }
      return changed ? next : ids;
    });
  }, [activeIndex, posts]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      reducedMotionRef.current = media.matches;
    };
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    return () => clearSnapTimer();
  }, []);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== "https://www.tiktok.com") return;
      if (!isTikTokPlayerMessage(event.data)) return;
      if (event.data.type === "onMute") {
        if (typeof event.data.value !== "boolean") return;
        const muted = event.data.value;
        for (const [id, frame] of frameRefs.current) {
          if (event.source !== frame.contentWindow) continue;
          setUnmutedIds((ids) => {
            const has = ids.has(id);
            if (muted) {
              if (!has) return ids;
              const next = new Set(ids);
              next.delete(id);
              return next;
            }
            if (has) return ids;
            const next = new Set(ids);
            next.add(id);
            return next;
          });
        }
        return;
      }
      if (event.data.type !== "onPlayerReady") return;
      const index = activeIndexRef.current;
      const current = index === null ? undefined : postsRef.current[index];
      for (const [id, frame] of frameRefs.current) {
        if (event.source !== frame.contentWindow) continue;
        postTikTok(frame, "mute");
        if (current && id === current.id) postTikTok(frame, "play");
        else postTikTok(frame, "pause");
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    const activeId =
      activeIndex === null ? undefined : posts[activeIndex]?.id;
    for (const [id, video] of videoRefs.current) {
      if (id === activeId) {
        if (video.paused) startVideo(video);
      } else {
        video.pause();
      }
    }
    for (const [id, frame] of frameRefs.current) {
      if (id === activeId) postTikTok(frame, "play");
      else postTikTok(frame, "pause");
    }
  }, [activeIndex, fallbackIds, posts]);

  useEffect(() => {
    if (!post || activeIndex === null) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus({ preventScroll: true });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        blurFocus();
        onCloseRef.current();
        return;
      }

      if (settlingRef.current) return;

      if (event.key === "ArrowDown" && activeIndex < posts.length - 1) {
        event.preventDefault();
        onChangeRef.current(activeIndex + 1);
        return;
      }

      if (event.key === "ArrowUp" && activeIndex > 0) {
        event.preventDefault();
        onChangeRef.current(activeIndex - 1);
        return;
      }

      if (event.key !== "Tab") return;
      const focusable = overlayRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
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
    };
  }, [activeIndex, post, posts.length]);

  useLayoutEffect(() => {
    if (settlingRef.current || dragRef.current.pointerId !== -1) return;
    if (offsetRef.current === 0) return;
    offsetRef.current = 0;
    setAnimate(false);
    setOffset(0);
  }, [activeIndex]);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (settlingRef.current) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (activeIndexRef.current === null) return;
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      lastY: event.clientY,
      lastTime: event.timeStamp,
      velocity: 0,
      moved: false,
      height: viewportRef.current?.clientHeight ?? window.innerHeight,
    };
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // The pointer can already be inactive if the gesture ended early.
    }
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (drag.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;
    if (!drag.moved && Math.hypot(deltaX, deltaY) < TAP_SLOP) return;
    drag.moved = true;
    const dt = event.timeStamp - drag.lastTime;
    if (dt > 0) drag.velocity = (event.clientY - drag.lastY) / dt;
    drag.lastY = event.clientY;
    drag.lastTime = event.timeStamp;

    let next = deltaY;
    const index = activeIndexRef.current ?? 0;
    const atStart = index <= 0 && next > 0;
    const atEnd = index >= postsRef.current.length - 1 && next < 0;
    if (atStart || atEnd) next *= EDGE_RESISTANCE;
    offsetRef.current = next;
    setAnimate(false);
    setOffset(next);
  };

  const onPointerCancel = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (drag.pointerId !== event.pointerId) return;
    drag.pointerId = -1;
    if (drag.moved) beginSnap(0, null);
  };

  const keepReadingSlugAt = (x: number, y: number) => {
    const links = overlayRef.current?.querySelectorAll<HTMLElement>(
      ".shorts-preview__keep-reading",
    );
    if (!links) return null;
    for (const link of links) {
      const box = link.getBoundingClientRect();
      if (x < box.left || x > box.right || y < box.top || y > box.bottom) continue;
      return link.dataset.slug ?? null;
    }
    return null;
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (drag.pointerId !== event.pointerId) return;
    drag.pointerId = -1;
    try {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    } catch {
      // Capture was already released with the pointer.
    }
    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;
    if (!drag.moved) {
      const slug = keepReadingSlugAt(event.clientX, event.clientY);
      if (slug) {
        navigate(`/posts/${slug}`);
        return;
      }
      onTap();
      return;
    }
    if (Math.abs(deltaY) < Math.abs(deltaX)) {
      beginSnap(0, null);
      return;
    }
    const idle = event.timeStamp - drag.lastTime;
    const velocity = idle > 80 ? 0 : drag.velocity;
    const threshold = drag.height * SNAP_RATIO;
    const index = activeIndexRef.current ?? 0;
    const count = postsRef.current.length;
    if ((deltaY < -threshold || velocity < -FLICK_PX_PER_MS) && index < count - 1) {
      beginSnap(-drag.height, index + 1);
      return;
    }
    if ((deltaY > threshold || velocity > FLICK_PX_PER_MS) && index > 0) {
      beginSnap(drag.height, index - 1);
      return;
    }
    beginSnap(0, null);
  };

  const onTrackTransitionEnd = (event: TransitionEvent<HTMLDivElement>) => {
    if (event.target !== trackRef.current || event.propertyName !== "transform") return;
    finishSnap();
  };

  const markFallback = (id: string) => {
    setFallbackIds((current) => (current.includes(id) ? current : [...current, id]));
  };

  if (!post || activeIndex === null) return null;

  const trackIndex = activeIndex;

  return createPortal(
    <div
      ref={overlayRef}
      className="shorts-preview"
      role="dialog"
      aria-modal="true"
      aria-label={getPostLabel(post)}
    >
      <div ref={viewportRef} className="shorts-preview__viewport">
        <div
          ref={trackRef}
          className={
            animate
              ? "shorts-preview__track shorts-preview__track--settling"
              : "shorts-preview__track"
          }
          style={{
            transform: `translate3d(0, calc(${-trackIndex * 100}% + ${offset}px), 0)`,
          }}
          onTransitionEnd={onTrackTransitionEnd}
        >
          {posts.map((item, index) => {
            const label = getPostLabel(item);
            const thumbnail = getPostThumbnail(item);
            const showMedia = mountsMedia(index, activeIndex, mediaWindow);
            const article = showMedia && isSubstackPost(item) ? item : null;
            const tiktok = showMedia && !article ? tiktokPlayerUrl(item) : undefined;
            const videoUrl = showMedia && !article ? instagramVideoUrl(item) : undefined;
            const useEmbed = !tiktok && videoUrl !== undefined && fallbackIds.includes(item.id);
            const embedUrl = useEmbed ? getEmbedUrl(item) : undefined;
            return (
              <div className="shorts-preview__slide" key={item.id}>
                {article ? (
                  <SubstackExcerpt post={article} />
                ) : tiktok ? (
                  <iframe
                    ref={bindFrame(item.id)}
                    src={tiktok}
                    title={label}
                    className="shorts-preview__frame shorts-preview__frame--inert"
                    allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                    allowFullScreen
                  />
                ) : videoUrl && !useEmbed ? (
                  <video
                    ref={bindVideo(item.id)}
                    className="shorts-preview__video"
                    src={videoUrl}
                    poster={thumbnail}
                    autoPlay={index === activeIndex}
                    playsInline
                    loop
                    preload="metadata"
                    referrerPolicy="no-referrer"
                    onError={() => markFallback(item.id)}
                  />
                ) : embedUrl ? (
                  <iframe
                    key={embedUrl}
                    src={embedUrl}
                    title={label}
                    className="shorts-preview__frame"
                    allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                    allowFullScreen
                  />
                ) : thumbnail ? (
                  <ImageWithFallback
                    src={thumbnail}
                    alt={label}
                    className="shorts-preview__image"
                  />
                ) : (
                  <p className="shorts-preview__empty">This post doesn&apos;t have a preview.</p>
                )}
                {isSubstackPost(item) ? (
                  <Link
                    to={`/posts/${item.slug}`}
                    data-slug={item.slug}
                    tabIndex={index === activeIndex ? 0 : -1}
                    className="pill-btn pill-btn--ember shorts-preview__keep-reading inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold"
                    style={{ fontFamily: SANS, textDecoration: "none" }}
                  >
                    Keep reading
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                ) : null}
                {item.source === "tiktok" && !unmutedIds.has(item.id) ? (
                  <div
                    className="shorts-preview__unmute"
                    style={{ fontFamily: SANS }}
                    aria-hidden="true"
                  >
                    <Volume2 className="shorts-preview__unmute-icon" />
                    <span className="shorts-preview__unmute-copy">
                      <span>Tap to unmute</span>
                      <span className="shorts-preview__unmute-note">
                        TikTok posts are muted by default.
                      </span>
                    </span>
                  </div>
                ) : null}
                <div className="shorts-preview__caption">
                  <div className="shorts-preview__caption-row">
                    <div className="shorts-preview__logo">
                      <ImageWithFallback
                        src={logoImage}
                        alt="EveryWoman logo"
                        className="h-7 w-7 object-contain"
                      />
                    </div>
                    <p className="shorts-preview__caption-text" style={{ fontFamily: SANS }}>
                      {label}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div
        className={
          embedFallback
            ? "shorts-preview__gesture shorts-preview__gesture--passthrough"
            : "shorts-preview__gesture"
        }
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
      />
      <div className="shorts-preview__controls">
        <button
          ref={closeRef}
          type="button"
          className="shorts-preview__close"
          aria-label="Close"
          onClick={onClose}
        >
          <X className="h-7 w-7" />
        </button>
        <a
          className={
            post.source === "substack"
              ? "shorts-preview__open shorts-preview__open--substack"
              : "shorts-preview__open"
          }
          href={post.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open on ${getPlatformLabel(post.source)}`}
        >
          <OpenPlatformIcon source={post.source} />
        </a>
        <button
          type="button"
          className="shorts-preview__caret"
          aria-label="Previous post"
          disabled={!hasPrevious}
          onClick={() => animateTo(activeIndex - 1)}
        >
          <ChevronUp className="h-8 w-8" />
        </button>
        <button
          type="button"
          className="shorts-preview__caret"
          aria-label="Next post"
          disabled={!hasNext}
          onClick={() => animateTo(activeIndex + 1)}
        >
          <ChevronDown className="h-8 w-8" />
        </button>
      </div>
    </div>,
    document.body,
  );
}
