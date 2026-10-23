import type { CoachingTierId } from "@/app/content/coaching";
import {
  COACHING_ARCHETYPES,
  COACHING_QUIZ_QUESTIONS,
  type CoachingArchetypeId,
  type CoachingQuizOption,
  type CoachingQuizSignal,
} from "@/app/content/coachingQuiz";

export type CoachingQuizAnswers = Record<string, string>;

export type CoachingQuizArchetypeResult = {
  id: CoachingArchetypeId;
  label: string;
  description: string;
  percent: number;
};

export type CoachingQuizResult = {
  tierId: CoachingTierId;
  tierScores: Record<CoachingTierId, number>;
  archetypes: CoachingQuizArchetypeResult[];
  explanation: string;
  elevatedEligible: boolean;
};

const TIER_IDS: CoachingTierId[] = ["foundation", "signature", "elevated"];
const CLOSE_SUPPORT_SIGNALS: CoachingQuizSignal[] = [
  "priorityContact",
  "weeklyCalls",
  "adaptiveSupport",
  "mobilityCoreSupport",
  "providerCoordination",
];
const CONTEXT_SIGNALS: CoachingQuizSignal[] = [
  "complexContext",
  "pregnancyContext",
  "recoveryContext",
];

function getSelectedOptions(answers: CoachingQuizAnswers): CoachingQuizOption[] {
  return COACHING_QUIZ_QUESTIONS.flatMap((question) => {
    const selectedId = answers[question.id];
    const selected = question.options.find((option) => option.id === selectedId);
    return selected ? [selected] : [];
  });
}

function countSignals(
  selectedOptions: CoachingQuizOption[],
): Partial<Record<CoachingQuizSignal, number>> {
  const counts: Partial<Record<CoachingQuizSignal, number>> = {};

  selectedOptions.forEach((option) => {
    option.signals?.forEach((signal) => {
      counts[signal] = (counts[signal] ?? 0) + 1;
    });
  });

  return counts;
}

function totalSignals(
  counts: Partial<Record<CoachingQuizSignal, number>>,
  signals: CoachingQuizSignal[],
): number {
  return signals.reduce((sum, signal) => sum + (counts[signal] ?? 0), 0);
}

function scoreTiers(selectedOptions: CoachingQuizOption[]) {
  return selectedOptions.reduce<Record<CoachingTierId, number>>(
    (totals, option) => {
      TIER_IDS.forEach((tierId) => {
        totals[tierId] += option.tierWeights[tierId];
      });
      return totals;
    },
    { foundation: 0, signature: 0, elevated: 0 },
  );
}

function chooseTier(
  tierScores: Record<CoachingTierId, number>,
  signals: Partial<Record<CoachingQuizSignal, number>>,
) {
  const contextCount = totalSignals(signals, CONTEXT_SIGNALS);
  const closeSupportCount = totalSignals(signals, CLOSE_SUPPORT_SIGNALS);
  const elevatedEligible =
    (contextCount >= 1 && closeSupportCount >= 1) || closeSupportCount >= 3;
  const elevatedLeads =
    tierScores.elevated > tierScores.signature &&
    tierScores.elevated > tierScores.foundation;

  if (elevatedEligible && elevatedLeads) {
    return { tierId: "elevated" as const, elevatedEligible };
  }

  // Signature is the neutral tie-breaker because it is the core coaching
  // experience; Foundation wins only when its preferences lead outright.
  const tierId =
    tierScores.foundation > tierScores.signature ? "foundation" : "signature";

  return { tierId, elevatedEligible };
}

