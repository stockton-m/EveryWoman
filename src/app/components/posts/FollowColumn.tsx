import type { ReactNode } from "react";
import {
  InstagramIcon,
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
  href: string;
  icon: ReactNode;
  label: string;
  name: string;
  external: boolean;
};

function SubstackIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M22.539 8.242H1.46V5.406h21.08v2.836zM1.46 10.812V24L12 18.11 22.54 24V10.812H1.46zM22.54 0H1.46v2.836h21.08V0z"
      />
    </svg>
  );
}

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
  },
  {
    name: "TikTok",
    label: "@everywomanhealth",
    href: TIKTOK_URL,
    icon: <TikTokIcon />,
    external: true,
  },
  {
    name: "Email",
    label: EMAIL_ADDRESS,
    href: `mailto:${EMAIL_ADDRESS}`,
    icon: <EmailIcon />,
    external: false,
  },
];

export function FollowColumn() {
  return (
    <aside
      aria-labelledby="follow-me-heading"
      className="w-full max-w-40 shrink-0 lg:w-40"
    >
      <h2
        id="follow-me-heading"
        className="mb-4 font-bold"
        style={{
          color: BROWN,
          fontFamily: SERIF,
          fontSize: "clamp(1.15rem, 2vw, 1.5rem)",
        }}
      >
        Follow me
      </h2>
      <div className="grid grid-cols-1 gap-3">
        {links.map((link) => (
          <a
            key={link.name}
            href={link.href}
            className="follow-squircle"
            aria-label={`${link.name}, ${link.label}`}
            {...(link.external
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
          >
            <span className="follow-squircle__icon">{link.icon}</span>
          </a>
        ))}
      </div>
    </aside>
  );
}
