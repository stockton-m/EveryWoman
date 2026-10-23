import { ArrowUpRight } from "lucide-react";
import { BROWN, CREAM, SANS } from "@/app/constants";

type ExternalLinkProps = {
  href: string;
  children: React.ReactNode;
  /** Page background behind the link. `inherit` uses the surrounding text color. */
  variant?: "light" | "dark" | "inherit";
  className?: string;
  showIcon?: boolean;
  /** Let the label wrap mid-sentence instead of staying on one line. */
  wrap?: boolean;
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
  wrap = false,
  instantColor = false,
  onClick,
}: ExternalLinkProps) {
  const colors = variant === "dark" ? DARK : variant === "light" ? LIGHT : null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${
        wrap ? "inline" : "inline-flex items-center gap-0.5"
      } font-medium border-b border-dotted border-current hover:border-solid ${
        instantColor ? "transition-none" : "transition-[color,border-style] duration-200"
      } ${className}`}
      style={{
        fontFamily: SANS,
        color: colors?.base ?? "inherit",
        textDecoration: "none",
      }}
      onMouseEnter={(e) => {
        if (colors) e.currentTarget.style.color = colors.hover;
      }}
      onMouseLeave={(e) => {
        if (colors) e.currentTarget.style.color = colors.base;
      }}
      onClick={onClick}
    >
      {children}
      {showIcon && (
        <ArrowUpRight
          className={
            wrap
              ? "ml-0.5 inline-block h-3.5 w-3.5 align-[-0.125em]"
              : "h-3.5 w-3.5 flex-shrink-0"
          }
          aria-hidden
        />
      )}
    </a>
  );
}
