import { SAGE } from "@/app/constants";

export function ContactGuideLine() {
  return (
    <div className="contact-guide-line" aria-hidden="true">
      <svg
        className="contact-guide-line__desktop"
        viewBox="0 0 1200 1800"
        preserveAspectRatio="none"
      >
        <path
          d="M 680 0
             C 660 150, 50 220, 180 900
             C 240 1240, 560 1520, 820 1800"
          fill="none"
          stroke={SAGE}
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <svg
        className="contact-guide-line__mobile"
        viewBox="0 0 400 2200"
        preserveAspectRatio="none"
      >
        <path
          d="M 240 0
             C 230 170, 18 240, 60 1100
             C 80 1500, 200 1800, 280 2200"
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
