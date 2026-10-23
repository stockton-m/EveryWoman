import { ArrowLeft, ArrowUpRight, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type {
  CSSProperties,
  PointerEvent as ReactPointerEvent,
  TransitionEvent,
} from "react";
import { createPortal } from "react-dom";
import { AboutInlines } from "@/app/components/about/AboutInlines";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
import { getAboutEthosCardStyle } from "@/app/components/about/AboutWomanProfile";
import type { AboutProfileWithPortrait } from "@/app/content/aboutPortraits";
import { CREAM, MONO, SANS, SERIF } from "@/app/constants";

const TITLE_ID = "about-woman-modal-title";
const DISMISS_DISTANCE = 120;
const FLICK_PX_PER_MS = 0.45;
const TAP_SLOP = 10;
const BACKDROP_ALPHA = 0.62;

type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
  lastTime: number;
  velocityX: number;
  velocityY: number;
  moved: boolean;
};

type CardMotion = {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  animate: boolean;
  backdrop: number;
};

const REST_MOTION: CardMotion = {
  x: 0,
  y: 0,
  scaleX: 1,
  scaleY: 1,
  animate: false,
  backdrop: BACKDROP_ALPHA,
};

function motionTransform(motion: CardMotion) {
  const shifted = motion.x !== 0 || motion.y !== 0;
  const scaled = motion.scaleX !== 1 || motion.scaleY !== 1;
  if (!motion.animate && !shifted && !scaled) return undefined;
  return `translate(${motion.x}px, ${motion.y}px) scale(${motion.scaleX}, ${motion.scaleY})`;
}

function motionBackToCard(dialog: HTMLElement, index: number): CardMotion | null {
  const source = document.querySelectorAll<HTMLElement>(".about-ethos-card")[index];
  if (!source) return null;

  const target = source.getBoundingClientRect();
  const width = dialog.offsetWidth;
  const height = dialog.offsetHeight;
  if (!width || !height || !target.width || !target.height) return null;

  const visual = dialog.getBoundingClientRect();
  const painted = getComputedStyle(dialog).transform;
  const matrix = painted && painted !== "none" ? new DOMMatrix(painted) : new DOMMatrix();
  const restLeft = visual.left - matrix.e;
  const restTop = visual.top - matrix.f;
  const scaleX = target.width / width;
  const scaleY = target.height / height;

  return {
    x: target.left - restLeft - (width * (1 - scaleX)) / 2,
    y: target.top - restTop - (height * (1 - scaleY)) / 2,
    scaleX,
    scaleY,
    animate: true,
    backdrop: 0,
  };
}

