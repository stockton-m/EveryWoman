import { SAGE } from "@/app/constants";

export function PostsGuideLine() {
  return (
    <div className="posts-guide-line" aria-hidden="true">
      <svg className="posts-guide-line__desktop" viewBox="0 0 1200 5760">
        <path
          d="M 640 0
             C 760 128, 1164 208, 1136 576
             C 1108 944, 48 880, 72 1296
             C 96 1712, 1168 1648, 1124 2064
             C 1080 2480, 36 2416, 68 2832
             C 100 3248, 1172 3184, 1132 3600
             C 1092 4016, 44 3952, 76 4368
             C 108 4784, 1160 4720, 1108 5136
             C 1056 5552, 420 5664, 360 5760"
          fill="none"
          stroke={SAGE}
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <svg className="posts-guide-line__mobile" viewBox="0 0 400 6400">
        <path
          d="M 200 0
             C 240 120, 386 210, 374 540
             C 362 870, 14 820, 26 1200
             C 38 1580, 388 1520, 370 1900
             C 352 2280, 12 2220, 28 2600
             C 44 2980, 390 2920, 368 3300
             C 346 3680, 10 3620, 30 4000
             C 50 4380, 386 4320, 366 4700
             C 346 5080, 16 5020, 34 5400
             C 52 5780, 220 6100, 180 6400"
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
