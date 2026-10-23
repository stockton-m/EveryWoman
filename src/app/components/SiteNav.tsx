import { ArrowUpRight } from "lucide-react";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
import { TierIconNameTooltip } from "@/app/components/TierIconNameTooltip";
import { CREAM, EMBER, SANS, SERIF, SUBSTACK_URL } from "@/app/constants";
import logoImage from "@/imports/logo.png";

type SiteNavProps = {
  /** When true, logo and cream text sit on the sage hero */
  variant?: "hero" | "light";
};

type MenuPhase = "closed" | "open" | "closing";

type MenuAnchor = {
  top: number;
  left: number;
  width: number;
  height: number;
  menuTop: number;
};

const NAV_ITEMS: {
  label: string;
  to?: string;
  placeholder?: boolean;
}[] = [
  { label: "About", to: "/about" },
  { label: "Services", to: "/services" },
  { label: "Posts", to: "/posts" },
  { label: "Contact", to: "/contact" },
  { label: "Podcast", placeholder: true },
];

const MOBILE_NAV_ITEMS = [{ label: "Home", to: "/" }, ...NAV_ITEMS];

const HEX_DOTS: [number, number][] = [
  [24, 10.5],
  [12.31, 17.25],
  [12.31, 30.75],
  [24, 37.5],
  [35.69, 30.75],
  [35.69, 17.25],
];

const MENU_ID = "site-nav-menu";
const MENU_MOTION_MS = 720;

const navPillClass =
  "pill-btn pill-btn--ember inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium";

function menuMotionMs(): number {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return 40;
  return MENU_MOTION_MS;
}

function HexMark({ color, spun }: { color: string; spun: boolean }) {
  return (
    <svg
      className={`site-nav__hex${spun ? " is-spun" : ""}`}
      viewBox="0 0 48 48"
      width="36"
      height="36"
      aria-hidden="true"
    >
      {HEX_DOTS.map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="5.25" fill={color} />
      ))}
    </svg>
  );
}

function NavPill({
  item,
  onNavigate,
  menu = false,
}: {
  item: (typeof NAV_ITEMS)[number];
  onNavigate?: () => void;
  menu?: boolean;
}) {
  if (item.placeholder) {
    const pill = (
      <span
        className={`${navPillClass} site-nav__soon`}
        style={{ fontFamily: SANS }}
        aria-disabled="true"
      >
        {menu ? (
          <span className="site-nav__soon-copy">
            <span className="site-nav__soon-title">{item.label}</span>
            <span className="site-nav__soon-note">Coming soon!</span>
          </span>
        ) : (
          item.label
        )}
        <ArrowUpRight className="w-3.5 h-3.5" />
      </span>
    );

    if (menu) return pill;

    return (
      <TierIconNameTooltip content="Coming soon!" placement="below" shape="pill">
        {pill}
      </TierIconNameTooltip>
    );
  }

  if (!item.to) return null;

  return (
    <Link
      to={item.to}
      className={navPillClass}
      style={{ fontFamily: SANS, textDecoration: "none" }}
      onClick={(event) => {
        if (onNavigate) {
          const here = window.location.pathname.replace(/\/$/, "") || "/";
          const dest = item.to.replace(/\/$/, "") || "/";
          if (dest === here) {
            event.preventDefault();
            window.scrollTo({ top: 0 });
          }
          onNavigate();
        }
      }}
    >
      {item.label}
    </Link>
  );
}

