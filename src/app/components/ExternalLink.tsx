import { ArrowUpRight } from "lucide-react";
import { BROWN, CREAM, SANS } from "@/app/constants";

type ExternalLinkProps = {
  href: string;
  children: React.ReactNode;
  /** Page background behind the link */
  variant?: "light" | "dark";
  className?: string;
  showIcon?: boolean;
  /** Skip color/border CSS transitions (e.g. benefit row hover). */
  instantColor?: boolean;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
};

const LIGHT = { base: BROWN, hover: "#1e1510" } as const;
const DARK = { base: CREAM, hover: "#ffffff" } as const;

export function ExternalLink({
  href,
  children,
  variant = "light",
  className = "",
  showIcon = true,
  instantColor = false,
  onClick,
}: ExternalLinkProps) {
  const colors = variant === "dark" ? DARK : LIGHT;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-0.5 font-medium border-b border-dotted border-current hover:border-solid ${
        instantColor ? "transition-none" : "transition-[color,border-style] duration-200"
      } ${className}`}
      style={{
        fontFamily: SANS,
        color: colors.base,
        textDecoration: "none",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = colors.hover;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = colors.base;
      }}
      onClick={onClick}
    >
      {children}
      {showIcon && (
        <ArrowUpRight className="w-3.5 h-3.5 flex-shrink-0" aria-hidden />
      )}
    </a>
  );
}