function normalizeTopArchetypes(
  rawScores: Record<CoachingArchetypeId, number>,
): CoachingQuizArchetypeResult[] {
  const stableIds = Object.keys(COACHING_ARCHETYPES) as CoachingArchetypeId[];
  const topThree = stableIds
    .map((id, stableIndex) => ({
      id,
      raw: rawScores[id],
      stableIndex,
    }))
    .sort((a, b) => b.raw - a.raw || a.stableIndex - b.stableIndex)
    .slice(0, 3);

  const total = topThree.reduce((sum, item) => sum + item.raw, 0) || 1;
  const apportioned = topThree.map((item) => {
    const exact = (item.raw / total) * 100;
    return {
      ...item,
      percent: Math.floor(exact),
      remainder: exact - Math.floor(exact),
    };
  });

  let pointsLeft =
    100 - apportioned.reduce((sum, item) => sum + item.percent, 0);
  [...apportioned]
    .sort((a, b) => b.remainder - a.remainder || a.stableIndex - b.stableIndex)
    .forEach((item) => {
      if (pointsLeft <= 0) return;
      const target = apportioned.find((candidate) => candidate.id === item.id);
      if (target) target.percent += 1;
      pointsLeft -= 1;
    });

  return apportioned.map(({ id, percent }) => ({
    id,
    label: COACHING_ARCHETYPES[id].label,
    description: COACHING_ARCHETYPES[id].description,
    percent,
  }));
}

function scoreArchetypes(
  selectedOptions: CoachingQuizOption[],
): CoachingQuizArchetypeResult[] {
  const ids = Object.keys(COACHING_ARCHETYPES) as CoachingArchetypeId[];
  const rawScores = Object.fromEntries(ids.map((id) => [id, 0])) as Record<
    CoachingArchetypeId,
    number
  >;

  selectedOptions.forEach((option) => {
    Object.entries(option.archetypeWeights).forEach(([id, score]) => {
      rawScores[id as CoachingArchetypeId] += score ?? 0;
    });
  });

  if (Object.values(rawScores).every((score) => score === 0)) {
    rawScores["strong-for-life"] = 1;
    rawScores["consistent-self-starter"] = 1;
    rawScores["steady-rebuilder"] = 1;
  }

  return normalizeTopArchetypes(rawScores);
}

function buildExplanation(
  tierId: CoachingTierId,
  signals: Partial<Record<CoachingQuizSignal, number>>,
): string {
  if (tierId === "foundation") {
    return "Your answers point to a self-directed rhythm: expert programming, monthly progress reviews, and the freedom to train on your own schedule.";
  }

  if (tierId === "elevated") {
    const details: string[] = [];
    if (signals.providerCoordination) details.push("care-team coordination");
    if (signals.adaptiveSupport) details.push("on-the-fly adjustments");
    if (signals.weeklyCalls || signals.priorityContact)
      details.push("a close coaching connection");
    if (signals.mobilityCoreSupport)
      details.push("personalized mobility, breathing, and core work");

    const supportSummary =
      details.length > 0
        ? details.slice(0, 3).join(", ")
        : "high-touch, adaptable support";
    return `Your current season and support preferences call for ${supportSummary}, with expert guidance that can respond as your needs change.`;
  }

  const details: string[] = [];
  if (signals.accountability) details.push("weekly accountability");
  if (signals.formSupport) details.push("form feedback");
  if (signals.lifestyleSupport) details.push("recovery and lifestyle coaching");
  if (signals.longTermPlanning) details.push("longer-term planning");

  const supportSummary =
    details.length > 0
      ? details.slice(0, 3).join(", ")
      : "personalized weekly guidance";
  return `Your answers favor ${supportSummary} and a coach who can adjust your program as your body and schedule change.`;
}

export function scoreCoachingQuiz(
  answers: CoachingQuizAnswers,
): CoachingQuizResult {
  const selectedOptions = getSelectedOptions(answers);
  const signals = countSignals(selectedOptions);
  const tierScores = scoreTiers(selectedOptions);
  const { tierId, elevatedEligible } = chooseTier(tierScores, signals);

  return {
    tierId,
    tierScores,
    archetypes: scoreArchetypes(selectedOptions),
    explanation: buildExplanation(tierId, signals),
    elevatedEligible,
  };
}
