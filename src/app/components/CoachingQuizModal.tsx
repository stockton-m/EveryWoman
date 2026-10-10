import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { CoachingQuizResult } from "@/app/components/CoachingQuizResult";
import { TierPatternIcon } from "@/app/components/TierPatternIcon";
import type { CoachingQuizPhase } from "@/app/components/CoachingQuiz";
import {
  COACHING_QUIZ_INTRO,
  COACHING_QUIZ_QUESTIONS,
} from "@/app/content/coachingQuiz";
import type {
  CoachingQuizAnswers,
  CoachingQuizResult as CoachingQuizResultData,
} from "@/app/lib/coachingQuizScoring";
import { BROWN, CREAM, EMBER, SAGE, SANS, SERIF } from "@/app/constants";

type CoachingQuizModalProps = {
  isOpen: boolean;
  phase: CoachingQuizPhase;
  questionIndex: number;
  answers: CoachingQuizAnswers;
  animatingAnswerId: string | null;
  selectionRun: number;
  result: CoachingQuizResultData;
  onClose: () => void;
  onStart: () => void;
  onStartOver: () => void;
  onBack: () => void;
  onAnswer: (answerId: string) => void;
};

const TITLE_ID = "coaching-quiz-title";

export function CoachingQuizModal({
  isOpen,
  phase,
  questionIndex,
  answers,
  animatingAnswerId,
  selectionRun,
  result,
  onClose,
  onStart,
  onStartOver,
  onBack,
  onAnswer,
}: CoachingQuizModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab") return;
      const dialog = closeButtonRef.current?.closest('[role="dialog"]');
      const focusable = dialog?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      previousFocus?.focus();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const question = COACHING_QUIZ_QUESTIONS[questionIndex];

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-3 md:p-8"
      style={{ background: "rgba(42,31,26,0.62)" }}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={TITLE_ID}
        className="coaching-quiz-modal relative flex w-full max-w-5xl flex-col overflow-y-auto rounded-[2rem] p-6 sm:p-8 md:rounded-[3rem] md:p-12"
        style={{
          minHeight: "min(42rem, calc(100dvh - 3rem))",
          maxHeight: "calc(100dvh - 1.5rem)",
          background: SAGE,
          boxShadow: "0 32px 90px rgba(42,31,26,0.3)",
          color: CREAM,
          fontFamily: SANS,
        }}
      >
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          className="pill-btn pill-btn--icon absolute right-5 top-5 z-20 rounded-full p-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 md:right-8 md:top-8"
          style={{ color: CREAM }}
          aria-label="Close tier quiz"
        >
          <X className="h-6 w-6" />
        </button>

        {phase === "result" && (
          <button
            type="button"
            onClick={onStartOver}
            className="pill-btn pill-btn--outline-cream absolute right-16 top-5 z-20 inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 md:right-20 md:top-8 md:text-sm"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Start over
          </button>
        )}

        {phase === "intro" && (
          <div className="flex min-h-[30rem] flex-1 flex-col">
            <div className="my-auto max-w-2xl py-16">
              <div
                className="mb-5 flex items-center gap-3"
                aria-hidden="true"
              >
                {(
                  ["foundation", "signature", "elevated"] as const
                ).map((tierId) => (
                  <span
                    key={tierId}
                    className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full md:h-20 md:w-20"
                    style={{ background: CREAM, color: EMBER }}
                  >
                    <TierPatternIcon
                      tierId={tierId}
                      className="h-11 w-11 md:h-14 md:w-14"
                    />
                  </span>
                ))}
              </div>
              <h2
                id={TITLE_ID}
                className="mb-6 pr-10 font-bold leading-tight"
                style={{
                  color: CREAM,
                  fontFamily: SERIF,
                  fontSize: "clamp(2.25rem, 6vw, 4.5rem)",
                }}
              >
                {COACHING_QUIZ_INTRO.title}
              </h2>
              <p
                className="max-w-xl text-lg leading-relaxed md:text-xl"
                style={{ color: "rgba(245,237,228,0.88)" }}
              >
                {COACHING_QUIZ_INTRO.body}
              </p>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={onStart}
                className="pill-btn pill-btn--cream-solid inline-flex items-center gap-3 rounded-full px-7 py-3.5 text-base font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
              >
                Start
                <ArrowRight className="h-4 w-4" style={{ color: EMBER }} />
              </button>
            </div>
          </div>
        )}

        {phase === "question" && (
          <div className="flex min-h-[34rem] flex-1 flex-col">
            <button
              type="button"
              onClick={onBack}
              className="pill-btn pill-btn--outline-cream mb-7 inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </button>

            <div className="mb-8 flex items-start gap-4 pr-10 md:gap-6">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg font-bold md:h-14 md:w-14 md:text-xl"
                style={{
                  background: CREAM,
                  color: EMBER,
                  marginTop: "clamp(0.45rem, 1vw, 0.75rem)",
                }}
                aria-hidden="true"
              >
                {questionIndex + 1}
              </span>
              <h2
                id={TITLE_ID}
                className="font-bold leading-tight"
                style={{
                  color: CREAM,
                  fontFamily: SERIF,
                  fontSize: "clamp(1.65rem, 4vw, 3rem)",
                }}
              >
                {question.prompt}
              </h2>
            </div>

            <div
              className="grid gap-3 sm:grid-cols-2"
              aria-label={`Answers for question ${questionIndex + 1}`}
            >
              {question.options.map((option) => {
                const isSelected = answers[question.id] === option.id;
                const isAnimating = animatingAnswerId === option.id;

                return (
                  <button
                    key={`${option.id}-${isAnimating ? selectionRun : 0}`}
                    type="button"
                    disabled={animatingAnswerId !== null}
                    onClick={() => onAnswer(option.id)}
                    className={`coaching-quiz-answer ${
                      isSelected ? "is-selected" : ""
                    } ${isAnimating ? "is-animating" : ""}`}
                    aria-pressed={isSelected}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>

            <div
              className="mt-auto flex flex-wrap items-center gap-1.5 pt-9"
              aria-label={`Question ${questionIndex + 1} of ${COACHING_QUIZ_QUESTIONS.length}`}
            >
              {COACHING_QUIZ_QUESTIONS.map((progressQuestion, index) => {
                const isCurrent = index === questionIndex;
                const isAnswered = Boolean(answers[progressQuestion.id]);
                return (
                  <span
                    key={progressQuestion.id}
                    className={`coaching-quiz-progress ${
                      isCurrent ? "is-current" : ""
                    }`}
                    style={{
                      background: isAnswered
                        ? CREAM
                        : "rgba(140,132,128,0.5)",
                    }}
                    aria-hidden="true"
                  />
                );
              })}
            </div>
          </div>
        )}

        {phase === "result" && (
          <CoachingQuizResult result={result} titleId={TITLE_ID} />
        )}

        <span className="sr-only" aria-live="polite">
          {phase === "question"
            ? `Question ${questionIndex + 1} of ${COACHING_QUIZ_QUESTIONS.length}`
            : ""}
        </span>
      </div>
    </div>,
    document.body,
  );
}
