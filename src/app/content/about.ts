export type AboutProfile = {
  role: string;
  name: string;
  description: string;
  accent: "orange" | "green" | "pink";
};

export type AboutCollageItem = {
  id: "artist" | "dog" | "podcast" | "coffee" | "fear" | "hobby";
  title: string;
  description: string;
  accent: "orange" | "green" | "brown" | "pink";
  layout: "feature" | "left" | "upperRight" | "right" | "lowerLeft" | "lowerMiddle";
};

export const ABOUT_BACKGROUND = {
  lead: {
    before: "I started ",
    emphasis: "EveryWoman",
    after: " because...",
  },
  signoff: "—M.",
  left: [
    "Madeleine’s journey began with a simple belief: movement should help you feel more at home in your body, not at odds with it. Her own health experience reshaped the way she thought about strength, recovery, and what support can look like.",
    "This is placeholder copy for the fuller story of the years, people, and turning points that eventually became EveryWoman.",
    "Placeholder copy for the seasons of training, rest, and rebuilding that taught her to treat coaching as a long conversation rather than a quick fix.",
    "More placeholder copy will live here: the communities she has been part of, the questions she still asks, and the reasons EveryWoman is built around real life instead of a perfect plan.",
    "Placeholder copy for the ordinary weeks in between: the walks, the setbacks, the appointments, and the small decisions that made coaching feel personal instead of prescribed.",
  ],
  right: [
    "Along the way, she learned that no two bodies—or seasons of life—ask for the same thing. Good coaching starts by listening, stays curious, and makes room for real life.",
    "We’ll use this space to share more of Madeleine’s background, certifications, and the personal experiences that continue to guide her work.",
    "Placeholder copy for the credentials, mentors, and day-to-day details that round out Madeleine’s story and keep this side of the section from feeling unfinished.",
  ],
};

export const ABOUT_ETHOS_INTRO =
  "EveryWoman is shaped by generous teachers, thoughtful collaborators, and the women who trusted Madeleine with their stories. This space will celebrate a few of the people who helped her build a more human way to coach.";

export const ABOUT_PROFILES: AboutProfile[] = [
  {
    role: "MENTOR & COACH",
    name: "Woman’s name",
    description:
      "Placeholder copy about this woman’s work, the wisdom she shared, and how her relationship with Madeleine helped shape EveryWoman.",
    accent: "green",
  },
  {
    role: "COLLABORATOR",
    name: "Woman’s name",
    description:
      "Placeholder copy about their work together, the values they share, and the impact this woman has had on Madeleine’s approach to coaching.",
    accent: "orange",
  },
  {
    role: "COMMUNITY BUILDER",
    name: "Woman’s name",
    description:
      "Placeholder copy celebrating this woman’s perspective, her contribution to women’s health, and the connection she shares with Madeleine.",
    accent: "pink",
  },
];

export const ABOUT_COLLAGE_ITEMS: AboutCollageItem[] = [
  {
    id: "artist",
    title: "My Spotify Wrapped",
    description: "The soundtrack that is almost always playing.",
    accent: "orange",
    layout: "feature",
  },
  {
    id: "coffee",
    title: "My go to",
    description: "A favorite restaurant, meal, or very specific coffee order.",
    accent: "green",
    layout: "left",
  },
  {
    id: "dog",
    title: "My training partner",
    description: "Madeleine’s dog and unofficial EveryWoman teammate.",
    accent: "pink",
    layout: "upperRight",
  },
  {
    id: "podcast",
    title: "My shower jam",
    description: "A favorite podcast, turned up loud enough to hear over the water.",
    accent: "orange",
    layout: "right",
  },
  {
    id: "fear",
    title: "My unwind",
    description: "An episode of The Real Housewives, and nowhere else to be.",
    accent: "pink",
    layout: "lowerLeft",
  },
  {
    id: "hobby",
    title: "My greatest fear",
    description: "Birds. All of them, preferably from a polite distance.",
    accent: "green",
    layout: "lowerMiddle",
  },
];
