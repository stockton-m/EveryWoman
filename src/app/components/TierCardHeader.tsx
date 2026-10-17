import type { CoachingTier } from "@/app/content/coaching";
import { TierGetStartedButton } from "@/app/components/TierGetStartedButton";
import { TierPatternIcon } from "@/app/components/TierPatternIcon";
import { EMBER, SANS, SERIF, STONE } from "@/app/constants";

type TierCardHeaderProps = {
  tier: CoachingTier;
  equalHeight?: boolean;
  /** Second CTA above the benefits list (uses slack in equal-height header). */
  showMidGetStarted?: boolean;
};

export function MostPopularBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-[0.12em] whitespace-nowrap ${className}`}
      style={{ background: EMBER, color: "#f5ede4", fontFamily: SANS }}
    >
      Most popular
    </span>
  );
}

export function TierCardHeader({
  tier,
  equalHeight = false,
  showMidGetStarted = false,
}: TierCardHeaderProps) {
  return (
    <div
      className={`relative p-8 pb-6 ${
        equalHeight ? "min-h-[26rem] flex flex-col" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-4 mb-5">
        <h3
          className="font-bold"
          style={{
            fontFamily: SERIF,
            color: "#2a1f1a",
            fontSize: "clamp(1.5rem, 2vw, 1.75rem)",
          }}
        >
          {tier.name}
        </h3>
        <TierPatternIcon
          tierId={tier.id}
          className="w-12 h-12 flex-shrink-0 text-[#c4622d]"
        />
      </div>

      <p
        className="text-sm leading-snug font-medium mb-4"
        style={{ fontFamily: SERIF, color: "#2a1f1a" }}
      >
        {tier.tagline}
      </p>

      {tier.intro.map((paragraph, i) => (
        <p
          key={i}
          className="text-sm leading-relaxed mb-3 last:mb-0"
          style={{ color: STONE }}
        >
          {paragraph}
        </p>
      ))}

      {showMidGetStarted && (
        <div className={equalHeight ? "mt-auto pt-4" : "mt-4"}>
          <TierGetStartedButton />
        </div>
      )}
    </div>
  );
}
