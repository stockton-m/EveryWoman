import { useState } from "react";
import { BenefitCell } from "@/app/components/BenefitCell";
import { BenefitDetailModal } from "@/app/components/BenefitDetailModal";
import { TierCardFooter } from "@/app/components/TierCardFooter";
import {
  MostPopularBadge,
  TierCardHeader,
} from "@/app/components/TierCardHeader";
import {
  COACHING_BENEFITS,
  type CoachingBenefit,
  type CoachingTier,
  type CoachingTierId,
} from "@/app/content/coaching";
import { EMBER, SANS, STONE } from "@/app/constants";

function BenefitsIncludesLabel() {
  return (
    <p
      className="px-4 lg:px-6 pt-2 pb-1 text-sm font-semibold"
      style={{ fontFamily: SANS, color: STONE }}
    >
      Includes:
    </p>
  );
}

const TIER_IDS: CoachingTierId[] = ["foundation", "signature", "elevated"];

type TierComparisonGridProps = {
  tiers: CoachingTier[];
};

export function TierComparisonGrid({ tiers }: TierComparisonGridProps) {
  const [hoveredBenefitId, setHoveredBenefitId] = useState<string | null>(
    null,
  );
  const [selectedBenefit, setSelectedBenefit] =
    useState<CoachingBenefit | null>(null);

  const openBenefit = (benefit: CoachingBenefit) =>
    setSelectedBenefit(benefit);

  const tierById = Object.fromEntries(tiers.map((t) => [t.id, t])) as Record<
    CoachingTierId,
    CoachingTier
  >;

  const benefitCount = COACHING_BENEFITS.length;
  const totalRows = benefitCount + 3;

  return (
    <>
      <BenefitDetailModal
        benefit={selectedBenefit}
        onClose={() => setSelectedBenefit(null)}
      />

      {/* Desktop: one grid — column backdrops + aligned rows */}
      <div
        className="hidden lg:grid gap-x-6 mb-16 pt-10 items-stretch"
        style={{
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gridTemplateRows: `auto auto repeat(${benefitCount}, auto) auto`,
        }}
      >
        {TIER_IDS.map((tierId, colIndex) => (
          <div
            key={`bg-${tierId}`}
            aria-hidden
            className="rounded-[2rem] bg-white pointer-events-none"
            style={{
              gridColumn: colIndex + 1,
              gridRow: `1 / ${totalRows + 1}`,
              zIndex: tierId === "signature" ? 1 : 0,
              boxShadow:
                tierId === "signature"
                  ? "0 24px 60px rgba(196,98,45,0.15), 0 4px 20px rgba(42,31,26,0.06)"
                  : "0 2px 12px rgba(42,31,26,0.06)",
              border:
                tierId === "signature"
                  ? `2px solid ${EMBER}`
                  : "1px solid rgba(42,31,26,0.08)",
            }}
          />
        ))}

        {TIER_IDS.map((tierId, colIndex) => (
          <div
            key={`header-${tierId}`}
            className="relative z-10 min-w-0"
            style={{ gridColumn: colIndex + 1, gridRow: 1 }}
          >
            {tierId === "signature" && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2">
                <MostPopularBadge />
              </div>
            )}
            <TierCardHeader
              tier={tierById[tierId]}
              equalHeight
              showMidGetStarted
            />
          </div>
        ))}

        {TIER_IDS.map((tierId, colIndex) => (
          <div
            key={`includes-${tierId}`}
            className="relative z-10 min-w-0"
            style={{ gridColumn: colIndex + 1, gridRow: 2 }}
          >
            <BenefitsIncludesLabel />
          </div>
        ))}

        {COACHING_BENEFITS.map((benefit, rowIndex) =>
          TIER_IDS.map((tierId, colIndex) => (
            <div
              key={`${benefit.id}-${tierId}`}
              className="relative z-10 min-w-0"
              style={{ gridColumn: colIndex + 1, gridRow: rowIndex + 3 }}
              onMouseEnter={() => setHoveredBenefitId(benefit.id)}
              onMouseLeave={() => setHoveredBenefitId(null)}
            >
              <BenefitCell
                benefit={benefit}
                tierId={tierId}
                isHovered={hoveredBenefitId === benefit.id}
                onBenefitClick={openBenefit}
              />
            </div>
          )),
        )}

        {TIER_IDS.map((tierId, colIndex) => (
          <div
            key={`footer-${tierId}`}
            className="relative z-10 min-w-0"
            style={{ gridColumn: colIndex + 1, gridRow: totalRows }}
          >
            <TierCardFooter />
          </div>
        ))}
      </div>

      {/* Mobile: stacked tier cards */}
      <div className="lg:hidden flex flex-col gap-10 mb-16 pt-4">
        {TIER_IDS.map((tierId) => (
          <div key={tierId} className="relative flex flex-col items-stretch">
            {tierId === "signature" && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2">
                <MostPopularBadge />
              </div>
            )}
            <div
              className={`rounded-[2rem] bg-white ${
                tierId === "signature"
                  ? "border-2 border-[#c4622d] shadow-lg"
                  : "border border-[rgba(42,31,26,0.08)] shadow-sm"
              }`}
            >
              <TierCardHeader
                tier={tierById[tierId]}
                showMidGetStarted
              />
              <BenefitsIncludesLabel />
              {COACHING_BENEFITS.map((benefit) => (
                <div
                  key={benefit.id}
                  onMouseEnter={() => setHoveredBenefitId(benefit.id)}
                  onMouseLeave={() => setHoveredBenefitId(null)}
                >
                  <BenefitCell
                    benefit={benefit}
                    tierId={tierId}
                    isHovered={hoveredBenefitId === benefit.id}
                    onBenefitClick={openBenefit}
                  />
                </div>
              ))}
              <TierCardFooter />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
