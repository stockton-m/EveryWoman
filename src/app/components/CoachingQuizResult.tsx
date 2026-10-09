import { ArrowUpRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { TierPatternIcon } from "@/app/components/TierPatternIcon";
import { COACHING_TIERS } from "@/app/content/coaching";
import { COACHING_TIER_BEST_FOR } from "@/app/content/coachingQuiz";
import type { CoachingQuizResult as CoachingQuizResultData } from "@/app/lib/coachingQuizScoring";
import {
  BLUSH,
  BROWN,
  CONSULTATION_URL,
  CREAM,
  EMBER,
  SAGE,
  SANS,
  SERIF,
} from "@/app/constants";

type CoachingQuizResultProps = {
  result: CoachingQuizResultData;
  titleId: string;
};

type ConnectorPoints = {
  startX: number;
  startY: number;
  bendX: number;
  endX: number;
  endY: number;
};

const ARCHETYPE_COLORS = [SAGE, EMBER, BLUSH] as const;

export function CoachingQuizResult({
  result,
  titleId,
}: CoachingQuizResultProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [connector, setConnector] = useState<ConnectorPoints | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const themeRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const tier = COACHING_TIERS.find((item) => item.id === result.tierId);
  const activeArchetype = result.archetypes[activeIndex];
  const activeColor = ARCHETYPE_COLORS[activeIndex];

  const segments = useMemo(() => {
    let start = 0;
    return result.archetypes.map((archetype, index) => {
      const segment = {
        ...archetype,
        start,
        color: ARCHETYPE_COLORS[index],
      };
      start += archetype.percent;
      return segment;
    });
  }, [result.archetypes]);

  const activeSegment = segments[activeIndex];
  const rotation =
    180 - (activeSegment.start + activeSegment.percent / 2) * 3.6;

  useEffect(() => {
    setActiveIndex(0);
  }, [result.tierId]);

  useEffect(() => {
    const updateConnector = () => {
      const container = containerRef.current;
      const chart = chartRef.current;
      const theme = themeRefs.current[activeIndex];
      if (!container || !chart || !theme) return;

      const containerBox = container.getBoundingClientRect();
      const chartBox = chart.getBoundingClientRect();
      const themeBox = theme.getBoundingClientRect();
      const startX = themeBox.right - containerBox.left;
      const startY = themeBox.top - containerBox.top + themeBox.height / 2;
      const endX =
        chartBox.left - containerBox.left + chartBox.width * 0.1;
      const endY = chartBox.top - containerBox.top + chartBox.height / 2;
      const available = endX - startX;
      const bendX =
        available > 40
          ? startX + available * 0.55
          : Math.min(startX + 36, containerBox.width - 24);

      setConnector({ startX, startY, bendX, endX, endY });
    };

    updateConnector();
    const observer = new ResizeObserver(updateConnector);
    if (containerRef.current) observer.observe(containerRef.current);
    if (chartRef.current) observer.observe(chartRef.current);
    themeRefs.current.forEach((theme) => {
      if (theme) observer.observe(theme);
    });
    window.addEventListener("resize", updateConnector);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateConnector);
    };
  }, [activeIndex, result.archetypes]);

  if (!tier || !activeArchetype) return null;

  return (
    <div className="flex min-h-[34rem] flex-1 flex-col">
      <p
        className="mb-5 pr-12 text-left text-xs font-semibold uppercase tracking-[0.18em] md:text-sm"
        style={{ color: "rgba(245,237,228,0.78)", fontFamily: SANS }}
      >
        Your suggested coaching tier is
      </p>

      <div className="mb-4 flex w-full max-w-3xl flex-wrap items-center gap-4">
        <span
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full md:h-20 md:w-20"
          style={{ background: CREAM, color: EMBER }}
        >
          <TierPatternIcon tierId={tier.id} className="h-11 w-11 md:h-14 md:w-14" />
        </span>
        <h2
          id={titleId}
          className="font-bold leading-none"
          style={{
            color: CREAM,
            fontFamily: SERIF,
            fontSize: "clamp(2.4rem, 7vw, 5rem)",
            transform: "translateY(-0.1em)",
          }}
        >
          {tier.name}
        </h2>
        <a
          href={CONSULTATION_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="pill-btn pill-btn--ember ml-auto inline-flex shrink-0 items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          Get started
          <ArrowUpRight className="h-4 w-4" />
        </a>
      </div>

      <p
        className="mb-2 max-w-3xl text-base font-semibold leading-relaxed"
        style={{ color: CREAM }}
      >
        {COACHING_TIER_BEST_FOR[tier.id]}
      </p>
      <p
        className="mb-5 max-w-3xl text-sm leading-relaxed md:text-base"
        style={{ color: "rgba(245,237,228,0.82)" }}
      >
        {result.explanation}
      </p>

      <div ref={containerRef} className="relative mt-auto">
        {connector && (
          <svg
            className="pointer-events-none absolute inset-0 z-20 h-full w-full overflow-visible"
            aria-hidden="true"
          >
            <polyline
              className="coaching-archetype-connector"
              points={`${connector.startX},${connector.startY} ${connector.bendX},${connector.startY} ${connector.endX},${connector.endY}`}
              fill="none"
              stroke={CREAM}
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ transition: "all 420ms ease" }}
            />
            <polyline
              className="coaching-archetype-connector"
              points={`${connector.startX},${connector.startY} ${connector.bendX},${connector.startY} ${connector.endX},${connector.endY}`}
              fill="none"
              stroke={activeColor}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ transition: "all 420ms ease" }}
            />
          </svg>
        )}

        <div className="relative z-10 grid items-center gap-7 lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-12">
          <div className="space-y-2">
              {result.archetypes.map((archetype, index) => {
                const isActive = index === activeIndex;
                return (
                  <button
                    ref={(element) => {
                      themeRefs.current[index] = element;
                    }}
                    key={archetype.id}
                    type="button"
                    className="block w-full rounded-2xl px-4 py-3 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                    style={{
                      background: isActive
                        ? CREAM
                        : "transparent",
                      outlineColor: ARCHETYPE_COLORS[index],
                    }}
                    onMouseEnter={() => setActiveIndex(index)}
                    onFocus={() => setActiveIndex(index)}
                    onClick={() => setActiveIndex(index)}
                    aria-pressed={isActive}
                  >
                    <span
                      className="inline-block text-base font-bold md:text-lg"
                      style={{
                        color: isActive ? ARCHETYPE_COLORS[index] : CREAM,
                      }}
                    >
                      {archetype.label}
                    </span>
                    <span
                      className="mt-1 block max-w-xl text-xs leading-relaxed md:text-sm"
                      style={{
                        color: isActive
                          ? BROWN
                          : "rgba(245,237,228,0.76)",
                      }}
                    >
                      {archetype.description}
                    </span>
                  </button>
                );
              })}
          </div>

          <div
            ref={chartRef}
            className="relative mx-auto h-64 w-64 shrink-0 md:h-72 md:w-72"
            aria-label={`${activeArchetype.label}: ${activeArchetype.percent}%`}
          >
            <svg
              viewBox="0 0 240 240"
              className="h-full w-full"
              role="img"
              aria-hidden="true"
            >
              <circle cx="120" cy="120" r="112" fill={CREAM} />
              <circle
                cx="120"
                cy="120"
                r="96"
                fill="none"
                stroke="rgba(42,31,26,0.1)"
                strokeWidth="14"
              />
              <g
                className="coaching-archetype-ring"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transformOrigin: "120px 120px",
                  transition: "transform 520ms cubic-bezier(0.22, 1, 0.36, 1)",
                }}
              >
                {segments.map((segment) => (
                  <circle
                    key={segment.id}
                    cx="120"
                    cy="120"
                    r="96"
                    pathLength="100"
                    fill="none"
                    stroke={segment.color}
                    strokeWidth={activeArchetype.id === segment.id ? 17 : 13}
                    strokeDasharray={`${segment.percent} ${100 - segment.percent}`}
                    strokeDashoffset={-segment.start}
                    style={{
                      transition: "stroke-width 220ms ease",
                    }}
                  />
                ))}
              </g>
            </svg>

            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span
                className="font-bold leading-none transition-colors"
                style={{
                  color: activeColor,
                  fontFamily: SERIF,
                  fontSize: "clamp(2.3rem, 7vw, 4rem)",
                }}
              >
                {activeArchetype.percent}%
              </span>
              <span
                className="mt-1 max-w-[9rem] text-center text-[0.65rem] font-bold uppercase tracking-[0.12em]"
                style={{ color: BROWN }}
              >
                {activeArchetype.label}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
