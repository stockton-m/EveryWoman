import { ArrowUpRight } from "lucide-react";
import { CONSULTATION_URL, SANS } from "@/app/constants";

type TierGetStartedButtonProps = {
  className?: string;
};

export function TierGetStartedButton({ className = "" }: TierGetStartedButtonProps) {
  return (
    <a
      href={CONSULTATION_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`pill-btn pill-btn--ember inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-semibold w-full ${className}`}
      style={{ fontFamily: SANS }}
    >
      Get started
      <ArrowUpRight className="w-3.5 h-3.5" />
    </a>
  );
}
