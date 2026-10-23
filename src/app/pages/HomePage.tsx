import { useState, type CSSProperties } from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { ExternalLink } from "@/app/components/ExternalLink";
import { EmbedModal } from "@/app/components/posts/EmbedModal";
import { FollowColumn } from "@/app/components/posts/FollowColumn";
import { PostCard } from "@/app/components/posts/PostCard";
import { ShortsPreview } from "@/app/components/posts/ShortsPreview";
import { SiteFooter } from "@/app/components/SiteFooter";
import { SiteNav } from "@/app/components/SiteNav";
import { NASM_URL } from "@/app/content/coaching";
import { groupLabel, newerPost } from "@/app/content/postGroups";
import { getPostThumbnail, groupedPosts } from "@/app/content/posts";
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
import { useMediaQuery } from "@/app/hooks/useMediaQuery";
import { useScrollToHash } from "@/app/hooks/useScrollToHash";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
import madeleinePortrait from "@/imports/profile.webp";
import getInTouchPortrait from "@/imports/getintouch.webp";

const latestGroups = groupedPosts.slice(0, 3);
const latestPosts = latestGroups.map((group) => newerPost(group.members));

const GROWTH_CARDS = [
  {
    key: "left",
    text: "Learn to exercise with endometriosis or PCOS/PMOS",
    wrapClass: "md:-rotate-[10deg] md:-mr-14 md:mt-16 z-20",
    background: EMBER,
    textColor: CREAM,
    buttonBg: CREAM,
    angle: "0deg",
  },
  {
    key: "middle",
    text: "Get stronger and move better",
    wrapClass: "z-30",
    background: BLUSH,
    textColor: BROWN,
    buttonBg: BROWN,
    angle: "120deg",
  },
  {
    key: "right",
    text: "Train during postpartum recovery",
    wrapClass: "md:rotate-[10deg] md:-ml-14 md:mt-16 z-20",
    background: SAGE,
    textColor: CREAM,
    buttonBg: CREAM,
    angle: "240deg",
  },
] as const;

