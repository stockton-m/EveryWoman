import { Play } from "lucide-react";
import { useEffect, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { SANS, SERIF } from "@/app/constants";

/** Keep in sync with the transform/opacity durations in services.css. */
const SCALE_MS = 320;
const FADE_MS = 200;

/** Target arc length of each ray base. Count is the circumference divided by this. */
const RAY_ARC_PX = 56;
const RAY_RADIUS = 50;
const RAY_INNER = 45;
const RAY_OUTER = 58;
/** Where the rounded tip begins, as a fraction of the way from the base to the point. */
const RAY_TIP_START = 0.58;

function rayCountForDiameter(diameter: number) {
  if (diameter <= 0) return 18;
  return Math.max(12, Math.round((Math.PI * diameter) / RAY_ARC_PX));
}

function polar(radius: number, index: number, count: number) {
  const angle = (index / count) * Math.PI * 2 - Math.PI / 2;
  return {
    x: radius * Math.cos(angle),
    y: radius * Math.sin(angle),
  };
}

function rayOutline(count: number) {
  const fmt = (value: number) => value.toFixed(2);
  let path = "";

  for (let index = 0; index < count; index += 1) {
    const left = polar(RAY_INNER, index, count);
    const right = polar(RAY_INNER, index + 1, count);
    const apex = polar(RAY_OUTER, index + 0.5, count);
    const out = {
      x: left.x + (apex.x - left.x) * RAY_TIP_START,
      y: left.y + (apex.y - left.y) * RAY_TIP_START,
    };
    const back = {
      x: right.x + (apex.x - right.x) * RAY_TIP_START,
      y: right.y + (apex.y - right.y) * RAY_TIP_START,
    };

    path += index === 0 ? `M ${fmt(left.x)} ${fmt(left.y)}` : "";
    path += ` L ${fmt(out.x)} ${fmt(out.y)} Q ${fmt(apex.x)} ${fmt(apex.y)} ${fmt(back.x)} ${fmt(back.y)} L ${fmt(right.x)} ${fmt(right.y)}`;
  }

  return `${path} Z`;
}

type QuizTierCalloutProps = {
  targetRef: RefObject<HTMLDivElement | null>;
  quizOpen: boolean;
  onOpen: () => void;
};

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function QuizTierCallout({
  targetRef,
  quizOpen,
  onOpen,
}: QuizTierCalloutProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const timerRef = useRef<number | null>(null);
  const scaledRef = useRef(false);
  const textVisibleRef = useRef(false);
  const desiredRef = useRef(false);
  const intersectingRef = useRef(false);
  const quizOpenRef = useRef(quizOpen);
  const syncRef = useRef<() => void>(() => {});
  const shellRef = useRef<HTMLDivElement>(null);
  const [scaled, setScaled] = useState(false);
  const [textVisible, setTextVisible] = useState(false);
  const [rayCount, setRayCount] = useState(18);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const clearTimer = () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const applyScaled = (next: boolean) => {
      scaledRef.current = next;
      setScaled(next);
      if (!next && document.activeElement === buttonRef.current) {
        buttonRef.current.blur();
      }
    };

    const applyTextVisible = (next: boolean) => {
      textVisibleRef.current = next;
      setTextVisible(next);
    };

    const show = () => {
      clearTimer();
      if (prefersReducedMotion()) {
        applyScaled(true);
        applyTextVisible(true);
        return;
      }

      const alreadyScaled = scaledRef.current;
      applyScaled(true);
      if (textVisibleRef.current) return;

      timerRef.current = window.setTimeout(() => {
        timerRef.current = null;
        applyTextVisible(true);
      }, alreadyScaled ? 0 : SCALE_MS);
    };

    const hide = () => {
      clearTimer();
      const hadText = textVisibleRef.current;
      applyTextVisible(false);

      if (prefersReducedMotion() || !hadText) {
        applyScaled(false);
        return;
      }

      timerRef.current = window.setTimeout(() => {
        timerRef.current = null;
        applyScaled(false);
      }, FADE_MS);
    };

    const intersectsMidline = () => {
      const rect = target.getBoundingClientRect();
      const mid = window.innerHeight / 2;
      return rect.top <= mid && rect.bottom >= mid;
    };

    const sync = () => {
      intersectingRef.current = intersectsMidline();
      const shouldShow = intersectingRef.current && !quizOpenRef.current;
      if (desiredRef.current === shouldShow) return;
      desiredRef.current = shouldShow;
      if (shouldShow) show();
      else hide();
    };

    syncRef.current = sync;

    const observer = new IntersectionObserver(() => sync(), {
      root: null,
      rootMargin: "-50% 0px -50% 0px",
      threshold: 0,
    });

    observer.observe(target);
    window.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);

    return () => {
      clearTimer();
      observer.disconnect();
      window.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
      syncRef.current = () => {};
      desiredRef.current = false;
      scaledRef.current = false;
      textVisibleRef.current = false;
      intersectingRef.current = false;
    };
  }, [targetRef]);

  useEffect(() => {
    quizOpenRef.current = quizOpen;
    syncRef.current();
  }, [quizOpen]);

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;

    const updateRayCount = () => {
      setRayCount(rayCountForDiameter(shell.offsetWidth));
    };

    updateRayCount();
    const observer = new ResizeObserver(updateRayCount);
    observer.observe(shell);
    return () => observer.disconnect();
  }, []);

  const button = (
    <div
      ref={shellRef}
      className={`quiz-tier-callout${scaled ? " is-scaled" : ""}${
        textVisible ? " is-text-visible" : ""
      }`}
    >
      <div
        className="quiz-tier-callout__rays"
        aria-hidden="true"
        style={{
          width: `${(RAY_OUTER / RAY_RADIUS) * 100}%`,
          height: `${(RAY_OUTER / RAY_RADIUS) * 100}%`,
        }}
      >
        <svg
          className="quiz-tier-callout__rays-spin"
          viewBox={`${-RAY_OUTER} ${-RAY_OUTER} ${RAY_OUTER * 2} ${RAY_OUTER * 2}`}
        >
          <path d={rayOutline(rayCount)} />
        </svg>
      </div>
      <button
        ref={buttonRef}
        type="button"
        className="quiz-tier-callout__face"
        tabIndex={scaled && !quizOpen ? 0 : -1}
        aria-hidden={scaled && !quizOpen ? undefined : true}
        onClick={onOpen}
        style={{ fontFamily: SANS }}
      >
        <span className="quiz-tier-callout__copy">
          <span
            className="quiz-tier-callout__title"
            style={{ fontFamily: SERIF }}
          >
            Not sure what tier to pick?
          </span>
          <span className="quiz-tier-callout__body">
            Answer some quick questions to find out what coaching tier works
            best for you.
          </span>
        </span>
        <Play
          className="quiz-tier-callout__play"
          fill="currentColor"
          aria-hidden="true"
        />
      </button>
    </div>
  );

  return createPortal(button, document.body);
}
