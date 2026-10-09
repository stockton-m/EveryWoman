import { ArrowUpRight } from "lucide-react";
import { CONSULTATION_URL, EMBER, SANS } from "@/app/constants";

type TierGetStartedButtonProps = {
  className?: string;
};

export function TierGetStartedButton({ className = "" }: TierGetStartedButtonProps) {
  return (
    <a
      href={CONSULTATION_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-semibold transition-all duration-200 hover:-translate-y-1 hover:shadow-lg w-full ${className}`}
      style={{ background: EMBER, color: "#f5ede4", fontFamily: SANS }}
    >
      Get started
      <ArrowUpRight className="w-3.5 h-3.5" />
    </a>
  );
}
