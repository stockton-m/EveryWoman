import { ArrowUpRight } from "lucide-react";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
import logoImage from "@/imports/image-1.png";
import madeleineImage from "@/imports/image-3.png";
import madeleinePortrait from "@/imports/image-5.png";

const SERIF = "'Playfair Display', Georgia, serif";
const SANS = "'DM Sans', system-ui, sans-serif";
const EMBER = "#c4622d";

const NAV_LINKS: { id: string; label: string; href?: string; external?: boolean }[] = [
  { id: "about", label: "About" },
  { id: "posts", label: "Posts" },
  { id: "waitlist", label: "Waitlist" },
  { id: "connect", label: "Connect" },
  { id: "podcast", label: "Podcast", external: true },
];

const ARTICLES = [
  {
    url: "https://everywomanhealth.substack.com/p/they-finally-changed-the-name-heres",
    title: "They Finally Changed the Name. Here's Why It Took 100 Years — and Why It Matters",
    subtitle: "PCOS has finally had a glow-up.",
    accent: "#c4622d",
  },
  {
    url: "https://everywomanhealth.substack.com/p/pelvic-floor-pt-what-it-is-why-it",
    title: "Pelvic Floor PT: What It Is, Why It Matters, and What Nobody Told You",
    subtitle: "An overview, a guide, and (maybe?) a lifestyle",
    accent: "#7a9e7e",
  },
  {
    url: "https://everywomanhealth.substack.com/p/how-to-fight-for-your-endometriosispcos",
    title: "How To Fight For Your Endometriosis/PCOS Diagnosis",
    subtitle: "An overview of how to best advocate for yourself.",
    accent: "#e8c4b0",
  },
];

function SubstackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M22.539 8.242H1.46V5.406h21.08v2.836zM1.46 10.812V24L12 18.11 22.54 24V10.812H1.46zM22.54 0H1.46v2.836h21.08V0z" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.66a8.18 8.18 0 004.79 1.53V6.74a4.85 4.85 0 01-1.02-.05z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

