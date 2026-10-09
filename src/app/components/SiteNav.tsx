import { ArrowUpRight } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
import { SANS, SERIF, SUBSTACK_URL } from "@/app/constants";
import logoImage from "@/imports/logo.png";

type SiteNavProps = {
  /** When true, logo and cream text sit on the sage hero */
  variant?: "hero" | "light";
};

const NAV_ITEMS: {
  label: string;
  to?: string;
  hash?: string;
  placeholder?: boolean;
}[] = [
  { label: "About", hash: "about" },
  { label: "Services", to: "/services" },
  { label: "Connect", hash: "connect" },
  { label: "Podcast", placeholder: true },
];

const navPillClass =
  "pill-btn pill-btn--ember inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium";

export function SiteNav({ variant = "hero" }: SiteNavProps) {
  const location = useLocation();
  const onHome = location.pathname === "/";
  const isHero = variant === "hero";

  const logoColor = isHero ? "#f5ede4" : "#2a1f1a";
  const logoBg = isHero ? "#f5ede4" : "#fff";
  const logoBorder = isHero
    ? "2px solid rgba(245,237,228,0.5)"
    : "2px solid rgba(42,31,26,0.08)";

  const hashLink = (hash: string) => (onHome ? `#${hash}` : `/#${hash}`);

  return (
    <nav className="relative z-30 flex-shrink-0">
      <div
        className="max-w-7xl mx-auto px-6 md:px-10 flex items-center justify-between"
        style={{ height: "76px" }}
      >
        <Link
          to="/"
          className="flex items-center gap-3 flex-shrink-0"
          style={{ cursor: "pointer", textDecoration: "none" }}
        >
          <div
            className="flex items-center justify-center rounded-full flex-shrink-0"
            style={{
              background: logoBg,
              border: logoBorder,
              width: "42px",
              height: "42px",
            }}
          >
            <ImageWithFallback
              src={logoImage}
              alt="EveryWoman logo"
              className="h-7 w-7 object-contain"
            />
          </div>
          <span
            className="font-bold text-[22px] tracking-tight"
            style={{ fontFamily: SERIF, color: logoColor }}
          >
            EveryWoman
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-2">
          {NAV_ITEMS.map((item) => {
            if (item.placeholder) {
              return (
                <span
                  key={item.label}
                  className={navPillClass}
                  style={{ fontFamily: SANS }}
                  aria-disabled="true"
                >
                  {item.label}
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              );
            }
            if (item.to) {
              return (
                <Link
                  key={item.label}
                  to={item.to}
                  className={navPillClass}
                  style={{ fontFamily: SANS, textDecoration: "none" }}
                >
                  {item.label}
                </Link>
              );
            }
            if (item.hash) {
              return (
                <Link
                  key={item.label}
                  to={hashLink(item.hash)}
                  className={navPillClass}
                  style={{ fontFamily: SANS, textDecoration: "none" }}
                >
                  {item.label}
                </Link>
              );
            }
            return null;
          })}
        </div>

        <a
          href={SUBSTACK_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={`pill-btn flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-semibold flex-shrink-0 ${
            isHero ? "pill-btn--subscribe-hero" : "pill-btn--subscribe-light"
          }`}
          style={{ fontFamily: SANS }}
        >
          Subscribe
          <ArrowUpRight className="w-3.5 h-3.5" />
        </a>
      </div>
    </nav>
  );
}
