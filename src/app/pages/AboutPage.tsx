import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AboutCollage } from "@/app/components/about/AboutCollage";
import { AboutGuideLine } from "@/app/components/about/AboutGuideLine";
import { AboutHeroRing } from "@/app/components/about/AboutHeroRing";
import { AboutInlines } from "@/app/components/about/AboutInlines";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
import { AboutWomanModal } from "@/app/components/about/AboutWomanModal";
import { AboutWomanProfile } from "@/app/components/about/AboutWomanProfile";
import { SiteFooter } from "@/app/components/SiteFooter";
import { SiteNav } from "@/app/components/SiteNav";
import {
  ABOUT_BACKGROUND,
  ABOUT_ETHOS_INTRO,
  type AboutBlock,
} from "@/app/content/about";
import { ABOUT_PROFILES_WITH_PORTRAITS } from "@/app/content/aboutPortraits";
import { BROWN, CREAM, EMBER, SANS, SAGE, SERIF } from "@/app/constants";
import aboutPortrait from "@/imports/about.webp";
import startedBecausePortrait from "@/imports/istartedeverywomanbecause.webp";

function AboutBackgroundColumn({ blocks }: { blocks: AboutBlock[] }) {
  return blocks.map((block, index) => {
    if (block.kind === "image") {
      return (
        <div
          key={`image-${index}`}
          className="about-image-placeholder about-image-placeholder--squircle about-background__portrait"
          style={{ borderColor: SAGE }}
        >
          <ImageWithFallback
            src={startedBecausePortrait}
            alt="Madeleine Stockton"
            className="about-background__portrait-image"
          />
        </div>
      );
    }
    if (block.kind === "heading") {
      return (
        <h3
          key={block.text}
          className="about-background__subhead"
          style={{ color: CREAM, fontFamily: SERIF }}
        >
          {block.text}
        </h3>
      );
    }
    return (
      <p
        key={index}
        className="text-base md:text-[17px]"
        style={{ color: CREAM }}
      >
        <AboutInlines content={block.content} />
      </p>
    );
  });
}

export function AboutPage() {
  const [activeProfileIndex, setActiveProfileIndex] = useState<number | null>(
    null,
  );
  const [revealingIndex, setRevealingIndex] = useState<number | null>(null);

  useEffect(() => {
    if (revealingIndex === null) return;
    const timeout = window.setTimeout(() => setRevealingIndex(null), 280);
    return () => window.clearTimeout(timeout);
  }, [revealingIndex]);

  return (
    <div
      className="about-page"
      style={{ fontFamily: SANS, minHeight: "100vh", background: CREAM }}
    >
      <AboutGuideLine />

      <header
        className="about-page__header md:border-b"
        style={{ borderColor: "rgba(42,31,26,0.06)" }}
      >
        <SiteNav variant="light" />
      </header>

      <main className="about-page__main">
        <section className="about-section about-page__inner about-hero">
          <div className="about-hero__frame">
            <AboutHeroRing />
            <div className="about-image-placeholder about-image-placeholder--circle about-hero__portrait">
              <ImageWithFallback
                src={aboutPortrait}
                alt="Madeleine Stockton"
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
          </div>

          <div className="about-hero__copy">
            <p
              className="mb-1 text-lg font-semibold md:text-xl"
              style={{ color: BROWN }}
            >
              Hi there, I&apos;m
            </p>
            <h1 className="about-hero__name" style={{ color: EMBER }}>
              Madeleine
            </h1>
            <p
              className="max-w-xl text-xl leading-relaxed md:text-2xl"
              style={{ color: BROWN, fontFamily: SERIF }}
            >
              and I&apos;m so happy you&apos;re here. Scroll to learn a little
              bit more about me.
            </p>
          </div>
        </section>

        <section
          className="about-section about-background"
          aria-label="Madeleine's background"
        >
          <div className="about-background__panel" aria-hidden="true" />
          <div className="about-page__inner about-background__content">
            <div className="about-background__column about-background__column--left">
              <h2
                className="about-background__lead"
                style={{ color: CREAM, fontFamily: SERIF }}
              >
                {ABOUT_BACKGROUND.lead.before}
                <em>{ABOUT_BACKGROUND.lead.emphasis}</em>
                {ABOUT_BACKGROUND.lead.after}
              </h2>
              <AboutBackgroundColumn blocks={ABOUT_BACKGROUND.left} />
            </div>

            <div className="about-background__column about-background__column--right">
              <AboutBackgroundColumn blocks={ABOUT_BACKGROUND.right} />
              <p
                className="about-background__lead about-background__signoff"
                style={{ color: CREAM, fontFamily: SERIF }}
              >
                {ABOUT_BACKGROUND.signoff}
              </p>
            </div>
          </div>
        </section>

        <section className="about-section about-ethos">
          <div className="about-ethos__title-wrap">
            <h2
              className="about-ethos__title font-bold"
              style={{ fontFamily: SERIF, color: EMBER }}
            >
              Backed by women,
              <br />
              built for women.
            </h2>
          </div>

          <div className="about-page__inner about-ethos__body">
            <p
              className="about-ethos__intro text-base leading-relaxed md:text-[18px]"
              style={{ color: BROWN }}
            >
              {ABOUT_ETHOS_INTRO}
            </p>
          </div>

          <div className="about-ethos-cards">
            {ABOUT_PROFILES_WITH_PORTRAITS.map((profile, index) => (
              <AboutWomanProfile
                key={`${profile.role}-${index}`}
                profile={profile}
                index={index}
                presented={activeProfileIndex === index}
                revealing={revealingIndex === index}
                onOpen={() => setActiveProfileIndex(index)}
              />
            ))}
          </div>

          <AboutWomanModal
            profile={
              activeProfileIndex === null
                ? null
                : ABOUT_PROFILES_WITH_PORTRAITS[activeProfileIndex]
            }
            index={activeProfileIndex ?? 0}
            onClose={(reveal) => {
              if (reveal && activeProfileIndex !== null) {
                setRevealingIndex(activeProfileIndex);
              }
              setActiveProfileIndex(null);
            }}
          />
        </section>

        <section className="about-section about-collage-section">
          <div className="about-collage-section__panel" aria-hidden="true" />
          <div className="about-collage-section__inner">
            <h2
              className="about-collage__title font-bold leading-tight"
              style={{ color: CREAM, fontFamily: SERIF }}
            >
              So who is Madeleine, <em>really?</em>
            </h2>
            <AboutCollage />
          </div>
        </section>

        <section className="about-section about-page__inner about-cta">
          <div className="about-cta__card">
            <h2
              className="mb-5 font-bold leading-tight"
              style={{
                color: EMBER,
                fontFamily: SERIF,
                fontSize: "clamp(2.3rem, 5vw, 4.5rem)",
              }}
            >
              Ready to get started?
            </h2>
            <p
              className="mb-8 max-w-2xl text-base leading-relaxed md:text-lg"
              style={{ color: BROWN }}
            >
              I&apos;m excited you&apos;re here. Every woman deserves coaching
              and support tailored to her needs and lifestyle. I can&apos;t
              wait to meet you and learn about your journey.
            </p>
            <Link
              to="/services"
              className="pill-btn pill-btn--ember inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-semibold"
              style={{ fontFamily: SANS, textDecoration: "none" }}
            >
              Work with me
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <div className="about-page__footer">
        <SiteFooter />
      </div>
    </div>
  );
}
