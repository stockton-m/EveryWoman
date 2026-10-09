export const COACHING_INTRO_PARAGRAPHS = [
  "Most fitness programs were designed around men's bodies and then handed to women. EveryWoman coaching starts from the opposite place. Your program is built around your hormones, your history, and your goals, whether you're training through a chronic illness (like PMOS or endometriosis), coming back after having a baby, or just want to get strong and feel at home in your body.",
  "Every coaching relationship starts with a free consultation call, so we can make sure it's the right fit and choose the level of support you need.",
] as const;

export const COACHING_DISCLAIMER_PREFIX =
  "EveryWoman coaching provides strength training and lifestyle coaching from a ";

export const COACHING_DISCLAIMER_SUFFIX =
  " Certified Personal Trainer. It is not a substitute for medical care, diagnosis, or treatment, and it is designed to work alongside your healthcare team.";

export const NASM_URL = "https://www.nasm.org/";
export const COACHRX_APP_URL =
  "https://apps.apple.com/us/app/coachrx-by-opex-fitness/id1544150077";

export type CoachingTierId = "foundation" | "signature" | "elevated";

export type PlainTextPart = {
  text: string;
  bold?: boolean;
  italic?: boolean;
};

export type TierBenefitCopy =
  | { kind: "plain"; text: string }
  | { kind: "plain"; parts: PlainTextPart[] }
  | { kind: "structured"; title: string; description: string }
  | { kind: "coachrx"; before: string; after: string };

export type CoachingBenefit = {
  id: string;
  display: "plain" | "structured";
  foundation?: TierBenefitCopy;
  signature?: TierBenefitCopy;
  elevated?: TierBenefitCopy;
};

export const COACHING_BENEFITS: CoachingBenefit[] = [
  {
    id: "custom-program",
    display: "plain",
    foundation: {
      kind: "plain",
      text: "Custom strength program designed for your goals, experience, and equipment",
    },
    signature: {
      kind: "plain",
      text: "Custom strength program designed for your goals, experience, and equipment",
    },
    elevated: {
      kind: "plain",
      text: "Custom strength program designed for your goals, experience, and equipment",
    },
  },
  {
    id: "coachrx-app",
    display: "plain",
    foundation: {
      kind: "coachrx",
      before: "24/7 access via the ",
      after: " app",
    },
    signature: {
      kind: "coachrx",
      before: "24/7 access via the ",
      after: " app",
    },
    elevated: {
      kind: "coachrx",
      before: "24/7 access via the ",
      after: " app",
    },
  },
  {
    id: "program-cadence",
    display: "plain",
    foundation: {
      kind: "plain",
      parts: [
        { text: "Monthly", bold: true },
        { text: " program refreshes" },
      ],
    },
    signature: {
      kind: "plain",
      parts: [
        { text: "Weekly", bold: true },
        { text: " program adjustments based on your energy and recovery" },
      ],
    },
    elevated: {
      kind: "plain",
      parts: [
        { text: "Weekly", bold: true },
        { text: " program adjustments based on your energy and recovery" },
      ],
    },
  },
  {
    id: "check-in",
    display: "plain",
    foundation: {
      kind: "plain",
      parts: [
        { text: "Monthly", bold: true },
        { text: " check-in and progress review" },
      ],
    },
    signature: {
      kind: "plain",
      parts: [
        { text: "Weekly", bold: true },
        { text: " check-in and progress review" },
      ],
    },
    elevated: {
      kind: "plain",
      parts: [
        { text: "Weekly", bold: true },
        { text: " check-in and progress review" },
      ],
    },
  },
  {
    id: "messaging",
    display: "plain",
    foundation: { kind: "plain", text: "Direct messaging with your coach" },
    signature: {
      kind: "plain",
      parts: [
        { text: "Daily", bold: true },
        { text: " direct messaging with your coach" },
      ],
    },
    elevated: {
      kind: "plain",
      parts: [
        { text: "Priority", bold: true },
        { text: " direct messaging with your coach with the " },
        { text: "fastest response times", italic: true },
      ],
    },
  },
  {
    id: "one-on-one-calls",
    display: "structured",
    signature: {
      kind: "structured",
      title: "One-on-one calls",
      description:
        "Biweekly one-on-one calls to review your progress, go over your form live, and adjust your plan",
    },
    elevated: {
      kind: "structured",
      title: "One-on-one calls",
      description:
        "Weekly one-on-one calls to review your progress, go over your form live, and adjust your plan",
    },
  },
  {
    id: "health-personalization",
    display: "structured",
    signature: {
      kind: "structured",
      title: "Health history personalization",
      description:
        "Further program personalization based on your health history and medical conditions",
    },
    elevated: {
      kind: "structured",
      title: "Health history personalization",
      description:
        "Further program personalization based on your health history and medical conditions",
    },
  },
  {
    id: "video-form-reviews",
    display: "structured",
    signature: {
      kind: "structured",
      title: "Video form review",
      description:
        "Lifting form review via video so you always know you're lifting safely",
    },
    elevated: {
      kind: "structured",
      title: "Video form review",
      description:
        "Lifting form review via video so you always know you're lifting safely",
    },
  },
  {
    id: "habit-lifestyle",
    display: "structured",
    signature: {
      kind: "structured",
      title: "Lifestyle coaching",
      description:
        "Habit and lifestyle coaching for sleep, recovery, and stress",
    },
    elevated: {
      kind: "structured",
      title: "Lifestyle coaching",
      description:
        "Habit and lifestyle coaching for sleep, recovery, and stress",
    },
  },
  {
    id: "flare-up-adjustments",
    display: "structured",
    elevated: {
      kind: "structured",
      title: "Adaptive programming",
      description:
        "On-the-fly program adjustments for flare-ups, symptoms, travel, and recovery",
    },
  },
  {
    id: "mobility-core",
    display: "structured",
    elevated: {
      kind: "structured",
      title: "Mobility support",
      description: "Personalized mobility, breathing, and core work",
    },
  },
  {
    id: "phase-planning",
    display: "structured",
    elevated: {
      kind: "structured",
      title: "Long-term training planning",
      description: "Training phase planning for long term goals",
    },
  },
  {
    id: "provider-coordination",
    display: "structured",
    elevated: {
      kind: "structured",
      title: "Coordinated care",
      description:
        "Coordination with your health care providers and pelvic floor PT",
    },
  },
];

