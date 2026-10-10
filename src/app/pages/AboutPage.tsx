import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { AboutCollage } from "@/app/components/about/AboutCollage";
import { AboutGuideLine } from "@/app/components/about/AboutGuideLine";
import { AboutImagePlaceholder } from "@/app/components/about/AboutImagePlaceholder";
import { AboutWomanModal } from "@/app/components/about/AboutWomanModal";
import { AboutWomanProfile } from "@/app/components/about/AboutWomanProfile";
import { SiteFooter } from "@/app/components/SiteFooter";
import { SiteNav } from "@/app/components/SiteNav";
import {
  ABOUT_BACKGROUND,
  ABOUT_ETHOS_INTRO,
  ABOUT_PROFILES,
} from "@/app/content/about";
import { BROWN, CREAM, EMBER, SANS, SAGE, SERIF } from "@/app/constants";

export function AboutPage() {
  const [activeProfileIndex, setActiveProfileIndex] = useState<number | null>(
    null,
  );

  return (
    <div
      className="about-page"
      style={{ fontFamily: SANS, minHeight: "100vh", background: CREAM }}
    >
      <AboutGuideLine />

      <header
        className="about-page__header border-b"
        style={{ borderColor: "rgba(42,31,26,0.06)" }}
      >
        <SiteNav variant="light" />
      </header>

      <main className="about-page__main">
        <section className="about-section about-page__inner about-hero">
          <AboutImagePlaceholder
            accent={EMBER}
            shape="circle"
            className="about-hero__portrait"
            label="Placeholder portrait of Madeleine"
          />

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
              {ABOUT_BACKGROUND.left.map((paragraph) => (
                <p
                  key={paragraph}
                  className="text-base md:text-[17px]"
                  style={{ color: CREAM }}
                >
                  {paragraph}
                </p>
              ))}
            </div>

            <div className="about-background__column about-background__column--right">
              <p
                className="text-base md:text-[17px]"
                style={{ color: CREAM }}
              >
                {ABOUT_BACKGROUND.right[0]}
              </p>
              <AboutImagePlaceholder
                accent={SAGE}
                className="about-background__portrait"
                label="Second placeholder portrait of Madeleine"
              />
              {ABOUT_BACKGROUND.right.slice(1).map((paragraph) => (
                <p
                  key={paragraph}
                  className="text-base md:text-[17px]"
                  style={{ color: CREAM }}
                >
                  {paragraph}
                </p>
              ))}
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
            {ABOUT_PROFILES.map((profile, index) => (
              <AboutWomanProfile
                key={`${profile.role}-${index}`}
                profile={profile}
                index={index}
                onOpen={() => setActiveProfileIndex(index)}
              />
            ))}
          </div>

          <AboutWomanModal
            profile={
              activeProfileIndex === null
                ? null
                : ABOUT_PROFILES[activeProfileIndex]
            }
            index={activeProfileIndex ?? 0}
            onClose={() => setActiveProfileIndex(null)}
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