function mobileDragEnabled() {
  return window.matchMedia("(max-width: 640px)").matches;
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

type SlideDirection = "next" | "prev" | "none";

type AboutWomanModalProps = {
  profile: AboutProfileWithPortrait | null;
  index: number;
  count: number;
  onClose: (reveal?: boolean) => void;
  onPrevious: () => void;
  onNext: () => void;
};

function slideDirection(
  previousIndex: number,
  nextIndex: number,
  wasOpen: boolean,
  isOpen: boolean,
): SlideDirection {
  if (!wasOpen || !isOpen || previousIndex === nextIndex) return "none";
  return nextIndex > previousIndex ? "next" : "prev";
}

function ProfileNavButton({
  direction,
  disabled,
  fill,
  onDark,
  onNavigate,
}: {
  direction: "previous" | "next";
  disabled: boolean;
  fill: string;
  onDark: boolean;
  onNavigate: () => void;
}) {
  const Icon = direction === "previous" ? ChevronLeft : ChevronRight;

  return (
    <button
      type="button"
      className={`about-ethos-modal__nav about-ethos-modal__nav--${
        direction === "previous" ? "prev" : "next"
      } ${onDark ? "about-ethos-modal__nav--on-dark" : "about-ethos-modal__nav--on-light"}`}
      style={{ "--about-modal-fill": fill } as CSSProperties}
      onClick={onNavigate}
      disabled={disabled}
      aria-label={direction === "previous" ? "Previous woman" : "Next woman"}
    >
      <Icon className="about-ethos-modal__nav-icon" aria-hidden="true" />
    </button>
  );
}

export function AboutWomanModal({
  profile,
  index,
  count,
  onClose,
  onPrevious,
  onNext,
}: AboutWomanModalProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  const onPreviousRef = useRef(onPrevious);
  const onNextRef = useRef(onNext);
  onCloseRef.current = onClose;
  onPreviousRef.current = onPrevious;
  onNextRef.current = onNext;
  const isOpen = profile !== null;
  const hasPrevious = index > 0;
  const hasNext = index < count - 1;
  const hasPreviousRef = useRef(hasPrevious);
  const hasNextRef = useRef(hasNext);
  hasPreviousRef.current = hasPrevious;
  hasNextRef.current = hasNext;
  const [nav, setNav] = useState<{
    index: number;
    open: boolean;
    direction: SlideDirection;
  }>({
    index,
    open: isOpen,
    direction: "none",
  });
  const changingSlide = slideDirection(nav.index, index, nav.open, isOpen);
  const slide =
    nav.index === index && nav.open === isOpen ? nav.direction : changingSlide;
  if (nav.index !== index || nav.open !== isOpen) {
    setNav({ index, open: isOpen, direction: changingSlide });
  }
  const dragRef = useRef<DragState>({
    pointerId: -1,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    lastTime: 0,
    velocityX: 0,
    velocityY: 0,
    moved: false,
  });
  const settlingRef = useRef(false);
  const suppressBackdropRef = useRef(false);
  const [motion, setMotion] = useState<CardMotion>(REST_MOTION);

  useEffect(() => {
    if (isOpen) return;
    settlingRef.current = false;
    dragRef.current.pointerId = -1;
    setMotion(REST_MOTION);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (mobileDragEnabled()) frameRef.current?.focus({ preventScroll: true });
    else closeButtonRef.current?.focus({ preventScroll: true, focusVisible: false });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (
        (event.key === "ArrowLeft" || event.key === "ArrowRight") &&
        !event.altKey &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.shiftKey
      ) {
        event.preventDefault();
        if (settlingRef.current || dragRef.current.pointerId !== -1) return;
        if (event.key === "ArrowLeft" && hasPreviousRef.current) {
          onPreviousRef.current();
        }
        if (event.key === "ArrowRight" && hasNextRef.current) {
          onNextRef.current();
        }
        return;
      }

      if (event.key !== "Tab") return;
      const dialog = frameRef.current;
      const focusable = dialog?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
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
      previousFocus?.focus();
    };
  }, [isOpen]);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (settlingRef.current || !mobileDragEnabled()) return;
    if (event.pointerType === "mouse") return;
    if ((event.target as HTMLElement).closest("button, a")) return;

    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY,
      lastTime: event.timeStamp,
      velocityX: 0,
      velocityY: 0,
      moved: false,
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
    if (dt > 0) {
      drag.velocityX = (event.clientX - drag.lastX) / dt;
      drag.velocityY = (event.clientY - drag.lastY) / dt;
    }
    drag.lastX = event.clientX;
    drag.lastY = event.clientY;
    drag.lastTime = event.timeStamp;

    const distance = Math.hypot(deltaX, deltaY);
    const progress = Math.min(1, distance / DISMISS_DISTANCE);
    setMotion({
      x: deltaX,
      y: deltaY,
      scaleX: 1,
      scaleY: 1,
      animate: false,
      backdrop: BACKDROP_ALPHA * (1 - progress),
    });
  };

  const releasePointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    try {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    } catch {
      // Capture was already released with the pointer.
    }
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (drag.pointerId !== event.pointerId) return;
    drag.pointerId = -1;
    releasePointer(event);
    if (!drag.moved) return;

    suppressBackdropRef.current = true;
    window.setTimeout(() => {
      suppressBackdropRef.current = false;
    }, 0);

    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;
    const distance = Math.hypot(deltaX, deltaY);
    const idle = event.timeStamp - drag.lastTime;
    const velocityX = idle > 80 ? 0 : drag.velocityX;
    const velocityY = idle > 80 ? 0 : drag.velocityY;
    const speed = Math.hypot(velocityX, velocityY);
    const shouldDismiss = distance >= DISMISS_DISTANCE || speed >= FLICK_PX_PER_MS;

    if (!shouldDismiss) {
      setMotion({ ...REST_MOTION, animate: !prefersReducedMotion() });
      return;
    }

    if (prefersReducedMotion()) {
      onCloseRef.current();
      return;
    }

    const dialog = dialogRef.current;
    const home = dialog ? motionBackToCard(dialog, index) : null;
    if (!home) {
      onCloseRef.current();
      return;
    }

    settlingRef.current = true;
    setMotion(home);
  };

  const onPointerCancel = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (drag.pointerId !== event.pointerId) return;
    drag.pointerId = -1;
    releasePointer(event);
    if (drag.moved) setMotion({ ...REST_MOTION, animate: !prefersReducedMotion() });
  };

  const onDialogTransitionEnd = (event: TransitionEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget || event.propertyName !== "transform") return;
    if (!settlingRef.current) {
      setMotion((current) =>
        current.x === 0 && current.y === 0 ? { ...current, animate: false } : current,
      );
      return;
    }
    settlingRef.current = false;
    onCloseRef.current(true);
  };

  if (!profile) return null;

  const cardStyle = getAboutEthosCardStyle(index);
  const returning =
    motion.animate && (motion.scaleX !== 1 || motion.scaleY !== 1);
  const onDark = cardStyle.color === CREAM;
  const transition = [
    motion.animate ? "transform 280ms cubic-bezier(0.2, 0.8, 0.2, 1)" : null,
    prefersReducedMotion() ? null : "background-color 280ms ease, color 280ms ease",
  ]
    .filter(Boolean)
    .join(", ");

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-3 md:p-8"
      style={{
        background: `rgba(42,31,26,${motion.backdrop})`,
        transition: motion.animate ? "background-color 280ms ease" : "none",
      }}
      role="presentation"
      onMouseDown={(event) => {
        if (suppressBackdropRef.current) return;
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={frameRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={TITLE_ID}
        className={`about-ethos-modal-frame${returning ? " about-ethos-modal-frame--returning" : ""}`}
        style={{
          width: "min(64rem, calc(100vw - 8rem))",
          height: "min(42rem, calc(100dvh - 4rem))",
          maxWidth: "100%",
        }}
      >
        <ProfileNavButton
          direction="previous"
          disabled={!hasPrevious}
          fill={cardStyle.background}
          onDark={onDark}
          onNavigate={onPrevious}
        />
        <div
          ref={dialogRef}
          className={`about-ethos-modal relative flex min-w-0 shrink-0 flex-col overflow-hidden rounded-[2rem] p-6 sm:p-8 md:rounded-[3rem] md:p-12${returning ? " about-ethos-modal--returning" : ""}`}
          style={{
            width: "100%",
            height: "100%",
            background: cardStyle.background,
            boxShadow: "0 32px 90px rgba(42,31,26,0.3)",
            color: cardStyle.color,
            fontFamily: SANS,
            transformOrigin: "center center",
            transform: motionTransform(motion),
            transition: transition || "none",
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          onTransitionEnd={onDialogTransitionEnd}
        >
        <div className="about-ethos-modal__actions absolute right-5 top-5 z-20 flex items-center gap-2 md:right-8 md:top-8">
          <a
            href={profile.website}
            target="_blank"
            rel="noopener noreferrer"
            className={`about-ethos-modal__site ${
              cardStyle.color === CREAM
                ? "about-ethos-modal__site--cream"
                : "about-ethos-modal__site--brown"
            }`}
            aria-label={`Visit ${profile.name}'s website`}
          >
            <ArrowUpRight className="about-ethos-modal__site-icon" aria-hidden="true" />
          </a>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={() => onClose()}
            className="about-ethos-modal__close pill-btn pill-btn--icon rounded-full"
            style={{ color: cardStyle.color }}
            aria-label="Close profile"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div
          key={index}
          className={`about-ethos-modal__layout${
            slide === "none" ? "" : ` about-ethos-modal__layout--${slide}`
          }`}
        >
          <ImageWithFallback
            src={profile.modalImage}
            alt={profile.name}
            className={`about-ethos-modal__image${profile.modalImageClassName ? ` ${profile.modalImageClassName}` : ""}`}
          />

          <div className="about-ethos-modal__copy">
            <p
              className="about-ethos-modal__role"
              style={{ fontFamily: MONO }}
            >
              {profile.role}
            </p>
            <h2
              id={TITLE_ID}
              className="about-ethos-modal__name"
              style={{ fontFamily: SERIF }}
            >
              {profile.name}
            </h2>
            <div className="about-ethos-modal__desc">
              {profile.paragraphs.map((paragraph, paragraphIndex) => (
                <p key={paragraphIndex}>
                  <AboutInlines content={paragraph} />
                </p>
              ))}
            </div>
          </div>

          <p className="about-ethos-modal__scroll-hint">
            <ArrowLeft className="about-ethos-modal__scroll-arrow" aria-hidden="true" />
            Scroll for more
          </p>
        </div>
      </div>
      <ProfileNavButton
        direction="next"
        disabled={!hasNext}
        fill={cardStyle.background}
        onDark={onDark}
        onNavigate={onNext}
      />
      </div>
    </div>,
    document.body,
  );
}
