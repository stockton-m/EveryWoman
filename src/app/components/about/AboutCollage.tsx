import { AboutInlines } from "@/app/components/about/AboutInlines";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
import { ABOUT_COLLAGE_ITEMS } from "@/app/content/about";
import { ABOUT_COLLAGE_IMAGES } from "@/app/content/aboutCollageImages";
import { BLUSH, BROWN, CREAM, EMBER, SAGE, SERIF } from "@/app/constants";

const ACCENTS = {
  orange: EMBER,
  green: SAGE,
  brown: BROWN,
  pink: BLUSH,
} as const;

export function AboutCollage() {
  return (
    <div className="about-collage">
      {ABOUT_COLLAGE_ITEMS.map((item) => {
        const accent = ACCENTS[item.accent];

        return (
          <article
            key={item.id}
            className={`about-collage__item about-collage__item--${item.layout}`}
          >
            <div
              className="about-image-placeholder about-image-placeholder--squircle about-collage__image"
              style={{ borderColor: accent }}
            >
              <ImageWithFallback
                src={ABOUT_COLLAGE_IMAGES[item.id]}
                alt={item.title}
                className="about-collage__photo"
              />
            </div>
            <div className="about-collage__caption">
              <h3
                className="mb-1 font-bold leading-tight"
                style={{
                  fontFamily: SERIF,
                  fontSize: "clamp(1.05rem, 1.8vw, 1.35rem)",
                }}
              >
                {item.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: CREAM }}>
                <AboutInlines content={item.description} />
              </p>
            </div>
          </article>
        );
      })}
    </div>
  );
}