export default function App() {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div style={{ fontFamily: SANS, minHeight: "100vh" }}>

      {/* ── HERO (with nav as first element on the sage gradient) ── */}
      <section
        id="hero"
        className="relative overflow-hidden flex flex-col"
        style={{
          background:
            "radial-gradient(ellipse at 50% 46%, #93b896 0%, #7a9e7e 38%, #567a5a 100%)",
        }}
      >
        {/* Subtle vignette at bottom */}
        <div
          className="absolute bottom-0 left-0 right-0 pointer-events-none"
          style={{
            height: "160px",
            background:
              "linear-gradient(to bottom, transparent 0%, rgba(30,21,16,0.14) 100%)",
            zIndex: 5,
          }}
        />

      {/* ── NAV ────────────────────────────────────────────────── */}
      <nav className="relative z-30 flex-shrink-0">
        <div
          className="max-w-7xl mx-auto px-6 md:px-10 flex items-center justify-between"
          style={{ height: "76px" }}
        >
          {/* Logo — circular container with cream bg + EveryWoman text */}
          <button
            onClick={() => scrollTo("hero")}
            className="flex items-center gap-3 flex-shrink-0"
            style={{ cursor: "pointer" }}
          >
            <div
              className="flex items-center justify-center rounded-full flex-shrink-0"
              style={{
                background: "#f5ede4",
                border: "2px solid rgba(245,237,228,0.5)",
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
              className="font-bold text-[22px] tracking-tight"
              style={{ fontFamily: SERIF, color: "#f5ede4" }}
            >
              EveryWoman
            </span>
          </button>

          {/* Pills — always visible with ember background */}
          <div className="hidden md:flex items-center gap-2">
            {NAV_LINKS.map((link) => {
              const sharedStyle = {
                background: EMBER,
                color: "#f5ede4",
                fontFamily: SANS,
              } as const;
              const sharedClass =
                "inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200";
              const handleEnter = (e: React.MouseEvent<HTMLElement>) =>
                (e.currentTarget.style.background = "#a84e22");
              const handleLeave = (e: React.MouseEvent<HTMLElement>) =>
                (e.currentTarget.style.background = EMBER);

              return link.href ? (
                <a
                  key={link.id}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onMouseEnter={handleEnter}
                  onMouseLeave={handleLeave}
                  className={sharedClass}
                  style={sharedStyle}
                >
                  {link.label}
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              ) : (
                <button
                  key={link.id}
                  onClick={() => scrollTo(link.id)}
                  onMouseEnter={handleEnter}
                  onMouseLeave={handleLeave}
                  className={sharedClass}
                  style={sharedStyle}
                >
                  {link.label}
                  {link.external && <ArrowUpRight className="w-3.5 h-3.5" />}
                </button>
              );
            })}
          </div>

          {/* Subscribe CTA */}
          <a
            href="https://everywomanhealth.substack.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 hover:scale-[1.03] hover:shadow-lg flex-shrink-0"
            style={{
              background: "#f5ede4",
              color: "#2a1f1a",
              fontFamily: SANS,
            }}
          >
            Subscribe
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </nav>

        {/* Title block */}
        <div className="relative z-20 max-w-7xl mx-auto px-6 md:px-10 w-full pt-10 md:pt-14 flex-shrink-0">
          <h1
            className="font-bold text-center leading-[0.9]"
            style={{
              fontFamily: SERIF,
              color: "#f5ede4",
              fontSize: "clamp(2.8rem, 6.5vw, 5.25rem)",
            }}
          >
            Your diagnosis
            <br />
            <em style={{ fontStyle: "italic" }}>isn&apos;t your ceiling.</em>
          </h1>

          {/* Body text — centered below title */}
          <div className="text-center mt-6 pb-32">
            <p
              className="text-base leading-relaxed mb-6 mx-auto"
              style={{ color: "rgba(245,237,228,0.78)", maxWidth: "480px" }}
            >
              Strength training and movement for women navigating endometriosis,
              PMOS, pre/postpartum recovery, and hormonal transitions.
            </p>
            <a
              href="https://everywomanhealth.substack.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 hover:scale-[1.03] hover:shadow-lg hover:bg-white/20"
              style={{
                background: "rgba(245,237,228,0.14)",
                color: "#f5ede4",
                border: "1px solid rgba(245,237,228,0.28)",
                fontFamily: SANS,
              }}
            >
              Subscribe &amp; Join
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </section>

      {/* ── ABOUT ──────────────────────────────────────────────── */}
      <section
        id="about"
        className="relative pb-28"
        style={{
          background: "#f5ede4",
          zIndex: 10,
          display: "flow-root", // prevents the squircle's negative margin from collapsing through this section
        }}
      >
        <div className="max-w-4xl mx-auto px-6 md:px-10" style={{ display: "flow-root" }}>
          {/* Squircle card — floats well above the about section into the hero */}
          <div
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

              {/* Circular portrait — height matches the title block */}
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
            <p
              className="text-base md:text-[17px] leading-relaxed"
              style={{ color: "#6b5f5a" }}
            >
              Hi, I&apos;m Madeleine. For years, my symptoms were dismissed. It
              took an emergency appendectomy to finally reveal what had been there
              all along — advanced endometriosis, spread throughout my abdomen.
              What followed was surgeries, chronic infections, debilitating
              fatigue, and a medical system that kept sending me home with no
              answers.
              <br /><br />
              I know I&apos;m not alone in that.
              <br /><br />
              Every woman has been told her pain is normal. Every woman has left
              a doctor&apos;s office feeling invisible. EveryWoman exists because
              that&apos;s not good enough — a women&apos;s health and fitness
              platform built around strength training and movement for those
              living with endometriosis, PCOS, pre/postpartum symptoms, and those
              navigating perimenopause and menopause, grounded in real diagnostic
              experience.
            </p>
          </div>
        </div>
      </section>

      {/* ── LATEST POSTS ───────────────────────────────────────── */}
      <section
        id="posts"
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
            Latest posts
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

      {/* ── TRAINING WAITLIST ──────────────────────────────────── */}
      <section id="waitlist" className="py-24" style={{ background: "#f5ede4" }}>
        <div className="max-w-2xl mx-auto px-6 md:px-10">
          <h2
            className="font-bold mb-4"
            style={{
              fontFamily: SERIF,
              color: "#2a1f1a",
              fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
            }}
          >
            Training Waitlist
          </h2>
          <p className="text-base leading-relaxed mb-10" style={{ color: "#6b5f5a" }}>
            Spots for 1-on-1 coaching are limited. Sign up early and you'll be the first to hear when they open — along with a program built around your body and your diagnosis.
          </p>
          <form
            onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
              e.preventDefault();
              const form = e.currentTarget;
              const name = (form.elements.namedItem("name") as HTMLInputElement).value;
              const email = (form.elements.namedItem("email") as HTMLInputElement).value;
              window.location.href = `mailto:everywoman.io@gmail.com?subject=Training%20Waitlist%3A%20${encodeURIComponent(name)}&body=Name%3A%20${encodeURIComponent(name)}%0AEmail%3A%20${encodeURIComponent(email)}`;
            }}
            className="flex flex-col gap-4"
          >
            <input
              name="name"
              type="text"
              required
              placeholder="Your name"
              className="w-full rounded-2xl px-5 py-3.5 text-sm outline-none"
              style={{
                background: "#fff",
                border: "1px solid rgba(42,31,26,0.12)",
                color: "#2a1f1a",
                fontFamily: SANS,
              }}
            />
            <input
              name="email"
              type="email"
              required
              placeholder="Your email address"
              className="w-full rounded-2xl px-5 py-3.5 text-sm outline-none"
              style={{
                background: "#fff",
                border: "1px solid rgba(42,31,26,0.12)",
                color: "#2a1f1a",
                fontFamily: SANS,
              }}
            />
            <button
              type="submit"
              className="self-start inline-flex items-center gap-2 px-7 py-3 rounded-full text-sm font-semibold transition-all duration-200 hover:scale-[1.03] hover:shadow-lg"
              style={{ background: EMBER, color: "#f5ede4", fontFamily: SANS }}
            >
              Join the waitlist
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </section>

      {/* ── SOCIALS ────────────────────────────────────────────── */}
      <section
        id="connect"
        className="py-24"
        style={{ background: "#f5ede4" }}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <h2
            className="font-bold mb-10"
            style={{
              fontFamily: SERIF,
              color: "#2a1f1a",
              fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
            }}
          >
            Connect with me
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Substack */}
            <a
              href="https://everywomanhealth.substack.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 rounded-[1.5rem] p-5 transition-all duration-300 hover:-translate-y-1"
              style={{ background: "#fff", boxShadow: "0 2px 12px rgba(42,31,26,0.06)" }}
            >
              <div
                className="rounded-full flex items-center justify-center flex-shrink-0 text-white"
                style={{ background: "#FF6719", width: "40px", height: "40px" }}
              >
                <SubstackIcon />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[9px] uppercase tracking-[0.15em] font-medium mb-0.5" style={{ color: "#8c8480" }}>Substack</div>
                <div className="font-semibold text-xs truncate transition-colors duration-200 group-hover:text-[#c4622d]" style={{ color: "#2a1f1a" }}>EveryWoman</div>
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 flex-shrink-0 transition-all duration-200 group-hover:text-[#c4622d] group-hover:translate-x-0.5 group-hover:-translate-y-0.5" style={{ color: "#8c8480" }} />
            </a>

            {/* TikTok */}
            <a
              href="https://www.tiktok.com/@everywomanhealth"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 rounded-[1.5rem] p-5 transition-all duration-300 hover:-translate-y-1"
              style={{ background: "#fff", boxShadow: "0 2px 12px rgba(42,31,26,0.06)" }}
            >
              <div
                className="rounded-full flex items-center justify-center flex-shrink-0 text-white"
                style={{ background: "#2a1f1a", width: "40px", height: "40px" }}
              >
                <TikTokIcon />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[9px] uppercase tracking-[0.15em] font-medium mb-0.5" style={{ color: "#8c8480" }}>TikTok</div>
                <div className="font-semibold text-xs truncate transition-colors duration-200 group-hover:text-[#c4622d]" style={{ color: "#2a1f1a" }}>@everywomanhealth</div>
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 flex-shrink-0 transition-all duration-200 group-hover:text-[#c4622d] group-hover:translate-x-0.5 group-hover:-translate-y-0.5" style={{ color: "#8c8480" }} />
            </a>

            {/* Email */}
            <a
              href="mailto:everywoman.io@gmail.com"
              className="group flex items-center gap-3 rounded-[1.5rem] p-5 transition-all duration-300 hover:-translate-y-1"
              style={{ background: "#fff", boxShadow: "0 2px 12px rgba(42,31,26,0.06)" }}
            >
              <div
                className="rounded-full flex items-center justify-center flex-shrink-0 text-white"
                style={{ background: EMBER, width: "40px", height: "40px" }}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[9px] uppercase tracking-[0.15em] font-medium mb-0.5" style={{ color: "#8c8480" }}>Email</div>
                <div className="font-semibold text-xs truncate transition-colors duration-200 group-hover:text-[#c4622d]" style={{ color: "#2a1f1a" }}>everywoman.io@gmail.com</div>
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 flex-shrink-0 transition-all duration-200 group-hover:text-[#c4622d] group-hover:translate-x-0.5 group-hover:-translate-y-0.5" style={{ color: "#8c8480" }} />
            </a>

            {/* Instagram */}
            <a
              href="https://www.instagram.com/everywoman.io"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 rounded-[1.5rem] p-5 transition-all duration-300 hover:-translate-y-1"
              style={{ background: "#fff", boxShadow: "0 2px 12px rgba(42,31,26,0.06)" }}
            >
              <div
                className="rounded-full flex items-center justify-center flex-shrink-0 text-white"
                style={{
                  background: "linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)",
                  width: "40px",
                  height: "40px",
                }}
              >
                <InstagramIcon />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[9px] uppercase tracking-[0.15em] font-medium mb-0.5" style={{ color: "#8c8480" }}>Instagram</div>
                <div className="font-semibold text-xs truncate transition-colors duration-200 group-hover:text-[#c4622d]" style={{ color: "#2a1f1a" }}>everywoman.io</div>
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 flex-shrink-0 transition-all duration-200 group-hover:text-[#c4622d] group-hover:translate-x-0.5 group-hover:-translate-y-0.5" style={{ color: "#8c8480" }} />
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────── */}
      <footer style={{ background: "#1e1510" }} className="pt-12 pb-10">
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div
            className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 pb-8"
            style={{ borderBottom: "1px solid rgba(245,237,228,0.07)" }}
          >
            <div className="flex items-center gap-3">
              <ImageWithFallback src={logoImage} alt="EveryWoman" className="h-7 w-7 object-contain" />
              <div>
                <div className="font-bold text-sm" style={{ fontFamily: SERIF, color: "#f5ede4" }}>EveryWoman</div>
                <div className="text-xs" style={{ color: "#8c8480" }}>everywoman.io</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-6">
              {[
                { label: "Substack", url: "https://everywomanhealth.substack.com/" },
                { label: "TikTok", url: "https://www.tiktok.com/@everywomanhealth" },
                { label: "Instagram", url: "https://www.instagram.com/everywoman.io" },
              ].map((link) => (
                <a
                  key={link.label}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm transition-colors duration-200 hover:text-[#f5ede4]"
                  style={{ color: "#8c8480" }}
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
          <div className="pt-6 text-xs" style={{ color: "#8c8480" }}>
            © {new Date().getFullYear()} EveryWoman · Madeleine Stockton · everywoman.io
          </div>
        </div>
      </footer>
    </div>
  );
}