function GrowthOrbit() {
  return (
    <div className="home-orbit md:hidden">
      <div className="home-orbit__note" aria-hidden="true">
        <span className="home-orbit__note-text">tap one</span>
        <svg
          className="home-orbit__note-arrow"
          viewBox="0 0 86 64"
          fill="none"
        >
          <path
            d="M6 20C20 6 32 14 40 26c8 12 12 16 28 24"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
          <path
            d="M58 36C62 41 65 47 68 50"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
          <path
            d="M51 55C58 55 63 53 68 50"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <div className="home-orbit__stage">
        <div className="home-orbit__ring">
          {GROWTH_CARDS.map((card) => (
            <div
              key={card.key}
              className="home-orbit__slot"
              style={{ "--angle": card.angle } as CSSProperties}
            >
              <div className="home-orbit__counter">
                <Link
                  to="/services"
                  className="home-orbit__circle"
                  style={{
                    background: card.background,
                    color: card.textColor,
                  }}
                >
                  <span className="home-orbit__label">{card.text}</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function HomePage() {
  useScrollToHash();
  const isMobile = useMediaQuery("(max-width: 767px)");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const activeGroup =
    activeIndex === null ? null : (latestGroups[activeIndex] ?? null);

  return (
    <div style={{ fontFamily: SANS, minHeight: "100vh" }}>
      <section
        id="hero"
        className="relative overflow-clip flex flex-col"
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

        <div className="relative z-20 max-w-7xl mx-auto px-6 md:px-10 w-full pt-16 md:pt-24 flex-shrink-0">
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

          <div className="text-center mt-10 pb-48 md:pb-32">
            <p
              className="text-base leading-relaxed mb-6 mx-auto"
              style={{ color: "rgba(245,237,228,0.78)", maxWidth: "480px" }}
            >
              Strength training and movement for women navigating endometriosis,
              PCOS/PMOS, pre/postpartum recovery, and hormonal transitions.
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
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      <section
        className="relative overflow-x-clip pb-10 md:pb-28"
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
            <div className="home-about__header mb-6">
              <div
                className="home-about__portrait"
                style={{ background: EMBER }}
              >
                <ImageWithFallback
                  src={madeleinePortrait}
                  alt="Madeleine Stockton portrait"
                  className="w-full h-full object-cover"
                />
              </div>
              <h2
                className="home-about__title home-about__title--mobile font-bold md:hidden"
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
              <h2
                className="home-about__title home-about__title--desktop hidden font-bold leading-tight md:block"
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
                movement for those living with endometriosis, PCOS/PMOS,
                pre/postpartum symptoms, and those navigating perimenopause and
                menopause, grounded in real diagnostic experience.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section
        id="services-teaser"
        className="relative overflow-clip pt-16 pb-10 md:pb-40"
        style={{ background: "#2a1f1a", display: "flow-root" }}
      >
        <div className="max-w-5xl mx-auto px-6 md:px-10">
          <div className="home-grow__intro text-center mb-12">
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

          <GrowthOrbit />
          <div className="relative mx-auto hidden max-w-[980px] items-center justify-center md:flex md:min-h-[480px] md:flex-row md:gap-0">
            {GROWTH_CARDS.map((card) => (
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

      <section id="connect" className="pt-8 pb-10 md:py-24" style={{ background: CREAM }}>
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <h2
            className="home-latest__title mb-0 font-bold"
            style={{
              fontFamily: SERIF,
              color: BROWN,
            }}
          >
            Latest from me
          </h2>
          <p
            className="mb-10 text-sm md:text-base"
            style={{ fontFamily: MONO }}
          >
            <span style={{ color: SAGE }}>@everywomanhealth</span>
            <span style={{ color: "#000" }}> / </span>
            <span style={{ color: EMBER }}>@everywoman.io</span>
          </p>
          <div className="home-latest__row grid grid-cols-3 gap-0.5 md:hidden">
            {latestGroups.map((group, index) => {
              const lead = latestPosts[index];
              const thumbnail = getPostThumbnail(lead);
              return (
                <button
                  key={group.id}
                  type="button"
                  className="home-latest__thumb"
                  aria-label={groupLabel(group.members)}
                  onClick={() => setActiveIndex(index)}
                >
                  {thumbnail ? (
                    <ImageWithFallback
                      src={thumbnail}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </button>
              );
            })}
          </div>
          <div className="hidden md:grid md:grid-cols-3 md:gap-5">
            {latestGroups.map((group, index) => {
              const lead = latestPosts[index];
              return (
                <PostCard
                  key={group.id}
                  label={groupLabel(group.members)}
                  members={group.members}
                  onOpen={() => setActiveIndex(index)}
                  publishedAt={lead.publishedAt}
                  thumbnailPost={lead}
                  variant="featured"
                />
              );
            })}
          </div>
          <div className="mt-10 flex justify-center">
            <Link
              to="/posts"
              className="pill-btn pill-btn--ember inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-semibold"
              style={{ fontFamily: SANS, textDecoration: "none" }}
            >
              See more
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section
        className="home-contact pb-12 pt-20 md:pb-14 md:pt-28"
        style={{ background: EMBER }}
        aria-labelledby="get-in-touch-heading"
      >
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <h2
            id="get-in-touch-heading"
            className="home-contact-title mb-6 md:mb-2"
            style={{ color: CREAM }}
          >
            Get in touch
          </h2>
          <div className="home-contact-layout grid grid-cols-1 items-center gap-8 md:grid-cols-3 md:gap-10">
            <div className="home-contact-portrait-wrap">
              <div
                className="about-image-placeholder about-image-placeholder--circle home-contact-portrait relative"
                style={{ borderColor: CREAM }}
              >
                <ImageWithFallback
                  src={getInTouchPortrait}
                  alt="Madeleine Stockton"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </div>
            </div>
            <div className="home-contact-copy">
              <div className="home-contact-copy-panel">
                <p
                  className="text-base leading-relaxed md:text-[17px]"
                  style={{ color: CREAM }}
                >
                  I can&apos;t wait to hear from you. My goal is to provide
                  tailored coaching for every woman based on her lifestyle,
                  diagnoses, and training history. Please reach out to me to get
                  started.
                </p>
              </div>
              <Link
                to="/contact"
                className="pill-btn pill-btn--cream-solid mt-6 inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-semibold"
                style={{ fontFamily: SANS, textDecoration: "none" }}
              >
                Contact me
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="home-contact-follow flex justify-center">
              <FollowColumn compact headingColor={CREAM} layout="grid" />
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
      {isMobile ? (
        <ShortsPreview
          activeIndex={activeIndex}
          onChange={setActiveIndex}
          onClose={() => setActiveIndex(null)}
          posts={latestPosts}
        />
      ) : (
        <EmbedModal
          filter={null}
          hasNext={activeIndex !== null && activeIndex < latestGroups.length - 1}
          hasPrevious={activeIndex !== null && activeIndex > 0}
          members={activeGroup?.members ?? []}
          onClose={() => setActiveIndex(null)}
          onNext={() =>
            setActiveIndex((index) =>
              index === null
                ? index
                : Math.min(index + 1, latestGroups.length - 1),
            )
          }
          onPrevious={() =>
            setActiveIndex((index) =>
              index === null ? index : Math.max(index - 1, 0),
            )
          }
          showAllPostsLink
        />
      )}
    </div>
  );
}
