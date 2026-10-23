import lakeishaCard from "@/imports/lakeisha0.webp";
import lakeishaModal from "@/imports/lakeisha1.webp";
import lorettaCard from "@/imports/loretta0.webp";
import lorettaModal from "@/imports/loretta1.webp";
import stacyCard from "@/imports/stacy0.webp";
import stacyModal from "@/imports/stacy1new.webp";
import { ABOUT_PROFILES, type AboutProfile } from "./about";

export type AboutProfileWithPortrait = AboutProfile & {
  cardImage: string;
  modalImage: string;
  cardImageClassName?: string;
  modalImageClassName?: string;
};

const PORTRAITS = {
  "Loretta Hogg": { cardImage: lorettaCard, modalImage: lorettaModal },
  "La Keisha Landrum Pierre": {
    cardImage: lakeishaCard,
    modalImage: lakeishaModal,
    cardImageClassName: "about-ethos-card__image--top",
    modalImageClassName: "about-ethos-modal__image--matte",
  },
  "Dr. Stacy Sims": { cardImage: stacyCard, modalImage: stacyModal },
} as const;

type PortraitName = keyof typeof PORTRAITS;

function portraitFor(name: string) {
  if (!(name in PORTRAITS)) {
    throw new Error(`Missing about portrait for ${name}`);
  }
  return PORTRAITS[name as PortraitName];
}

export const ABOUT_PROFILES_WITH_PORTRAITS: AboutProfileWithPortrait[] =
  ABOUT_PROFILES.map((profile) => ({
    ...profile,
    ...portraitFor(profile.name),
  }));
