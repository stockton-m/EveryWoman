import { ExternalLink } from "@/app/components/ExternalLink";
import { COACHRX_APP_URL, type TierBenefitCopy } from "@/app/content/coaching";
import { CREAM, SANS, STONE } from "@/app/constants";

type BenefitCopyProps = {
  copy: TierBenefitCopy;
  included: boolean;
  onEmberPill?: boolean;
  structuredDescriptionVisible?: boolean;
  structuredDescriptionReserve?: string | null;
};

export function BenefitCopy({
  copy,
  included,
  onEmberPill = false,
  structuredDescriptionVisible = true,
  structuredDescriptionReserve = null,
}: BenefitCopyProps) {
  const titleColor = onEmberPill ? CREAM : included ? "#2a1f1a" : STONE;
  const descColor = onEmberPill ? "rgba(245,237,228,0.85)" : STONE;

  if (copy.kind === "plain") {
    const parts =
      "parts" in copy && copy.parts
        ? copy.parts
        : [{ text: copy.text }];
    return (
      <span
        className={`font-normal ${included ? "" : "opacity-60"}`}
        style={{ color: titleColor, fontFamily: SANS }}
      >
        {parts.map((part, i) => (
          <span
            key={i}
            className={`${part.bold ? "font-semibold" : ""} ${part.italic ? "italic" : ""}`}
          >
            {part.text}
          </span>
        ))}
      </span>
    );
  }

  if (copy.kind === "coachrx") {
    return (
      <span
        className={`font-normal ${included ? "" : "opacity-60"}`}
        style={{ color: titleColor, fontFamily: SANS }}
      >
        {copy.before}
        {included ? (
          <ExternalLink
            href={COACHRX_APP_URL}
            variant={onEmberPill ? "dark" : "light"}
            className={`align-baseline ${onEmberPill ? "!transition-none" : ""}`}
            instantColor
            onClick={(e) => e.stopPropagation()}
          >
            CoachRx
          </ExternalLink>
        ) : (
          <span>CoachRx</span>
        )}
        {copy.after}
      </span>
    );
  }

  const showDesc = included && structuredDescriptionVisible;

  return (
    <span className="block w-full">
      <span
        className={`block leading-snug ${included ? "font-semibold" : "font-normal opacity-60"}`}
        style={{ fontFamily: SANS, color: titleColor }}
      >
        {copy.title}
      </span>
      <span
        className="block text-xs leading-relaxed mt-0.5 font-normal"
        style={{ fontFamily: SANS, color: descColor }}
        aria-hidden={!showDesc}
      >
        {showDesc ? (
          copy.description
        ) : (
          <span className="invisible select-none" aria-hidden>
            {structuredDescriptionReserve ?? copy.description}
          </span>
        )}
      </span>
    </span>
  );
}
