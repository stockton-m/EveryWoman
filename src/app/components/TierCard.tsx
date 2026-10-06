import { ArrowUpRight, Check, X } from "lucide-react";
import {
  COACHING_FEATURES,
  type CoachingTier,
  tierHasFeature,
} from "@/app/content/coaching";
import { CONSULTATION_URL, EMBER, SANS, SERIF, STONE } from "@/app/constants";

type TierCardProps = {
  tier: CoachingTier;
};

export function TierCard({ tier }: TierCardProps) {
  const Icon = tier.icon;
  const highlighted = tier.highlighted === true;

  return (
    <div
      className={`relative flex flex-col rounded-[2rem] p-8 transition-all duration-300 ${
        highlighted ? "md:scale-[1.02] md:-translate-y-1" : ""
      }`}
      style={{
        background: "#fff",
        border: highlighted
          ? `2px solid ${EMBER}`
          : "1px solid rgba(42,31,26,0.08)",
        boxShadow: highlighted
          ? "0 24px 60px rgba(196,98,45,0.15), 0 4px 20px rgba(42,31,26,0.06)"
          : "0 2px 12px rgba(42,31,26,0.06)",
      }}
    >
      {highlighted && (
        <span
          className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-[0.12em]"
          style={{ background: EMBER, color: "#f5ede4", fontFamily: SANS }}
        >
          Most popular
        </span>
      )}

      <div
        className="rounded-full flex items-center justify-center mb-5"
        style={{ background: EMBER, width: "48px", height: "48px" }}
      >
        <Icon className="w-6 h-6" style={{ color: "#f5ede4" }} />
      </div>

      <h3
        className="font-bold mb-3"
        style={{
          fontFamily: SERIF,
          color: "#2a1f1a",
          fontSize: "clamp(1.25rem, 2vw, 1.5rem)",
        }}
      >
        {tier.name}
      </h3>

      <p
        className="text-sm leading-relaxed mb-6 flex-1"
        style={{ color: STONE }}
      >
        {tier.blurb}
      </p>

      <ul className="space-y-2.5 mb-8">
        {COACHING_FEATURES.map((feature) => {
          const included = tierHasFeature(tier.id, feature);
          return (
            <li
              key={feature.label}
              className="flex items-start gap-2.5 text-sm"
              style={{ color: included ? "#2a1f1a" : STONE }}
            >
              {included ? (
                <Check
                  className="w-4 h-4 flex-shrink-0 mt-0.5"
                  style={{ color: EMBER }}
                  aria-hidden
                />
              ) : (
                <X
                  className="w-4 h-4 flex-shrink-0 mt-0.5 opacity-50"
                  aria-hidden
                />
              )}
              <span className={included ? "" : "opacity-60"}>
                {feature.label}
              </span>
            </li>
          );
        })}
      </ul>

      <a
        href={CONSULTATION_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-semibold transition-all duration-200 hover:-translate-y-1 hover:shadow-lg w-full"
        style={{ background: EMBER, color: "#f5ede4", fontFamily: SANS }}
      >
        Get started
        <ArrowUpRight className="w-3.5 h-3.5" />
      </a>
    </div>
  );
}
