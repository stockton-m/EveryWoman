import { SAGE } from "@/app/constants";

export function ServicesGuideLine() {
  return (
    <div className="services-guide-line" aria-hidden="true">
      <svg
        className="services-guide-line__desktop"
        viewBox="0 0 1200 5600"
        preserveAspectRatio="none"
      >
        <path
          d="M 560 0
             C 560 280, 1040 420, 980 980
             C 910 1620, 180 1480, 260 2200
             C 330 2840, 1080 2700, 1000 3400
             C 920 4100, 160 3960, 280 4700
             C 360 5200, 700 5400, 640 5600"
          fill="none"
          stroke={SAGE}
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <svg
        className="services-guide-line__mobile"
        viewBox="0 0 400 6400"
        preserveAspectRatio="none"
      >
        <path
          d="M 200 0
             C 200 200, 360 480, 330 1100
             C 300 1720, 40 1900, 80 2600
             C 113 3180, 370 3400, 330 4100
             C 294 4700, 30 4920, 90 5600
             C 129 6040, 220 6280, 210 6400"
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
