import { X } from "lucide-react";
import { useEffect } from "react";
import { TierPatternIcon } from "@/app/components/TierPatternIcon";
import {
  BENEFIT_MODAL_PLACEHOLDER,
  COACHING_TIERS,
  type CoachingBenefit,
  getBenefitModalTitle,
  getBenefitTierStatusLabel,
  isBenefitIncluded,
} from "@/app/content/coaching";
import { BROWN, CREAM, EMBER, SANS, SERIF, STONE } from "@/app/constants";

type BenefitDetailModalProps = {
  benefit: CoachingBenefit | null;
  onClose: () => void;
};

const TITLE_ID = "benefit-detail-modal-title";

const INCLUDED_DISC_BORDER = "1px solid rgba(42,31,26,0.12)";
const EXCLUDED_DISC = `color-mix(in srgb, ${STONE} 28%, ${CREAM})`;

export function BenefitDetailModal({
  benefit,
  onClose,
}: BenefitDetailModalProps) {
  useEffect(() => {
    if (!benefit) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [benefit, onClose]);

  if (!benefit) return null;

  const title = getBenefitModalTitle(benefit);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
      style={{ background: "rgba(42,31,26,0.55)" }}
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={TITLE_ID}
        className="relative flex h-[50vh] max-h-[50vh] w-[50vw] max-w-[50vw] flex-col overflow-hidden rounded-[2rem] p-8 md:p-12"
        style={{
          background: CREAM,
          boxShadow: "0 32px 80px rgba(42,31,26,0.25)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full transition-colors hover:bg-black/5 cursor-pointer"
          aria-label="Close"
        >
          <X className="w-6 h-6" style={{ color: BROWN }} />
        </button>

        <div className="min-h-0 flex-1 overflow-y-auto pr-12">
          <h2
            id={TITLE_ID}
            className="font-bold mb-6"
            style={{
              fontFamily: SERIF,
              color: BROWN,
              fontSize: "clamp(1.5rem, 3vw, 2.25rem)",
            }}
          >
            {title}
          </h2>

          <p
            className="text-base leading-relaxed"
            style={{ fontFamily: SANS, color: STONE }}
          >
            {BENEFIT_MODAL_PLACEHOLDER}
          </p>
        </div>

        <ul className="mt-auto flex shrink-0 flex-col gap-1.5 pt-6">
          {COACHING_TIERS.map((tier) => {
            const included = isBenefitIncluded(benefit, tier.id);
            const label = getBenefitTierStatusLabel(benefit, tier.id);

            return (
              <li key={tier.id} className="flex items-center gap-2">
                <span className="sr-only">{tier.name}</span>
                <span
                  aria-hidden
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                  style={{
                    background: included ? CREAM : EXCLUDED_DISC,
                    color: included ? EMBER : STONE,
                    border: included
                      ? INCLUDED_DISC_BORDER
                      : "1px solid transparent",
                  }}
                >
                  <TierPatternIcon tierId={tier.id} className="h-4 w-4" />
                </span>
                <span
                  className="text-xs font-normal"
                  style={{
                    fontFamily: SANS,
                    color: included ? BROWN : STONE,
                  }}
                >
                  {label}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
