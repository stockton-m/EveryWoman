import { useEffect, useRef } from "react";
import { EMBER } from "@/app/constants";

type RingPoint = {
  angle: number;
  amplitude: number;
  period: number;
  phase: number;
};

const RING_POINTS: RingPoint[] = [
  { angle: 0, amplitude: 5.5, period: 7.2, phase: 0 },
  { angle: 55, amplitude: 4, period: 9.1, phase: 1.4 },
  { angle: 120, amplitude: 6.5, period: 6.6, phase: 2.6 },
  { angle: 190, amplitude: 4.5, period: 8.4, phase: 0.5 },
  { angle: 250, amplitude: 6, period: 10, phase: 3.2 },
  { angle: 310, amplitude: 5, period: 7.8, phase: 1.9 },
];

const SAMPLE_COUNT = 64;
const BASE_THICKNESS = 8;
const INNER_OVERLAP = 1;

function format(value: number): string {
  return value.toFixed(2);
}

function offsetAt(point: RingPoint, timeMs: number | null): number {
  if (timeMs === null) return BASE_THICKNESS;
  const seconds = timeMs / 1000;
  const wave = Math.sin(
    (Math.PI * 2 * seconds) / point.period + point.phase,
  );
  return Math.max(1, 2 * (BASE_THICKNESS + point.amplitude * wave));
}

function thicknessAt(angle: number, timeMs: number | null): number {
  const theta = ((angle % 360) + 360) % 360;
  const count = RING_POINTS.length;
  let index = count - 1;
  for (let i = 0; i < count; i++) {
    if (RING_POINTS[i].angle <= theta) index = i;
    else break;
  }

  const start = RING_POINTS[index];
  const end = RING_POINTS[(index + 1) % count];
  const startAngle = start.angle;
  let endAngle = end.angle;
  if (endAngle <= startAngle) endAngle += 360;
  let current = theta;
  if (current < startAngle) current += 360;
  const span = endAngle - startAngle;
  const blend = span === 0 ? 0 : (current - startAngle) / span;
  const smooth = 0.5 - 0.5 * Math.cos(Math.PI * blend);
  const startOffset = offsetAt(start, timeMs);
  const endOffset = offsetAt(end, timeMs);
  return startOffset + (endOffset - startOffset) * smooth;
}

function ringPath(size: number, pad: number, timeMs: number | null): string {
  const center = pad + size / 2;
  const imageRadius = size / 2;
  const points = Array.from({ length: SAMPLE_COUNT }, (_, index) => {
    const theta = (index / SAMPLE_COUNT) * Math.PI * 2;
    const radius =
      imageRadius + thicknessAt((theta * 180) / Math.PI, timeMs);
    return {
      x: center + radius * Math.cos(theta),
      y: center + radius * Math.sin(theta),
    };
  });

  let path = `M ${format(points[0].x)} ${format(points[0].y)}`;
  for (let i = 0; i < SAMPLE_COUNT; i++) {
    const p0 = points[(i - 1 + SAMPLE_COUNT) % SAMPLE_COUNT];
    const p1 = points[i];
    const p2 = points[(i + 1) % SAMPLE_COUNT];
    const p3 = points[(i + 2) % SAMPLE_COUNT];
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    path += ` C ${format(c1x)} ${format(c1y)} ${format(c2x)} ${format(c2y)} ${format(p2.x)} ${format(p2.y)}`;
  }
  path += " Z";

  const hole = Math.max(0, imageRadius - INNER_OVERLAP);
  path += ` M ${format(center - hole)} ${format(center)}`;
  path += ` A ${format(hole)} ${format(hole)} 0 1 0 ${format(center + hole)} ${format(center)}`;
  path += ` A ${format(hole)} ${format(hole)} 0 1 0 ${format(center - hole)} ${format(center)} Z`;
  return path;
}

export function AboutHeroRing() {
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    const path = pathRef.current;
    const frame = svg?.parentElement;
    if (!svg || !path || !frame) return;

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frameId = 0;

    const draw = (time: number) => {
      const size = frame.clientWidth;
      if (size > 0) {
        const pad =
          Number.parseFloat(
            getComputedStyle(frame).getPropertyValue("--about-ring-pad"),
          ) || 40;
        path.setAttribute("d", ringPath(size, pad, media.matches ? null : time));
      }
      if (!media.matches) frameId = window.requestAnimationFrame(draw);
    };

    const start = () => {
      window.cancelAnimationFrame(frameId);
      frameId = 0;
      if (media.matches) draw(0);
      else frameId = window.requestAnimationFrame(draw);
    };

    start();
    media.addEventListener("change", start);
    const observer = new ResizeObserver(() => {
      if (media.matches) draw(0);
    });
    observer.observe(frame);

    return () => {
      window.cancelAnimationFrame(frameId);
      media.removeEventListener("change", start);
      observer.disconnect();
    };
  }, []);

  return (
    <svg ref={svgRef} className="about-hero__ring" aria-hidden="true">
      <path ref={pathRef} fill={EMBER} fillRule="evenodd" />
    </svg>
  );
}
