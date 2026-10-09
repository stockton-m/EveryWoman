import { SAGE } from "@/app/constants";

export function AboutGuideLine() {
  return (
    <div className="about-guide-line" aria-hidden="true">
      <svg
        className="about-guide-line__desktop"
        viewBox="0 0 1200 5600"
        preserveAspectRatio="none"
      >
        <path
          d="M 250 0
             C 250 80, 135 430, 430 810
             C 563 981, 1075 1060, 940 1390
             C 820 1680, 325 1510, 265 1875
             C 205 2240, 975 2110, 1015 2510
             C 1055 2890, 245 2800, 220 3220
             C 200 3580, 1015 3490, 965 3885
             C 920 4240, 1060 4300, 1080 4520
             C 1113 4883, 680 5120, 600 5600"
          fill="none"
          stroke={SAGE}
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <svg
        className="about-guide-line__mobile"
        viewBox="0 0 400 6600"
        preserveAspectRatio="none"
      >
        <path
          d="M 200 0
             C 200 60, 55 390, 225 860
             C 310 1095, 350 1310, 175 1460
             C 20 1600, 45 1990, 240 2150
             C 380 2280, 350 2700, 145 2870
             C 15 3000, 50 3450, 265 3590
             C 385 3710, 345 4140, 125 4310
             C 46 4371, 375 4950, 365 5090
             C 309 5874, 240 6150, 200 6600"
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
