import { ArrowUpRight } from "lucide-react";
import { PortraitPlaceholder } from "@/app/components/PortraitPlaceholder";
import { SiteFooter } from "@/app/components/SiteFooter";
import { SiteNav } from "@/app/components/SiteNav";
import { TierCard } from "@/app/components/TierCard";
import {
  COACHING_DISCLAIMER,
  COACHING_INTRO_PARAGRAPHS,
  COACHING_TIERS,
} from "@/app/content/coaching";
import { CONSULTATION_URL, EMBER, SANS, SERIF, STONE } from "@/app/constants";

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

      <main className="max-w-5xl mx-auto px-6 md:px-10 pt-10 pb-20">
        <div className="flex flex-col items-center text-center mb-12">
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
            className="font-semibold mb-6 max-w-2xl"
            style={{
              fontFamily: SANS,
              color: "#6b5f5a",
              fontSize: "clamp(1.1rem, 2vw, 1.35rem)",
              fontWeight: 500,
            }}
          >
            Strength training built for your body, your health, and your life.
          </h2>

          <div className="max-w-2xl space-y-4 mb-8">
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

          <a
            href={CONSULTATION_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-7 py-3 rounded-full text-sm font-semibold transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
            style={{ background: EMBER, color: "#f5ede4", fontFamily: SANS }}
          >
            Schedule free consultation
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-5 items-stretch mb-16 pt-4">
          {COACHING_TIERS.map((tier) => (
            <TierCard key={tier.id} tier={tier} />
          ))}
        </div>

        <p
          className="text-sm leading-relaxed max-w-3xl mx-auto text-center italic"
          style={{ color: STONE }}
        >
          {COACHING_DISCLAIMER}
        </p>

        {/* Testimonials — add section here when copy is ready */}
      </main>

      <SiteFooter />
    </div>
  );
}
