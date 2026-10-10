import type { ReactNode } from "react";
import {
  InstagramIcon,
  SubstackIcon,
  TikTokIcon,
} from "@/app/components/posts/PlatformIcons";
import {
  BROWN,
  EMAIL_ADDRESS,
  INSTAGRAM_URL,
  SERIF,
  SUBSTACK_URL,
  TIKTOK_URL,
} from "@/app/constants";

type FollowLink = {
  emphasizeIcon?: boolean;
  external: boolean;
  href: string;
  icon: ReactNode;
  label: string;
  name: string;
};

function EmailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect
        x="3.25"
        y="5.25"
        width="17.5"
        height="13.5"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M4 7.5 12 13l8-5.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const links: FollowLink[] = [
  {
    name: "Substack",
    label: "everywomanhealth",
    href: SUBSTACK_URL,
    icon: <SubstackIcon />,
    external: true,
  },
  {
    name: "Instagram",
    label: "everywoman.io",
    href: INSTAGRAM_URL,
    icon: <InstagramIcon />,
    external: true,
    emphasizeIcon: true,
  },
  {
    name: "TikTok",
    label: "@everywomanhealth",
    href: TIKTOK_URL,
    icon: <TikTokIcon />,
    external: true,
    emphasizeIcon: true,
  },
  {
    name: "Email",
    label: EMAIL_ADDRESS,
    href: `mailto:${EMAIL_ADDRESS}`,
    icon: <EmailIcon />,
    external: false,
    emphasizeIcon: true,
  },
];

type FollowColumnProps = {
  compact?: boolean;
  headingColor?: string;
  layout?: "stack" | "grid";
};

export function FollowColumn({
  compact = false,
  headingColor = BROWN,
  layout = "stack",
}: FollowColumnProps = {}) {
  const isGrid = layout === "grid";

  return (
    <aside
      aria-labelledby="follow-me-heading"
      className={
        isGrid
          ? "w-full max-w-[13.5rem] shrink-0"
          : "w-full max-w-40 shrink-0 lg:w-40"
      }
    >
      <h2
        id="follow-me-heading"
        className="mb-4 font-bold"
        style={{
          color: headingColor,
          fontFamily: SERIF,
          fontSize: "clamp(1.15rem, 2vw, 1.5rem)",
        }}
      >
        Follow me
      </h2>
      <div
        className={
          isGrid ? "grid grid-cols-2 gap-2.5" : "grid grid-cols-1 gap-3"
        }
      >
        {links.map((link) => (
          <a
            key={link.name}
            href={link.href}
            className={
              compact ? "follow-squircle follow-squircle--compact" : "follow-squircle"
            }
            aria-label={`${link.name}, ${link.label}`}
            {...(link.external
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
          >
            <span
              className={
                compact && link.emphasizeIcon
                  ? "follow-squircle__icon follow-squircle__icon--emphasis"
                  : "follow-squircle__icon"
              }
            >
              {link.icon}
            </span>
          </a>
        ))}
      </div>
    </aside>
  );
}
