import { Check, X } from "lucide-react";
import { BenefitCopy } from "@/app/components/BenefitCopy";
import {
  type CoachingBenefit,
  type CoachingTierId,
  getBenefitCopy,
  getInactiveDisplayTitle,
  getStructuredDescription,
  isBenefitIncluded,
} from "@/app/content/coaching";
import { CREAM, EMBER, SANS, STONE } from "@/app/constants";

type BenefitCellProps = {
  benefit: CoachingBenefit;
  tierId: CoachingTierId;
  isHovered: boolean;
  onBenefitClick?: (benefit: CoachingBenefit) => void;
};

export function BenefitCell({
  benefit,
  tierId,
  isHovered,
  onBenefitClick,
}: BenefitCellProps) {
  const included = isBenefitIncluded(benefit, tierId);
  const copy = getBenefitCopy(benefit, tierId);
  const structuredDesc = getStructuredDescription(benefit);
  const onEmberPill = isHovered && included;
  const onGreyPill = isHovered && !included;
  const isPlainRow = benefit.display === "plain";

  const pillBg = onEmberPill
    ? EMBER
    : onGreyPill
      ? "rgba(140,132,128,0.22)"
      : "transparent";

  return (
    <div className="px-4 lg:px-6 py-0.5">
      <div
        role="button"
        tabIndex={0}
        className={`flex gap-2.5 text-sm rounded-xl px-2 py-2 cursor-pointer ${
          isPlainRow ? "items-center" : "items-start"
        }`}
        style={{ background: pillBg }}
        onClick={() => onBenefitClick?.(benefit)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onBenefitClick?.(benefit);
          }
        }}
      >
        {included ? (
          <Check
            className={`w-4 h-4 flex-shrink-0 ${isPlainRow ? "" : "mt-0.5"}`}
            style={{ color: onEmberPill ? CREAM : EMBER }}
            aria-hidden
          />
        ) : (
          <X
            className={`w-4 h-4 flex-shrink-0 opacity-50 ${isPlainRow ? "" : "mt-0.5"}`}
            style={{ color: onGreyPill ? "#2a1f1a" : undefined }}
            aria-hidden
          />
        )}
        <div className="flex-1 min-w-0">
          {included && copy ? (
            <BenefitCopy
              copy={copy}
              included
              onEmberPill={onEmberPill}
              structuredDescriptionVisible
              structuredDescriptionReserve={structuredDesc}
            />
          ) : benefit.display === "structured" ? (
            <BenefitCopy
              copy={{
                kind: "structured",
                title: getInactiveDisplayTitle(benefit),
                description: structuredDesc ?? "",
              }}
              included={false}
              onEmberPill={false}
              structuredDescriptionVisible={false}
              structuredDescriptionReserve={structuredDesc}
            />
          ) : (
            <span
              className="opacity-60 font-normal"
              style={{ color: STONE, fontFamily: SANS }}
            >
              {getInactiveDisplayTitle(benefit)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
