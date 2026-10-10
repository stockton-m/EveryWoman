import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
import { SERIF } from "@/app/constants";
import logoImage from "@/imports/logo.png";

export function SiteFooter() {
  return (
    <footer style={{ background: "#1e1510" }} className="pt-12 pb-10">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 pb-8"
          style={{ borderBottom: "1px solid rgba(245,237,228,0.07)" }}
        >
          <div className="flex items-center gap-3">
            <ImageWithFallback
              src={logoImage}
              alt="EveryWoman"
              className="h-7 w-7 object-contain"
            />
            <div>
              <div
                className="font-bold text-sm"
                style={{ fontFamily: SERIF, color: "#f5ede4" }}
              >
                EveryWoman
              </div>
              <div className="text-xs" style={{ color: "#8c8480" }}>
                everywoman.io
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-6">
            {[
              {
                label: "Substack",
                url: "https://everywomanhealth.substack.com/",
              },
              {
                label: "TikTok",
                url: "https://www.tiktok.com/@everywomanhealth",
              },
              {
                label: "Instagram",
                url: "https://www.instagram.com/everywoman.io",
              },
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
          © {new Date().getFullYear()} EveryWoman · Madeleine Stockton ·
          everywoman.io
        </div>
      </div>
    </footer>
  );
}
