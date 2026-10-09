import { X } from "lucide-react";
import { useEffect } from "react";
import {
  BENEFIT_MODAL_PLACEHOLDER,
  type CoachingBenefit,
  getBenefitIncludedTierLabels,
  getBenefitModalTitle,
} from "@/app/content/coaching";
import { EMBER, SANS, SERIF, STONE } from "@/app/constants";

type BenefitDetailModalProps = {
  benefit: CoachingBenefit | null;
  onClose: () => void;
};

const TITLE_ID = "benefit-detail-modal-title";

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
  const tierLabels = getBenefitIncludedTierLabels(benefit);

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
        className="relative w-[50vw] h-[50vh] max-w-[50vw] max-h-[50vh] overflow-y-auto rounded-[2rem] p-8 md:p-12"
        style={{
          background: "#f5ede4",
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
          <X className="w-6 h-6" style={{ color: "#2a1f1a" }} />
        </button>

        <h2
          id={TITLE_ID}
          className="font-bold pr-12 mb-6"
          style={{
            fontFamily: SERIF,
            color: "#2a1f1a",
            fontSize: "clamp(1.5rem, 3vw, 2.25rem)",
          }}
        >
          {title}
        </h2>

        {tierLabels.length > 0 && (
          <p
            className="text-sm font-medium mb-6"
            style={{ fontFamily: SANS, color: EMBER }}
          >
            Included in: {tierLabels.join(", ")}
          </p>
        )}

        <p
          className="text-base leading-relaxed"
          style={{ fontFamily: SANS, color: STONE }}
        >
          {BENEFIT_MODAL_PLACEHOLDER}
        </p>
      </div>
    </div>
  );
}