export function SiteNav({ variant = "hero" }: SiteNavProps) {
  const isHero = variant === "hero";
  const navRef = useRef<HTMLElement>(null);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const floatingRef = useRef<HTMLButtonElement>(null);
  const openedAt = useRef(0);
  const wasOpen = useRef(false);
  const [phase, setPhase] = useState<MenuPhase>("closed");
  const [revealed, setRevealed] = useState(false);
  const [anchor, setAnchor] = useState<MenuAnchor | null>(null);

  const logoColor = isHero ? "#f5ede4" : "#2a1f1a";
  const logoBg = isHero ? "#f5ede4" : "#fff";
  const logoBorder = isHero
    ? "2px solid rgba(245,237,228,0.5)"
    : "2px solid rgba(42,31,26,0.08)";
  const menuOpen = phase !== "closed";

  const openMenu = () => {
    openedAt.current = Date.now();
    setPhase("open");
  };

  const closeMenu = () => {
    if (phase !== "open") return;
    setRevealed(false);
    setPhase("closing");
  };

  const closeFromPointer = () => {
    if (Date.now() - openedAt.current < 400) return;
    closeMenu();
  };

  useEffect(() => {
    if (phase !== "open") return;
    const frame = requestAnimationFrame(() => setRevealed(true));
    return () => cancelAnimationFrame(frame);
  }, [phase]);

  useEffect(() => {
    if (phase !== "closing") return;
    const timeout = window.setTimeout(() => setPhase("closed"), menuMotionMs());
    return () => window.clearTimeout(timeout);
  }, [phase]);

  useEffect(() => {
    if (phase !== "open") return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setRevealed(false);
      setPhase("closing");
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [phase]);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const onChange = () => {
      if (media.matches) {
        setRevealed(false);
        setPhase("closed");
      }
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (phase !== "closed") {
      wasOpen.current = true;
      return;
    }
    if (!wasOpen.current) return;
    anchorRef.current?.focus({ preventScroll: true });
  }, [phase]);

  useEffect(() => {
    if (!revealed) return;
    floatingRef.current?.focus({ preventScroll: true });
  }, [revealed]);

  useLayoutEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const measure = () => {
      const button = anchorRef.current?.getBoundingClientRect();
      const nav = navRef.current?.getBoundingClientRect();
      if (!button || !nav) return;
      setAnchor({
        top: button.top,
        left: button.left,
        width: button.width,
        height: button.height,
        menuTop: nav.bottom + 12,
      });
    };

    measure();
    window.addEventListener("resize", measure);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("resize", measure);
    };
  }, [menuOpen]);

  const menuClass = `site-nav__menu${
    phase === "open" && revealed ? " is-shown" : ""
  }${phase === "closing" ? " is-closing" : ""}`;

  return (
    <nav ref={navRef} className="relative z-30 flex-shrink-0">
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
            className="hidden font-bold text-[22px] tracking-tight md:inline"
            style={{ fontFamily: SERIF, color: logoColor }}
          >
            EveryWoman
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-2">
          {NAV_ITEMS.map((item) => (
            <NavPill key={item.label} item={item} />
          ))}
        </div>

        <a
          href={SUBSTACK_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={`pill-btn hidden items-center gap-1.5 px-5 py-2 rounded-full text-sm font-semibold md:flex flex-shrink-0 ${
            isHero ? "pill-btn--subscribe-hero" : "pill-btn--subscribe-light"
          }`}
          style={{ fontFamily: SANS }}
        >
          Subscribe
          <ArrowUpRight className="w-3.5 h-3.5" />
        </a>

        <button
          ref={anchorRef}
          type="button"
          className="site-nav__toggle flex items-center justify-center md:hidden"
          style={{ visibility: menuOpen ? "hidden" : "visible" }}
          aria-expanded={menuOpen}
          aria-controls={MENU_ID}
          aria-label="Open menu"
          aria-hidden={menuOpen}
          tabIndex={menuOpen ? -1 : 0}
          onClick={openMenu}
        >
          <HexMark color={isHero ? CREAM : EMBER} spun={false} />
        </button>
      </div>

      {menuOpen
        ? createPortal(
            <>
              <button
                type="button"
                className="site-nav__backdrop"
                aria-label="Close menu"
                tabIndex={-1}
                onClick={closeFromPointer}
              />
              <div
                id={MENU_ID}
                className={menuClass}
                style={{ top: anchor?.menuTop ?? 88 }}
              >
                {MOBILE_NAV_ITEMS.map((item, index) => (
                  <div
                    key={item.label}
                    className="site-nav__menu-item"
                    style={{ "--i": index } as CSSProperties}
                  >
                    <NavPill item={item} menu onNavigate={closeMenu} />
                  </div>
                ))}
              </div>
              {anchor ? (
                <button
                  ref={floatingRef}
                  type="button"
                  className="site-nav__toggle site-nav__toggle--floating flex items-center justify-center"
                  style={{
                    top: anchor.top,
                    left: anchor.left,
                    width: anchor.width,
                    height: anchor.height,
                  }}
                  aria-expanded="true"
                  aria-controls={MENU_ID}
                  aria-label="Close menu"
                  onClick={closeFromPointer}
                >
                  <HexMark color={isHero ? CREAM : EMBER} spun={revealed && phase === "open"} />
                </button>
              ) : null}
            </>,
            document.body,
          )
        : null}
    </nav>
  );
}
