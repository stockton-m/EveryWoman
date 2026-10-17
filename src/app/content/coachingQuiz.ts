import type { CoachingTierId } from "@/app/content/coaching";

export const COACHING_ARCHETYPES = {
  "consistent-self-starter": {
    label: "Consistent Self-Starter",
    description:
      "You thrive with an expert plan and the freedom to follow it on your own schedule.",
  },
  "first-time-lifter": {
    label: "First-Time Lifter",
    description:
      "Strength training is newer to you, so clear instruction and steady progress matter.",
  },
  "steady-rebuilder": {
    label: "Steady Rebuilder",
    description:
      "You are rebuilding consistency after time away or a season of change.",
  },
  "accountability-seeker": {
    label: "Accountability Seeker",
    description:
      "Regular touchpoints help you keep momentum when life gets busy.",
  },
  "form-focused-lifter": {
    label: "Form-Focused Lifter",
    description:
      "Thoughtful feedback helps you lift with confidence and strong technique.",
  },
  "week-to-week-responder": {
    label: "Week-to-Week Responder",
    description:
      "Your best plan responds to how your energy and recovery change each week.",
  },
  "energy-first": {
    label: "Energy-First Trainer",
    description:
      "Energy and recovery guide your training choices more than a rigid schedule.",
  },
  "symptom-aware": {
    label: "Symptom-Aware Trainer",
    description:
      "You want room to train around symptoms and flare days without pushing blindly.",
  },
  "endometriosis-informed": {
    label: "Endometriosis-Informed Mover",
    description:
      "Pelvic symptoms, fatigue, or flare patterns shape how you approach movement.",
  },
  "pcos-energy": {
    label: "PCOS Energy Balancer",
    description:
      "Energy, recovery, and sustainable consistency are central to your training.",
  },
  "postpartum-return": {
    label: "Postpartum Return",
    description:
      "You are returning to strength after pregnancy, birth, or early postpartum.",
  },
  "pregnancy-aware": {
    label: "Pregnancy-Aware Trainer",
    description:
      "You want training that can evolve thoughtfully through pregnancy.",
  },
  "injury-return": {
    label: "Injury Return",
    description:
      "You are rebuilding after injury or surgery with a careful progression.",
  },
  "hormonal-navigator": {
    label: "Hormonal Life Navigator",
    description:
      "Hormonal shifts are an important part of your current training context.",
  },
  "cycle-aware": {
    label: "Cycle-Aware Athlete",
    description:
      "You value programming that respects cycle-related energy and recovery patterns.",
  },
  "pelvic-conscious": {
    label: "Pelvic-Conscious Trainer",
    description:
      "Breathing, core function, and pelvic comfort are priorities in your plan.",
  },
  "lifestyle-integrator": {
    label: "Lifestyle Integrator",
    description:
      "Sleep, stress, and recovery habits belong alongside the workouts.",
  },
  "variable-schedule": {
    label: "Variable-Schedule Trainer",
    description:
      "Travel, work, symptoms, or changing weeks call for a flexible plan.",
  },
  "care-team-collaborator": {
    label: "Care Team Collaborator",
    description:
      "You value coaching that can align with your clinicians or pelvic floor PT.",
  },
  "long-game-planner": {
    label: "Long-Game Planner",
    description:
      "You are thinking in phases and seasons, not only about the next workout.",
  },
  "high-touch-partner": {
    label: "High-Touch Partner",
    description:
      "You want a close collaboration and a fast feedback loop with your coach.",
  },
  "strong-for-life": {
    label: "Strong-for-Life",
    description:
      "Sustainable strength, confidence, and feeling at home in your body lead the way.",
  },
  "mobility-minded": {
    label: "Mobility-Minded Mover",
    description:
      "Moving comfortably and expanding useful range of motion are key goals.",
  },
  "many-layered-story": {
    label: "Many-Layered Health Story",
    description:
      "Several experiences shape how you train, making pacing and context especially important.",
  },
} as const;

export type CoachingArchetypeId = keyof typeof COACHING_ARCHETYPES;