const TIER_KEYS: CoachingTierId[] = ["foundation", "signature", "elevated"];

export function isBenefitIncluded(
  benefit: CoachingBenefit,
  tierId: CoachingTierId,
): boolean {
  return benefit[tierId] !== undefined;
}

export function getBenefitCopy(
  benefit: CoachingBenefit,
  tierId: CoachingTierId,
): TierBenefitCopy | undefined {
  return benefit[tierId];
}

/** Label shown when this tier does not include the benefit (for aligned compare rows). */
export function getInactiveDisplayTitle(benefit: CoachingBenefit): string {
  for (const tierId of TIER_KEYS) {
    const copy = benefit[tierId];
    if (!copy) continue;
    if (copy.kind === "structured") return copy.title;
    if (copy.kind === "plain") {
      if ("text" in copy) return copy.text;
      return copy.parts.map((p) => p.text).join("");
    }
    if (copy.kind === "coachrx") {
      return `${copy.before}CoachRx${copy.after}`;
    }
  }
  return benefit.id;
}

export const BENEFIT_MODAL_PLACEHOLDER =
  "More detail about this benefit is coming soon.";

export function getBenefitModalTitle(benefit: CoachingBenefit): string {
  return getInactiveDisplayTitle(benefit);
}

export function getBenefitIncludedTierLabels(
  benefit: CoachingBenefit,
): string[] {
  return COACHING_TIERS.filter((tier) => benefit[tier.id] !== undefined).map(
    (tier) => tier.name,
  );
}

/** Description for structured rows — used for reserved height when inactive. */
export function getStructuredDescription(benefit: CoachingBenefit): string | null {
  if (benefit.display !== "structured") return null;
  let longest: string | null = null;
  for (const tierId of TIER_KEYS) {
    const copy = benefit[tierId];
    if (copy?.kind === "structured") {
      if (!longest || copy.description.length > longest.length) {
        longest = copy.description;
      }
    }
  }
  return longest;
}

export type CoachingTier = {
  id: CoachingTierId;
  name: string;
  tagline: string;
  intro: string[];
};

export const COACHING_TIERS: CoachingTier[] = [
  {
    id: "foundation",
    name: "Foundation",
    tagline: "Structure and expert programming, on your own schedule.",
    intro: [
      "For women who are ready to train consistently and want a plan built for them instead of a generic app.",
    ],
  },
  {
    id: "signature",
    name: "Signature",
    tagline: "Personalized coaching that changes with your body.",
    intro: [
      "This is the core EveryWoman experience, for women who want real partnership in their training and a program that responds to how they actually feel from week to week.",
    ],
  },
  {
    id: "elevated",
    name: "Elevated",
    tagline:
      "The highest level of support, for complex goals and seasons of change.",
    intro: [
      "For women managing a chronic illness, recovering from pregnancy or injury, or anyone who wants the most hands-on, collaborative coaching available. Elevated is a true partnership: your coach knows your body, your history, and your goals as well as you do.",
    ],
  },
];
