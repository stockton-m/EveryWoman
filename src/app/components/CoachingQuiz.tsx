import { useEffect, useRef, useState } from "react";
import { CoachingQuizModal } from "@/app/components/CoachingQuizModal";
import { COACHING_QUIZ_QUESTIONS } from "@/app/content/coachingQuiz";
import {
  type CoachingQuizAnswers,
  scoreCoachingQuiz,
} from "@/app/lib/coachingQuizScoring";
import { CREAM, EMBER, SANS } from "@/app/constants";

export type CoachingQuizPhase = "intro" | "question" | "result";

export function CoachingQuiz() {
  const [isOpen, setIsOpen] = useState(false);
  const [phase, setPhase] = useState<CoachingQuizPhase>("intro");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<CoachingQuizAnswers>({});
  const [animatingAnswerId, setAnimatingAnswerId] = useState<string | null>(
    null,
  );
  const [selectionRun, setSelectionRun] = useState(0);
  const advanceTimerRef = useRef<number | null>(null);

  const clearAdvanceTimer = () => {
    if (advanceTimerRef.current !== null) {
      window.clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
  };

  useEffect(() => clearAdvanceTimer, []);

  const closeQuiz = () => {
    clearAdvanceTimer();
    setAnimatingAnswerId(null);
    setIsOpen(false);
  };

  const selectAnswer = (answerId: string) => {
    if (animatingAnswerId) return;

    const question = COACHING_QUIZ_QUESTIONS[questionIndex];
    setAnswers((current) => ({ ...current, [question.id]: answerId }));
    setAnimatingAnswerId(answerId);
    setSelectionRun((current) => current + 1);

    const delay = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? 300
      : 1250;
    advanceTimerRef.current = window.setTimeout(() => {
      setAnimatingAnswerId(null);
      advanceTimerRef.current = null;

      if (questionIndex === COACHING_QUIZ_QUESTIONS.length - 1) {
        setPhase("result");
      } else {
        setQuestionIndex((current) => current + 1);
      }
    }, delay);
  };

  const goBack = () => {
    clearAdvanceTimer();
    setAnimatingAnswerId(null);

    if (questionIndex === 0) {
      setPhase("intro");
      return;
    }

    setQuestionIndex((current) => current - 1);
  };

  const startOver = () => {
    clearAdvanceTimer();
    setAnswers({});
    setQuestionIndex(0);
    setAnimatingAnswerId(null);
    setSelectionRun((current) => current + 1);
    setPhase("intro");
  };

  const result = scoreCoachingQuiz(answers);

  return (
    <div className="flex justify-center">
      <button
        type="button"
        className="coaching-quiz-trigger pill-btn group"
        onClick={() => setIsOpen(true)}
        style={{ fontFamily: SANS }}
      >
        <span
          className="coaching-quiz-trigger-icon"
          style={{ background: CREAM, color: EMBER }}
          aria-hidden="true"
        >
          <span className="coaching-quiz-trigger-question">?</span>
          <span className="coaching-quiz-trigger-play">▶</span>
        </span>
        <span>Help me choose</span>
      </button>

      <CoachingQuizModal
        isOpen={isOpen}
        phase={phase}
        questionIndex={questionIndex}
        answers={answers}
        animatingAnswerId={animatingAnswerId}
        selectionRun={selectionRun}
        result={result}
        onClose={closeQuiz}
        onStart={() => setPhase("question")}
        onStartOver={startOver}
        onBack={goBack}
        onAnswer={selectAnswer}
      />
    </div>
  );
}
