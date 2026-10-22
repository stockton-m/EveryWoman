import { ArrowRight, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { ContactGuideLine } from "@/app/components/contact/ContactGuideLine";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
import {
  InstagramIcon,
  SubstackIcon,
  TikTokIcon,
} from "@/app/components/posts/PlatformIcons";
import { SiteFooter } from "@/app/components/SiteFooter";
import { SiteNav } from "@/app/components/SiteNav";
import {
  BROWN,
  CREAM,
  CONTACT_INTRO,
  EMAIL_ADDRESS,
  EMBER,
  INSTAGRAM_URL,
  SANS,
  SERIF,
  SUBSTACK_URL,
  TIKTOK_URL,
} from "@/app/constants";
import contactPortrait from "@/imports/contact.webp";

const SOCIAL_LINKS = [
  { name: "Substack", href: SUBSTACK_URL, Icon: SubstackIcon },
  { name: "Instagram", href: INSTAGRAM_URL, Icon: InstagramIcon },
  { name: "TikTok", href: TIKTOK_URL, Icon: TikTokIcon },
];

export function ContactPage() {
  return (
    <div
      className="contact-page"
      style={{ fontFamily: SANS, minHeight: "100vh", background: CREAM }}
    >
      <ContactGuideLine />

      <header
        className="contact-page__header md:border-b"
        style={{ borderColor: "rgba(42,31,26,0.06)" }}
      >
        <SiteNav variant="light" />
      </header>

      <main className="contact-page__main">
        <section className="contact-hero">
          <div
            className="about-image-placeholder about-image-placeholder--circle contact-hero__portrait relative"
            style={{ borderColor: EMBER }}
          >
            <ImageWithFallback
              src={contactPortrait}
              alt="Madeleine Stockton"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>

          <h1
            className="contact-hero__title"
            style={{ color: EMBER, fontFamily: SERIF }}
          >
            Contact me
          </h1>

          <p className="contact-hero__intro" style={{ color: BROWN }}>
            {CONTACT_INTRO}
          </p>

          <div className="contact-hero__actions">
            <Link
              to="/services"
              className="pill-btn pill-btn--ember inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-semibold"
              style={{ fontFamily: SANS, textDecoration: "none" }}
            >
              Work with me
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href={`mailto:${EMAIL_ADDRESS}`}
              className="pill-btn pill-btn--ember inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-semibold"
              style={{ fontFamily: SANS, textDecoration: "none" }}
            >
              <Mail className="h-4 w-4" />
              Email me
            </a>
          </div>

          <div className="contact-hero__socials">
            {SOCIAL_LINKS.map(({ name, href, Icon }) => (
              <a
                key={name}
                href={href}
                className="contact-social"
                aria-label={name}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icon />
              </a>
            ))}
          </div>
        </section>
      </main>

      <div className="contact-page__footer">
        <SiteFooter />
      </div>
    </div>
  );
}
