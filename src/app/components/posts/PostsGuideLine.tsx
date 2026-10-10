import { SAGE } from "@/app/constants";

export function PostsGuideLine() {
  return (
    <div className="posts-guide-line" aria-hidden="true">
      <svg
        className="posts-guide-line__desktop"
        viewBox="0 0 1200 5200"
        preserveAspectRatio="none"
      >
        <path
          d="M 780 0
             C 780 120, 1040 280, 980 620
             C 900 1060, 180 980, 240 1480
             C 290 1900, 1080 1780, 1020 2280
             C 960 2740, 140 2620, 200 3180
             C 250 3660, 980 3520, 900 4020
             C 820 4480, 420 4700, 360 5200"
          fill="none"
          stroke={SAGE}
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <svg
        className="posts-guide-line__mobile"
        viewBox="0 0 400 6400"
        preserveAspectRatio="none"
      >
        <path
          d="M 90 0
             C 90 180, 340 420, 310 900
             C 280 1320, 40 1500, 70 1980
             C 100 2460, 360 2680, 320 3180
             C 280 3680, 30 3900, 80 4420
             C 130 4940, 350 5200, 300 5720
             C 250 6200, 160 6320, 180 6400"
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
