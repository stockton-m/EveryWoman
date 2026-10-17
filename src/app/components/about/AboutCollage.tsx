import { AboutImagePlaceholder } from "@/app/components/about/AboutImagePlaceholder";
import { ABOUT_COLLAGE_ITEMS } from "@/app/content/about";
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
            <AboutImagePlaceholder
              accent={accent}
              className="about-collage__image"
              label={`Placeholder image for ${item.title}`}
            />
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
                {item.description}
              </p>
            </div>
          </article>
        );
      })}
    </div>
  );
}
