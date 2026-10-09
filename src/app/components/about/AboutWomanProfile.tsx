import { ArrowRight } from "lucide-react";
import { AboutImagePlaceholder } from "@/app/components/about/AboutImagePlaceholder";
import type { AboutProfile } from "@/app/content/about";
import { BLUSH, BROWN, CREAM, EMBER, MONO, SAGE, SERIF } from "@/app/constants";

const ACCENTS = {
  orange: EMBER,
  green: SAGE,
  pink: BLUSH,
} as const;

export const ABOUT_ETHOS_CARD_STYLES = [
  { background: SAGE, color: CREAM },
  { background: BLUSH, color: BROWN },
  { background: EMBER, color: CREAM },
] as const;

export function getAboutEthosCardStyle(index: number) {
  return ABOUT_ETHOS_CARD_STYLES[index % ABOUT_ETHOS_CARD_STYLES.length];
}

type AboutWomanProfileProps = {
  profile: AboutProfile;
  index: number;
  onOpen: () => void;
};

export function AboutWomanProfile({
  profile,
  index,
  onOpen,
}: AboutWomanProfileProps) {
  const cardStyle = getAboutEthosCardStyle(index);

  return (
    <button
      type="button"
      className="about-ethos-card"
      style={{ background: cardStyle.background, color: cardStyle.color }}
      onClick={onOpen}
      aria-haspopup="dialog"
    >
      <div className="about-ethos-card__media">
        <AboutImagePlaceholder
          accent={ACCENTS[profile.accent]}
          className="about-ethos-card__image"
          label={`Placeholder portrait for ${profile.name}`}
        />
      </div>

      <div className="about-ethos-card__copy">
        <p className="about-ethos-card__role" style={{ fontFamily: MONO }}>
          {profile.role}
        </p>
        <h3 className="about-ethos-card__name" style={{ fontFamily: SERIF }}>
          {profile.name}
        </h3>
        <p className="about-ethos-card__desc">{profile.description}</p>
      </div>

      <span className="about-ethos-card__more">
        Read more
        <ArrowRight className="about-ethos-card__arrow" aria-hidden="true" />
      </span>
    </button>
  );
}
