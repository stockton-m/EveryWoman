import type { CoachingTierId } from "@/app/content/coaching";

type TierPatternIconProps = {
  tierId: CoachingTierId;
  className?: string;
};

const STROKE = {
  stroke: "currentColor",
  strokeWidth: 2,
} as const;

export function TierPatternIcon({
  tierId,
  className = "",
}: TierPatternIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={`block ${className}`}
      viewBox="0 0 48 48"
      fill="none"
    >
      {tierId === "foundation" && (
        <circle cx="24" cy="24" r="19" {...STROKE} />
      )}
      {tierId === "signature" && (
        <g transform="rotate(-45 24 24)">
          <circle cx="18" cy="24" r="14" {...STROKE} />
          <circle cx="30" cy="24" r="14" {...STROKE} />
        </g>
      )}
      {tierId === "elevated" && (
        <>
          <circle cx="17" cy="19.96" r="12" {...STROKE} />
          <circle cx="31" cy="19.96" r="12" {...STROKE} />
          <circle cx="24" cy="32.08" r="12" {...STROKE} />
        </>
      )}
    </svg>
  );
}
