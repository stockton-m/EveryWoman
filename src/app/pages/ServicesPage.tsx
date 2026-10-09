import { ArrowUpRight } from "lucide-react";
import { CoachingQuiz } from "@/app/components/CoachingQuiz";
import { ExternalLink } from "@/app/components/ExternalLink";
import { PortraitPlaceholder } from "@/app/components/PortraitPlaceholder";
import { SiteFooter } from "@/app/components/SiteFooter";
import { SiteNav } from "@/app/components/SiteNav";
import { TierComparisonGrid } from "@/app/components/TierComparisonGrid";
import {
  COACHING_DISCLAIMER_PREFIX,
  COACHING_DISCLAIMER_SUFFIX,
  COACHING_INTRO_PARAGRAPHS,
  COACHING_TIERS,
  NASM_URL,
} from "@/app/content/coaching";
import { CONSULTATION_URL, SANS, SERIF, STONE } from "@/app/constants";

export function ServicesPage() {
  return (
    <div style={{ fontFamily: SANS, minHeight: "100vh", background: "#f5ede4" }}>
      <header
        className="border-b"
        style={{
          background: "#f5ede4",
          borderColor: "rgba(42,31,26,0.06)",
        }}
      >
        <SiteNav variant="light" />
      </header>

      <main className="max-w-7xl mx-auto px-6 md:px-10 pt-10 pb-20">
        <div className="flex flex-col items-center text-center mb-6">
          <PortraitPlaceholder size="clamp(7rem, 14vw, 10rem)" className="mb-8" />

          <h1
            className="font-bold mb-4"
            style={{
              fontFamily: SERIF,
              color: "#2a1f1a",
              fontSize: "clamp(2rem, 4vw, 3rem)",
            }}
          >
            Coaching Services
          </h1>

          <h2
            className="font-semibold max-w-2xl mb-0"
            style={{
              fontFamily: SANS,
              color: "#6b5f5a",
              fontSize: "clamp(1.1rem, 2vw, 1.35rem)",
              fontWeight: 500,
            }}
          >
            Strength training built for your body, your health, and your life.
          </h2>
        </div>

        <div className="max-w-2xl w-full mx-auto">
          <div className="flex justify-center mb-12 md:mb-16">
            <a
              href={CONSULTATION_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="pill-btn pill-btn--ember inline-flex items-center gap-2 px-7 py-3 rounded-full text-sm font-semibold"
              style={{ fontFamily: SANS }}
            >
              Schedule free consultation
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="space-y-4 text-left">
            {COACHING_INTRO_PARAGRAPHS.map((paragraph, i) => (
              <p
                key={i}
                className="text-base md:text-[17px] leading-relaxed"
                style={{ color: "#6b5f5a" }}
              >
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        <div className="my-14 md:my-16">
          <CoachingQuiz />
        </div>

        <TierComparisonGrid tiers={COACHING_TIERS} />

        <p
          className="text-sm leading-relaxed max-w-3xl mx-auto text-center italic"
          style={{ color: STONE, fontFamily: SANS }}
        >
          {COACHING_DISCLAIMER_PREFIX}
          <ExternalLink href={NASM_URL} variant="light" className="italic">
            NASM
          </ExternalLink>
          {COACHING_DISCLAIMER_SUFFIX}
        </p>

        {/* Testimonials — add section here when copy is ready */}
      </main>

      <SiteFooter />
    </div>
  );
}
