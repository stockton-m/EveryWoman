import type { LucideIcon } from "lucide-react";
import { Dumbbell, Heart, Sparkles } from "lucide-react";

export const COACHING_INTRO_PARAGRAPHS = [
  "Most fitness programs were designed around men's bodies and then handed to women. EveryWoman coaching starts from the opposite place. Your program is built around your hormones, your history, and your goals, whether you're training through a chronic illness (like PMOS or endometriosis), coming back after having a baby, or just want to get strong and feel at home in your body.",
  "Every coaching relationship starts with a free consultation call, so we can make sure it's the right fit and choose the level of support you need.",
] as const;

export const COACHING_DISCLAIMER =
  "EveryWoman coaching provides strength training and lifestyle coaching from a NASM Certified Personal Trainer. It is not a substitute for medical care, diagnosis, or treatment, and it is designed to work alongside your healthcare team.";

export type CoachingTierId = "foundation" | "signature" | "elevated";

export type CoachingFeature = {
  label: string;
  foundation: boolean;
  signature: boolean;
  elevated: boolean;
};

export const COACHING_FEATURES: CoachingFeature[] = [
  {
    label: "Custom training plan",
    foundation: true,
    signature: true,
    elevated: true,
  },
  {
    label: "Weekly check-in",
    foundation: false,
    signature: true,
    elevated: true,
  },
  {
    label: "Form video review",
    foundation: false,
    signature: true,
    elevated: true,
  },
  {
    label: "Nutrition guidance",
    foundation: false,
    signature: false,
    elevated: true,
  },
  {
    label: "Priority messaging",
    foundation: false,
    signature: false,
    elevated: true,
  },
  {
    label: "Program adjustments between cycles",
    foundation: true,
    signature: true,
    elevated: true,
  },
];

export type CoachingTier = {
  id: CoachingTierId;
  name: string;
  blurb: string;
  icon: LucideIcon;
  highlighted?: boolean;
};

export const COACHING_TIERS: CoachingTier[] = [
  {
    id: "foundation",
    name: "Foundation",
    blurb:
      "Structured strength programming with the essentials — ideal if you want a clear plan and accountability to get started.",
    icon: Dumbbell,
  },
  {
    id: "signature",
    name: "Signature",
    blurb:
      "Our most popular level: personalized training plus regular touchpoints so your plan evolves with your body and your season of life.",
    icon: Heart,
    highlighted: true,
  },
  {
    id: "elevated",
    name: "Elevated",
    blurb:
      "Maximum support for complex health histories or ambitious goals — closer collaboration and faster feedback loops.",
    icon: Sparkles,
  },
];

export function tierHasFeature(
  tierId: CoachingTierId,
  feature: CoachingFeature,
): boolean {
  return feature[tierId];
}
