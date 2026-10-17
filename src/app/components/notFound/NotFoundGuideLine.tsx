import { SAGE } from "@/app/constants";

export function NotFoundGuideLine() {
  return (
    <div className="not-found-guide-line" aria-hidden="true">
      <svg
        className="not-found-guide-line__desktop"
        viewBox="0 0 1200 900"
        preserveAspectRatio="none"
      >
        <path
          d="M 860 0
             C 840 240, 780 520, 820 900"
          fill="none"
          stroke={SAGE}
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <svg
        className="not-found-guide-line__mobile"
        viewBox="0 0 400 1000"
        preserveAspectRatio="none"
      >
        <path
          d="M 300 0
             C 292 280, 250 620, 280 1000"
          fill="none"
          stroke={SAGE}
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}
