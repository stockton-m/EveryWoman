import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { ExternalLink } from "@/app/components/ExternalLink";
import { SiteFooter } from "@/app/components/SiteFooter";
import { SiteNav } from "@/app/components/SiteNav";
import { ARTICLES } from "@/app/content/articles";
import { NASM_URL } from "@/app/content/coaching";
import {
  BLUSH,
  BROWN,
  CREAM,
  EMBER,
  MONO,
  SAGE,
  SANS,
  SERIF,
} from "@/app/constants";
import { useScrollToHash } from "@/app/hooks/useScrollToHash";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
import madeleinePortrait from "@/imports/profile.png";

export function HomePage() {
  useScrollToHash();

  return (
    <div style={{ fontFamily: SANS, minHeight: "100vh" }}>
      <section
        id="hero"
        className="relative overflow-hidden flex flex-col"
        style={{
          background:
            "radial-gradient(ellipse at 50% 46%, #93b896 0%, #7a9e7e 38%, #567a5a 100%)",
        }}
      >
        <div
          className="absolute bottom-0 left-0 right-0 pointer-events-none"
          style={{
            height: "160px",
            background:
              "linear-gradient(to bottom, transparent 0%, rgba(30,21,16,0.14) 100%)",
            zIndex: 5,
          }}
        />

        <SiteNav variant="hero" />

        <div className="relative z-20 max-w-7xl mx-auto px-6 md:px-10 w-full pt-10 md:pt-14 flex-shrink-0">
          <h1
            className="font-bold text-center leading-[0.9]"
            style={{
              fontFamily: SERIF,
              color: "#f5ede4",
              fontSize: "clamp(2.8rem, 8.5vw, 7.25rem)",
            }}
          >
            Your diagnosis
            <br />
            <em style={{ fontStyle: "italic" }}>isn&apos;t your ceiling.</em>
          </h1>

          <div className="text-center mt-6 pb-32">
            <p
              className="text-base leading-relaxed mb-6 mx-auto"
              style={{ color: "rgba(245,237,228,0.78)", maxWidth: "480px" }}
            >
              Strength training and movement for women navigating endometriosis,
              PMOS, pre/postpartum recovery, and hormonal transitions.
            </p>
            <Link
              to="/services"
              className="pill-btn pill-btn--cream-glass inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold"
              style={{
                fontFamily: SANS,
                textDecoration: "none",
              }}
            >
              Work with me
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      <section
        className="relative pb-28"
        style={{
          background: "#f5ede4",
          zIndex: 10,
          display: "flow-root",
        }}
      >
        <div
          className="max-w-4xl mx-auto px-6 md:px-10"
          style={{ display: "flow-root" }}
        >
          <div
            id="about"
            className="relative z-30 rounded-[2.5rem]"
            style={{
              background: "#fff",
              marginTop: "-4rem",
              padding: "clamp(2.5rem, 5vw, 3.5rem)",
              boxShadow:
                "0 32px 80px rgba(42,31,26,0.13), 0 4px 20px rgba(42,31,26,0.07)",
            }}
          >
            <div className="flex items-start justify-between gap-6 mb-6">
              <h2
                className="font-bold leading-tight"
                style={{
                  fontFamily: SERIF,
                  color: "#2a1f1a",
                  fontSize: "clamp(1.6rem, 3.2vw, 2.25rem)",
                }}
              >
                <span style={{ color: EMBER }}>Train</span> through it.
                <br />
                <span style={{ color: EMBER }}>Recover</span> from it.
                <br />
                <span style={{ color: EMBER }}>Thrive</span> beyond it.
              </h2>

              <div
                className="flex-shrink-0 rounded-full overflow-hidden"
                style={{
                  width: "clamp(6rem, 12vw, 9rem)",
                  height: "clamp(6rem, 12vw, 9rem)",
                  background: EMBER,
                  marginTop: "0.25rem",
                }}
              >
                <ImageWithFallback
                  src={madeleinePortrait}
                  alt="Madeleine Stockton portrait"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div
              className="text-base md:text-[17px] leading-relaxed"
              style={{ color: "#6b5f5a" }}
            >
              <p>
                <span
                  className="font-bold"
                  style={{
                    fontFamily: SERIF,
                    color: EMBER,
                    fontSize: "clamp(1.125rem, 2vw, 1.35rem)",
                  }}
                >
                  Hi, I&apos;m Madeleine
                </span>
                , a Certified Personal Trainer (
                <ExternalLink
                  href={NASM_URL}
                  variant="light"
                  className="align-baseline"
                >
                  NASM-CPT
                </ExternalLink>
                ). For years, my symptoms were
                dismissed. It took an emergency appendectomy to finally reveal
                what had been there all along:{" "}
                <em style={{ fontStyle: "italic" }}>
                  advanced endometriosis spreading throughout my abdomen.
                </em>{" "}
                What followed was surgeries, chronic
                infections, debilitating fatigue, and a medical system that kept
                sending me home with no answers.
              </p>
              <p className="mt-6">
                <strong style={{ color: "#2a1f1a", fontWeight: 700 }}>
                  I know I&apos;m not alone in that.
                </strong>
              </p>
              <p className="mt-6">
                <em style={{ fontStyle: "italic" }}>Every woman</em> has been
                told her pain is normal.{" "}
                <em style={{ fontStyle: "italic" }}>Every woman</em> has left a
                doctor&apos;s office feeling invisible.{" "}
                <em style={{ fontStyle: "italic" }}>EveryWoman</em>{" "}
                exists because that&apos;s not good enough — a women&apos;s
                health and fitness platform built around strength training and
                movement for those living with endometriosis, PCOS,
                pre/postpartum symptoms, and those navigating perimenopause and
                menopause, grounded in real diagnostic experience.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section
        id="services-teaser"
        className="relative pt-16 pb-28 overflow-hidden"
        style={{ background: "#2a1f1a", display: "flow-root" }}
      >
        <div className="max-w-5xl mx-auto px-6 md:px-10">
          <div className="text-center mb-12">
            <span
              className="inline-block px-4 py-1.5 rounded-full text-[11px] md:text-xs mb-5"
              style={{
                fontFamily: MONO,
                color: "#f5ede4",
                border: "1px solid #f5ede4",
              }}
            >
              Strength Training for Women
            </span>
            <h2
              className="font-bold"
              style={{
                fontFamily: SERIF,
                color: "#f5ede4",
                fontSize: "clamp(2.25rem, 4.5vw, 3.25rem)",
              }}
            >
              How do you want to grow?
            </h2>
          </div>

          <div className="relative flex flex-col md:flex-row items-center justify-center gap-8 md:gap-0 mx-auto md:min-h-[480px] max-w-[980px]">
            {(
              [
                {
                  key: "left",
                  text: "Learn to exercise with endometriosis or PMOS",
                  wrapClass:
                    "md:-rotate-[10deg] md:-mr-14 md:mt-16 z-20",
                  background: EMBER,
                  textColor: CREAM,
                  buttonBg: CREAM,
                  buttonColor: BROWN,
                },
                {
                  key: "middle",
                  text: "Get stronger and move better",
                  wrapClass: "z-30",
                  background: BLUSH,
                  textColor: BROWN,
                  buttonBg: BROWN,
                  buttonColor: CREAM,
                },
                {
                  key: "right",
                  text: "Train during postpartum recovery",
                  wrapClass:
                    "md:rotate-[10deg] md:-ml-14 md:mt-16 z-20",
                  background: SAGE,
                  textColor: CREAM,
                  buttonBg: CREAM,
                  buttonColor: BROWN,
                },
              ] as const
            ).map((card) => (
              <div
                key={card.key}
                className={`group/card flex-shrink-0 w-full max-w-[360px] md:w-[clamp(260px,32vw,340px)] transition-[transform,z-index] duration-300 hover:!z-40 ${card.wrapClass}`}
              >
                <Link
                  to="/services"
                  className="flex flex-col justify-between rounded-[2rem] md:rounded-[2.5rem] p-8 md:p-10 min-h-[320px] md:min-h-[420px] h-full transition-all duration-300 group-hover/card:scale-[1.04] group-hover/card:-translate-y-2 cursor-pointer"
                  style={{
                    background: card.background,
                    boxShadow:
                      "0 24px 60px rgba(0,0,0,0.22), 0 4px 16px rgba(0,0,0,0.12)",
                    textDecoration: "none",
                  }}
                >
                  <p
                    className="text-left leading-snug font-medium pr-1"
                    style={{
                      fontFamily: SERIF,
                      color: card.textColor,
                      fontSize: "clamp(2rem, 4.2vw, 2.25rem)",
                    }}
                  >
                    {card.text}
                  </p>
                  <span
                    className={`pill-btn inline-flex items-center gap-2 self-start px-6 py-3 rounded-full text-base font-semibold mt-8 ${
                      card.buttonBg === CREAM
                        ? "pill-btn--cream-solid"
                        : "pill-btn--brown-solid"
                    }`}
                    style={{
                      fontFamily: SANS,
                    }}
                  >
                    Get started
                    <ArrowUpRight className="w-4 h-4" />
                  </span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="connect"
        className="py-24"
        style={{ background: "#2a1f1a" }}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <h2
            className="font-bold mb-10"
            style={{
              fontFamily: SERIF,
              color: "#f5ede4",
              fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
            }}
          >
            Latest from me
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {ARTICLES.map((article, i) => (
              <a
                key={i}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group block rounded-[2rem] p-8 transition-all duration-300 hover:-translate-y-2"
                style={{
                  background: "#1e1510",
                  border: "1px solid rgba(245,237,228,0.06)",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
                }}
              >
                <span
                  className="inline-block text-[10px] font-semibold uppercase tracking-[0.18em] mb-5"
                  style={{ color: article.accent }}
                >
                  Substack
                </span>
                <h3
                  className="font-bold leading-snug mb-3"
                  style={{
                    fontFamily: SERIF,
                    color: "#f5ede4",
                    fontSize: "clamp(0.95rem, 1.1vw, 1.05rem)",
                  }}
                >
                  {article.title}
                </h3>
                <p
                  className="text-sm leading-relaxed mb-7"
                  style={{ color: "#8c8480" }}
                >
                  {article.subtitle}
                </p>
                <div
                  className="flex items-center gap-1.5 text-sm font-medium"
                  style={{ color: article.accent }}
                >
                  Read more
                  <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
