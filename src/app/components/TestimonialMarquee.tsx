// @experimental
import "@/styles/testimonials.css";
import { useEffect, useRef } from "react";
import { TESTIMONIALS } from "@/app/content/testimonials";
import { BLUSH, BROWN, CREAM, EMBER, SANS, SAGE, SERIF } from "@/app/constants";

const CARD_TONES = [
  { background: EMBER, color: CREAM },
  { background: BLUSH, color: BROWN },
  { background: SAGE, color: CREAM },
] as const;

function TestimonialCards({ hidden = false }: { hidden?: boolean }) {
  return (
    <ul className="testimonial-set" aria-hidden={hidden || undefined}>
      {TESTIMONIALS.map((testimonial, index) => {
        const tone = CARD_TONES[index % CARD_TONES.length];
        return (
          <li
            key={`${testimonial.name}-${index}`}
            className="testimonial-card flex flex-col justify-between rounded-[2rem] md:rounded-[2.5rem] p-8 md:p-10"
            style={{
              background: tone.background,
              color: tone.color,
              boxShadow:
                "0 24px 60px rgba(0,0,0,0.22), 0 4px 16px rgba(0,0,0,0.12)",
            }}
          >
            <p
              className="text-left leading-snug font-medium"
              style={{
                fontFamily: SERIF,
                fontSize: "clamp(1.55rem, 2.4vw, 1.9rem)",
              }}
            >
              {testimonial.text}
            </p>
            <p
              className="text-right text-sm md:text-base mt-8"
              style={{ fontFamily: SANS }}
            >
              — {testimonial.name}
            </p>
          </li>
        );
      })}
    </ul>
  );
}

const MARQUEE_MS = 75_000;
const DRAG_SLOP = 8;

export function TestimonialMarquee() {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const mobileQuery = window.matchMedia("(max-width: 1023px)");
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    let animation: Animation | null = null;
    let pointerId = -1;
    let startX = 0;
    let startY = 0;
    let lastX = 0;
    let axis: "undecided" | "x" | "y" = "undecided";

    const stopDragMode = () => {
      animation?.cancel();
      animation = null;
      pointerId = -1;
      axis = "undecided";
      track.classList.remove("is-drag-driven", "is-dragging");
    };

    const startDragMode = () => {
      if (animation || !mobileQuery.matches || motionQuery.matches) return;
      const width = track.scrollWidth / 2;
      const matrix = new DOMMatrix(getComputedStyle(track).transform);
      const progress = width ? (Math.abs(matrix.m41) % width) / width : 0;
      track.classList.add("is-drag-driven");
      animation = track.animate(
        [{ transform: "translateX(0)" }, { transform: "translateX(-50%)" }],
        { duration: MARQUEE_MS, iterations: Infinity, easing: "linear" },
      );
      animation.currentTime = progress * MARQUEE_MS;
    };

    const sync = () => {
      if (mobileQuery.matches && !motionQuery.matches) startDragMode();
      else stopDragMode();
    };

    const onPointerDown = (event: PointerEvent) => {
      if (!animation || event.button !== 0) return;
      pointerId = event.pointerId;
      startX = lastX = event.clientX;
      startY = event.clientY;
      axis = "undecided";
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!animation || event.pointerId !== pointerId) return;

      if (axis === "undecided") {
        const dx = event.clientX - startX;
        const dy = event.clientY - startY;
        if (Math.hypot(dx, dy) < DRAG_SLOP) return;
        if (Math.abs(dy) >= Math.abs(dx)) {
          axis = "y";
          pointerId = -1;
          return;
        }
        axis = "x";
        lastX = startX;
        animation.pause();
        track.classList.add("is-dragging");
        try {
          track.setPointerCapture(event.pointerId);
        } catch {
          // Capture is unavailable for this pointer; moves still update the track.
        }
      }

      if (axis !== "x") return;

      const deltaX = event.clientX - lastX;
      lastX = event.clientX;
      const width = track.scrollWidth / 2;
      if (!width) return;
      const deltaTime = (-deltaX / width) * MARQUEE_MS;
      const current = Number(animation.currentTime ?? 0);
      let next = (current + deltaTime) % MARQUEE_MS;
      if (next < 0) next += MARQUEE_MS;
      animation.currentTime = next;
    };

    const onPointerUp = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return;
      const wasDragging = axis === "x";
      pointerId = -1;
      axis = "undecided";
      track.classList.remove("is-dragging");
      if (wasDragging) animation?.play();
    };

    track.addEventListener("pointerdown", onPointerDown);
    track.addEventListener("pointermove", onPointerMove);
    track.addEventListener("pointerup", onPointerUp);
    track.addEventListener("pointercancel", onPointerUp);
    mobileQuery.addEventListener("change", sync);
    motionQuery.addEventListener("change", sync);
    sync();

    return () => {
      track.removeEventListener("pointerdown", onPointerDown);
      track.removeEventListener("pointermove", onPointerMove);
      track.removeEventListener("pointerup", onPointerUp);
      track.removeEventListener("pointercancel", onPointerUp);
      mobileQuery.removeEventListener("change", sync);
      motionQuery.removeEventListener("change", sync);
      stopDragMode();
    };
  }, []);

  return (
    <section className="mb-16" aria-labelledby="client-testimonials-heading">
      <div className="testimonial-band">
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <h2
            id="client-testimonials-heading"
            className="font-bold text-left mb-8"
            style={{
              fontFamily: SERIF,
              color: CREAM,
              fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
            }}
          >
            From my clients...
          </h2>
        </div>
        <div ref={trackRef} className="testimonial-track">
          <TestimonialCards />
          <TestimonialCards hidden />
        </div>
      </div>
    </section>
  );
}