export type CoachingQuizSignal =
  | "selfDirected"
  | "accountability"
  | "priorityContact"
  | "weeklyCalls"
  | "adaptiveSupport"
  | "mobilityCoreSupport"
  | "providerCoordination"
  | "complexContext"
  | "pregnancyContext"
  | "recoveryContext"
  | "lifestyleSupport"
  | "formSupport"
  | "longTermPlanning";

export type CoachingQuizOption = {
  id: string;
  label: string;
  tierWeights: Record<CoachingTierId, number>;
  archetypeWeights: Partial<Record<CoachingArchetypeId, number>>;
  signals?: CoachingQuizSignal[];
};

export type CoachingQuizQuestion = {
  id: string;
  prompt: string;
  options: CoachingQuizOption[];
};

const weights = (
  foundation: number,
  signature: number,
  elevated: number,
): Record<CoachingTierId, number> => ({ foundation, signature, elevated });

export const COACHING_QUIZ_QUESTIONS: CoachingQuizQuestion[] = [
  {
    id: "relationship",
    prompt: "What kind of coaching relationship sounds best right now?",
    options: [
      {
        id: "independent",
        label: "Give me an expert plan and the freedom to run with it",
        tierWeights: weights(3, 0, 0),
        archetypeWeights: {
          "consistent-self-starter": 3,
          "strong-for-life": 1,
        },
        signals: ["selfDirected"],
      },
      {
        id: "partnership",
        label: "I want accountability and a coach in my corner",
        tierWeights: weights(0, 3, 1),
        archetypeWeights: {
          "accountability-seeker": 3,
          "week-to-week-responder": 2,
        },
        signals: ["accountability"],
      },
      {
        id: "close-partnership",
        label: "I want close, expert support through a complex season",
        tierWeights: weights(0, 1, 3),
        archetypeWeights: {
          "high-touch-partner": 3,
          "many-layered-story": 2,
        },
        signals: ["priorityContact"],
      },
      {
        id: "new-to-training",
        label: "I am newer to strength training and want clear guidance",
        tierWeights: weights(2, 2, 0),
        archetypeWeights: {
          "first-time-lifter": 3,
          "form-focused-lifter": 2,
        },
      },
    ],
  },
  {
    id: "messaging",
    prompt: "How often would you like to message with your coach?",
    options: [
      {
        id: "flexible",
        label: "I’m flexible — I’ll message when I need something",
        tierWeights: weights(3, 1, 0),
        archetypeWeights: { "consistent-self-starter": 2 },
        signals: ["selfDirected"],
      },
      {
        id: "weekly",
        label: "A weekly touchpoint feels right",
        tierWeights: weights(1, 3, 0),
        archetypeWeights: { "accountability-seeker": 2 },
        signals: ["accountability"],
      },
      {
        id: "daily",
        label: "I’d value regular, near-daily messaging",
        tierWeights: weights(0, 3, 1),
        archetypeWeights: {
          "accountability-seeker": 3,
          "week-to-week-responder": 1,
        },
        signals: ["accountability"],
      },
      {
        id: "priority",
        label: "I want priority access and the fastest response times",
        tierWeights: weights(0, 1, 3),
        archetypeWeights: { "high-touch-partner": 3 },
        signals: ["priorityContact"],
      },
      {
        id: "unsure",
        label: "I’m not sure yet",
        tierWeights: weights(1, 2, 1),
        archetypeWeights: { "steady-rebuilder": 1 },
      },
    ],
  },
  {
    id: "check-ins",
    prompt: "What check-in and call rhythm would keep you supported?",
    options: [
      {
        id: "monthly",
        label: "A monthly progress review is plenty",
        tierWeights: weights(3, 0, 0),
        archetypeWeights: { "consistent-self-starter": 2 },
        signals: ["selfDirected"],
      },
      {
        id: "weekly-check-in",
        label: "Weekly check-ins, without regular calls",
        tierWeights: weights(0, 3, 1),
        archetypeWeights: { "accountability-seeker": 3 },
        signals: ["accountability"],
      },
      {
        id: "biweekly-calls",
        label: "Weekly check-ins and a call every other week",
        tierWeights: weights(0, 3, 1),
        archetypeWeights: {
          "accountability-seeker": 3,
          "form-focused-lifter": 1,
        },
        signals: ["accountability"],
      },
      {
        id: "weekly-calls",
        label: "Weekly check-ins and a live call every week",
        tierWeights: weights(0, 1, 3),
        archetypeWeights: { "high-touch-partner": 3 },
        signals: ["weeklyCalls"],
      },
    ],
  },
  {
    id: "program-cadence",
    prompt: "How often should your training program be adjusted?",
    options: [
      {
        id: "monthly",
        label: "Monthly — my weeks are fairly steady",
        tierWeights: weights(3, 0, 0),
        archetypeWeights: {
          "consistent-self-starter": 2,
          "strong-for-life": 1,
        },
        signals: ["selfDirected"],
      },
      {
        id: "weekly",
        label: "Weekly, based on my energy and recovery",
        tierWeights: weights(0, 3, 1),
        archetypeWeights: {
          "week-to-week-responder": 3,
          "energy-first": 2,
        },
        signals: ["accountability"],
      },
      {
        id: "as-needed",
        label: "As often as needed when symptoms or life change",
        tierWeights: weights(0, 1, 3),
        archetypeWeights: {
          "symptom-aware": 3,
          "variable-schedule": 2,
        },
        signals: ["adaptiveSupport"],
      },
    ],
  },
  {
    id: "predictability",
    prompt: "How predictable are your energy and recovery week to week?",
    options: [
      {
        id: "predictable",
        label: "Pretty predictable",
        tierWeights: weights(2, 1, 0),
        archetypeWeights: { "strong-for-life": 2 },
      },
      {
        id: "somewhat-variable",
        label: "They vary somewhat",
        tierWeights: weights(1, 3, 1),
        archetypeWeights: {
          "week-to-week-responder": 3,
          "energy-first": 1,
        },
      },
      {
        id: "highly-variable",
        label: "Highly variable or shaped by flare days",
        tierWeights: weights(0, 2, 3),
        archetypeWeights: {
          "symptom-aware": 3,
          "energy-first": 3,
        },
        signals: ["adaptiveSupport"],
      },
    ],
  },
  {
    id: "health-context",
    prompt: "Which health or recovery context feels closest to yours?",
    options: [
      {
        id: "general-wellness",
        label: "General strength and wellness",
        tierWeights: weights(2, 1, 0),
        archetypeWeights: { "strong-for-life": 3 },
      },
      {
        id: "endometriosis-pelvic",
        label: "Endometriosis or pelvic symptoms affect how I move",
        tierWeights: weights(0, 2, 3),
        archetypeWeights: {
          "endometriosis-informed": 3,
          "pelvic-conscious": 2,
          "symptom-aware": 1,
        },
        signals: ["complexContext"],
      },
      {
        id: "pcos-metabolic",
        label: "PCOS or related energy and metabolic patterns are part of my story",
        tierWeights: weights(0, 2, 3),
        archetypeWeights: {
          "pcos-energy": 3,
          "cycle-aware": 2,
          "energy-first": 1,
        },
        signals: ["complexContext"],
      },
      {
        id: "other-chronic-overlap",
        label: "Another chronic condition, overlapping symptoms, or I’m not sure",
        tierWeights: weights(0, 2, 3),
        archetypeWeights: {
          "many-layered-story": 3,
          "symptom-aware": 2,
          "energy-first": 1,
        },
        signals: ["complexContext"],
      },
      {
        id: "injury-recovery",
        label: "I’m returning after an injury or surgery",
        tierWeights: weights(0, 2, 3),
        archetypeWeights: {
          "injury-return": 3,
          "steady-rebuilder": 2,
        },
        signals: ["recoveryContext"],
      },
      {
        id: "hormonal-transition",
        label: "Perimenopause, menopause, or another hormonal transition",
        tierWeights: weights(0, 3, 2),
        archetypeWeights: {
          "hormonal-navigator": 3,
          "cycle-aware": 1,
        },
        signals: ["complexContext"],
      },
    ],
  },
  {
    id: "pregnancy-postpartum",
    prompt: "Is pregnancy or postpartum recovery part of this season?",
    options: [
      {
        id: "pregnant",
        label: "I’m currently pregnant",
        tierWeights: weights(0, 2, 3),
        archetypeWeights: {
          "pregnancy-aware": 3,
          "pelvic-conscious": 1,
        },
        signals: ["pregnancyContext"],
      },
      {
        id: "early-postpartum",
        label: "I’m in the first year postpartum",
        tierWeights: weights(0, 2, 3),
        archetypeWeights: {
          "postpartum-return": 3,
          "pelvic-conscious": 2,
        },
        signals: ["pregnancyContext", "recoveryContext"],
      },
      {
        id: "later-return",
        label: "I’m returning to training after a longer postpartum break",
        tierWeights: weights(1, 2, 2),
        archetypeWeights: {
          "postpartum-return": 2,
          "steady-rebuilder": 3,
        },
        signals: ["recoveryContext"],
      },
      {
        id: "not-applicable",
        label: "No, this isn’t part of my current season",
        tierWeights: weights(1, 1, 0),
        archetypeWeights: { "strong-for-life": 1 },
      },
      {
        id: "prefer-not",
        label: "I’d prefer not to say",
        tierWeights: weights(1, 1, 1),
        archetypeWeights: { "steady-rebuilder": 1 },
      },
    ],
  },
  {
    id: "form-feedback",
    prompt: "How much lifting-form feedback would you like?",
    options: [
      {
        id: "not-needed",
        label: "Very little — I’m confident working independently",
        tierWeights: weights(3, 0, 0),
        archetypeWeights: { "consistent-self-starter": 2 },
        signals: ["selfDirected"],
      },
      {
        id: "sometimes",
        label: "Occasional video review would be helpful",
        tierWeights: weights(1, 3, 0),
        archetypeWeights: { "form-focused-lifter": 3 },
        signals: ["formSupport"],
      },
      {
        id: "regular",
        label: "Regular video review is important to me",
        tierWeights: weights(0, 3, 1),
        archetypeWeights: {
          "form-focused-lifter": 3,
          "first-time-lifter": 1,
        },
        signals: ["formSupport", "accountability"],
      },
      {
        id: "live-weekly",
        label: "I want frequent review and live coaching",
        tierWeights: weights(0, 1, 3),
        archetypeWeights: {
          "form-focused-lifter": 3,
          "high-touch-partner": 2,
        },
        signals: ["formSupport", "weeklyCalls"],
      },
    ],
  },
  {
    id: "adaptive-programming",
    prompt: "How often do symptoms, travel, or fatigue change your plans?",
    options: [
      {
        id: "rarely",
        label: "Rarely — I can usually follow the plan as written",
        tierWeights: weights(3, 1, 0),
        archetypeWeights: { "consistent-self-starter": 2 },
      },
      {
        id: "sometimes",
        label: "Sometimes — weekly adjustments would help",
        tierWeights: weights(1, 3, 1),
        archetypeWeights: {
          "variable-schedule": 2,
          "week-to-week-responder": 2,
        },
        signals: ["accountability"],
      },
      {
        id: "often",
        label: "Often — I need on-the-fly alternatives",
        tierWeights: weights(0, 1, 3),
        archetypeWeights: {
          "variable-schedule": 3,
          "symptom-aware": 2,
        },
        signals: ["adaptiveSupport"],
      },
    ],
  },
  {
    id: "lifestyle",
    prompt: "How much should sleep, stress, and recovery be part of coaching?",
    options: [
      {
        id: "handled",
        label: "I have those habits handled",
        tierWeights: weights(2, 1, 0),
        archetypeWeights: { "consistent-self-starter": 1 },
      },
      {
        id: "woven-in",
        label: "I’d like them woven into regular coaching",
        tierWeights: weights(0, 3, 1),
        archetypeWeights: { "lifestyle-integrator": 3 },
        signals: ["lifestyleSupport"],
      },
      {
        id: "central",
        label: "They strongly affect training and should be central",
        tierWeights: weights(0, 2, 3),
        archetypeWeights: {
          "lifestyle-integrator": 3,
          "energy-first": 2,
        },
        signals: ["lifestyleSupport"],
      },
    ],
  },
  {
    id: "mobility-core",
    prompt: "What role should mobility, breathing, and core work play?",
    options: [
      {
        id: "general",
        label: "General warm-ups and accessories are enough",
        tierWeights: weights(2, 1, 0),
        archetypeWeights: { "strong-for-life": 1 },
      },
      {
        id: "personalized",
        label: "I’d like some personalized mobility and core work",
        tierWeights: weights(1, 3, 1),
        archetypeWeights: {
          "mobility-minded": 2,
          "pelvic-conscious": 2,
        },
      },
      {
        id: "essential",
        label: "Personalized breathing, core, or pelvic support is essential",
        tierWeights: weights(0, 1, 3),
        archetypeWeights: {
          "pelvic-conscious": 3,
          "mobility-minded": 2,
        },
        signals: ["mobilityCoreSupport"],
      },
    ],
  },
  {
    id: "coordination-planning",
    prompt: "How much coordination and long-term planning do you want?",
    options: [
      {
        id: "neither",
        label: "I’m focused on this month and don’t need provider coordination",
        tierWeights: weights(3, 1, 0),
        archetypeWeights: { "consistent-self-starter": 2 },
      },
      {
        id: "long-term",
        label: "I want a plan that develops through several training phases",
        tierWeights: weights(1, 3, 2),
        archetypeWeights: { "long-game-planner": 3 },
        signals: ["longTermPlanning"],
      },
      {
        id: "informal-alignment",
        label: "Informal alignment with my care team would be useful",
        tierWeights: weights(0, 3, 2),
        archetypeWeights: {
          "care-team-collaborator": 2,
          "many-layered-story": 1,
        },
        signals: ["complexContext"],
      },
      {
        id: "provider-coordination",
        label: "Direct coordination with providers or pelvic floor PT would help",
        tierWeights: weights(0, 1, 3),
        archetypeWeights: {
          "care-team-collaborator": 3,
          "many-layered-story": 2,
        },
        signals: ["providerCoordination", "complexContext"],
      },
      {
        id: "both",
        label: "I want both coordinated care and long-term phase planning",
        tierWeights: weights(0, 1, 3),
        archetypeWeights: {
          "care-team-collaborator": 3,
          "long-game-planner": 3,
        },
        signals: [
          "providerCoordination",
          "longTermPlanning",
          "complexContext",
        ],
      },
    ],
  },
  {
    id: "primary-goal",
    prompt: "What matters most in your training right now?",
    options: [
      {
        id: "start-lifting",
        label: "Start lifting weights with confidence",
        tierWeights: weights(2, 2, 0),
        archetypeWeights: {
          "first-time-lifter": 3,
          "form-focused-lifter": 1,
        },
      },
      {
        id: "train-safely",
        label: "Know I’m training safely for my body",
        tierWeights: weights(0, 2, 2),
        archetypeWeights: {
          "form-focused-lifter": 2,
          "symptom-aware": 2,
        },
      },
      {
        id: "get-stronger",
        label: "Get stronger and keep progressing",
        tierWeights: weights(2, 3, 0),
        archetypeWeights: { "strong-for-life": 3 },
      },
      {
        id: "build-consistency",
        label: "Build a routine I can sustain",
        tierWeights: weights(3, 2, 0),
        archetypeWeights: {
          "steady-rebuilder": 3,
          "consistent-self-starter": 2,
        },
      },
      {
        id: "move-better",
        label: "Move more comfortably and become more flexible",
        tierWeights: weights(1, 2, 2),
        archetypeWeights: {
          "mobility-minded": 3,
          "strong-for-life": 1,
        },
      },
      {
        id: "unsure",
        label: "I’m still figuring that out",
        tierWeights: weights(1, 3, 1),
        archetypeWeights: { "steady-rebuilder": 2 },
        signals: ["accountability"],
      },
    ],
  },
];

export const COACHING_QUIZ_INTRO = {
  title: "What coaching tier should I choose?",
  body: "Answer some questions to figure out which EveryWoman coaching tier is right for you.",
} as const;

export const COACHING_TIER_BEST_FOR: Record<CoachingTierId, string> = {
  foundation:
    "Best for: self-motivated women who want expert programming and the freedom to run with it.",
  signature:
    "Best for: women who want accountability, personalized guidance, and a coach in their corner.",
  elevated:
    "Best for: women navigating chronic illness, postpartum recovery, or major life transitions who want close, expert support every step of the way.",
};
