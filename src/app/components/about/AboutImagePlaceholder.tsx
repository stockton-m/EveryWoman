import type { CSSProperties } from "react";
import { CREAM, SERIF } from "@/app/constants";

type AboutImagePlaceholderProps = {
  accent: string;
  shape?: "circle" | "squircle";
  className?: string;
  style?: CSSProperties;
  label?: string;
};

export function AboutImagePlaceholder({
  accent,
  shape = "squircle",
  className = "",
  style,
  label = "Photo placeholder",
}: AboutImagePlaceholderProps) {
  return (
    <div
      className={`about-image-placeholder about-image-placeholder--${shape} ${className}`}
      style={{ borderColor: accent, ...style }}
      role="img"
      aria-label={label}
    >
      <span style={{ fontFamily: SERIF, color: CREAM }}>?</span>
    </div>
  );
}
