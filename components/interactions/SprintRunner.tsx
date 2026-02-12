"use client";

import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { InteractionCard } from "./InteractionCard";
import { SpotTheSignal } from "./SpotTheSignal";
import { ForcedTradeoff } from "./ForcedTradeoff";
import { FillTheGap } from "./FillTheGap";
import { RankAndPrioritize } from "./RankAndPrioritize";
import { Curveball } from "./Curveball";
import { TeachAndTest } from "./TeachAndTest";
import { ProgressBar } from "./ProgressBar";
import { StreakBadge } from "@/components/gamification/StreakBadge";
import { useCelebration } from "@/lib/hooks/use-celebration";
import { calculateFeedbackDuration } from "@/lib/utils/feedback-timing";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import type { SprintResponse, InteractionOption } from "@/types";
import { trackEvent } from "@/lib/analytics";

// ─── Types ──────────────────────────────────────────────

type InteractionType =
  | "SPOT_THE_SIGNAL"
  | "FORCED_TRADEOFF"
  | "FILL_THE_GAP"
  | "RANK_AND_PRIORITIZE"
  | "CURVEBALL"
  | "TEACH_AND_TEST";

export interface Interaction {
  id: string;
  type: string; // Prisma stores as String; validated at render time via switch-like conditionals
  order: number;
  prompt: string;
  options: unknown;
  correctAnswer: string | null;
  insightAnswer: string | null;
  teachingPreamble: string | null;
  priorContext: string | null;
  timeTarget: number;
}

export interface Sprint {
  id: string;
  title?: string;
  description?: string | null;
  mode?: string;
  difficulty?: number;
  interactions: Interaction[];
}

interface SprintRunnerProps {
  sprint: Sprint;
  onComplete: (responses: SprintResponse[]) => void;
  mode: "LEARN" | "PRACTICE" | "COMPETE";
  onExit?: () => void;
  exitPending?: boolean;
}

// ─── Helper: parse options from DB JSON ─────────────────

function parseOptions(raw: InteractionOption[] | unknown): InteractionOption[] {
  if (Array.isArray(raw)) {
    return raw.map((item: Record<string, unknown>) => ({
      id: String(item.id ?? ""),
      text: String(item.text ?? ""),
      isCorrect: item.isCorrect === true ? true : undefined,
    }));
  }
  return [];
}

// ─── Sprint Runner ──────────────────────────────────────

export function SprintRunner({ sprint, onComplete, mode, onExit, exitPending }: SprintRunnerProps) {
  // Sort interactions by order
  const sortedInteractions = useMemo(
    () => [...sprint.interactions].sort((a, b) => a.order - b.order),
    [sprint.interactions]
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<SprintResponse[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const [waitingForContinue, setWaitingForContinue] = useState(false);
  const [streak, setStreak] = useState(0);
  const streakRef = useRef(0);

  // Track when each card starts
  const cardStartTimeRef = useRef<number>(Date.now());
  const sprintStartTimeRef = useRef<number>(Date.now());
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const submittedRef = useRef(false);
  const advancingRef = useRef(false);
  // Store latest responses in a ref for use in advance() without stale closures
  const responsesRef = useRef<SprintResponse[]>([]);

  const { onCorrect } = useCelebration();

  // Clear feedback timer on unmount + pause on tab hide
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && feedbackTimerRef.current) {
        // Pause: clear timer but keep feedback visible — user will see Continue or timer resumes on return
        clearTimeout(feedbackTimerRef.current);
        feedbackTimerRef.current = undefined;
        // Switch to manual continue so feedback doesn't vanish when user returns
        setWaitingForContinue(true);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    };
  }, []);

  const currentInteraction = sortedInteractions[currentIndex] ?? null;
  const totalInteractions = sortedInteractions.length;

  /** Advance to next card or complete sprint — guarded against double-fire from Continue + auto-advance race */
  const advance = useCallback(() => {
    if (advancingRef.current) return;
    // Block timer-driven advance while exit dialog is open
    if (exitPending) return;
    advancingRef.current = true;

    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = undefined;
    }
    setShowFeedback(false);
    setLastCorrect(null);
    setWaitingForContinue(false);
    submittedRef.current = false;

    const latest = responsesRef.current;
    if (currentIndex + 1 >= totalInteractions) {
      onComplete(latest);
    } else {
      setCurrentIndex((prev) => prev + 1);
      cardStartTimeRef.current = Date.now();
      advancingRef.current = false;
    }
  }, [currentIndex, totalInteractions, onComplete, exitPending]);

  const handleAnswer = useCallback(
    (answer: string) => {
      if (!currentInteraction) return;
      // Guard: prevent answer while exit dialog is open
      if (exitPending) return;
      // Double-tap guard: prevent submitting twice for same interaction
      if (submittedRef.current) return;
      submittedRef.current = true;

      const now = Date.now();
      const timeSpent = parseFloat(
        ((now - cardStartTimeRef.current) / 1000).toFixed(1)
      );

      // Check correctness for feedback overlay
      const isCorrect =
        currentInteraction.correctAnswer != null
          ? answer === currentInteraction.correctAnswer
          : null;

      // For RANK_AND_PRIORITIZE, compare the full answer string
      const isRankCorrect =
        currentInteraction.type === "RANK_AND_PRIORITIZE" &&
        currentInteraction.correctAnswer != null
          ? answer === currentInteraction.correctAnswer
          : isCorrect;

      const finalCorrect =
        currentInteraction.type === "RANK_AND_PRIORITIZE"
          ? isRankCorrect
          : isCorrect;

      setLastCorrect(finalCorrect);
      setShowFeedback(true);

      // Streak tracking + celebration (use ref to avoid stale closure)
      if (finalCorrect === true) {
        const newStreak = streakRef.current + 1;
        streakRef.current = newStreak;
        setStreak(newStreak);
        onCorrect(newStreak);
      } else if (finalCorrect === false) {
        streakRef.current = 0;
        setStreak(0);
      }

      const newResponse: SprintResponse = {
        interactionId: currentInteraction.id,
        answer,
        timeSpent,
      };

      const updatedResponses = [...responsesRef.current, newResponse];
      setResponses(updatedResponses);
      responsesRef.current = updatedResponses;

      trackEvent("interaction_answered", {
        type: currentInteraction.type,
        timeSpent,
        isCorrect: finalCorrect,
        cardIndex: currentIndex,
        totalCards: totalInteractions,
      });

      // Mode-dependent feedback timing
      const insightText = currentInteraction.insightAnswer;
      const feedbackDuration = calculateFeedbackDuration(insightText, mode);

      if (feedbackDuration === null) {
        // LEARN mode: show Continue button, no auto-advance
        setWaitingForContinue(true);
      } else {
        // PRACTICE / COMPETE: auto-advance after calculated duration
        setWaitingForContinue(false);
        feedbackTimerRef.current = setTimeout(advance, feedbackDuration);
      }
    },
    [currentInteraction, exitPending, onCorrect, mode, advance]
  );

  if (!currentInteraction) {
    return null;
  }

  const options = parseOptions(currentInteraction.options);

  // Resolve insightAnswer: suppress when it's just the correctAnswer ID (adds no value),
  // resolve ranking IDs to option text, pass through real insight strings
  const resolvedInsight = useMemo(() => {
    const raw = currentInteraction.insightAnswer;
    if (!raw) return null;
    // If insight is a single option ID that matches correctAnswer, suppress it —
    // the correct option is already highlighted, repeating it as "Key Insight" is noise
    if (/^[a-d]$/.test(raw)) {
      if (raw === currentInteraction.correctAnswer) return null;
      const match = options.find((o) => o.id === raw);
      return match ? match.text : raw;
    }
    // For rankings (e.g. "b,a,d,c"), resolve to option text chain
    if (/^[a-d](,[a-d]){1,}$/.test(raw)) {
      return raw
        .split(",")
        .map((id) => {
          const match = options.find((o) => o.id === id.trim());
          return match ? match.text : id;
        })
        .join(" → ");
    }
    return raw;
  }, [currentInteraction.insightAnswer, currentInteraction.correctAnswer, options]);

  // In COMPETE mode, hide insight text (just show correct/incorrect flash)
  const displayInsight = mode === "COMPETE" ? null : resolvedInsight;

  // Shared props for all interaction types
  const sharedProps = {
    id: currentInteraction.id,
    prompt: currentInteraction.prompt,
    options,
    correctAnswer: currentInteraction.correctAnswer,
    insightAnswer: displayInsight,
    timeTarget: currentInteraction.timeTarget,
    onAnswer: handleAnswer,
  };

  return (
    <div className="flex flex-col w-full max-w-lg mx-auto">
      {/* Progress Bar */}
      <ProgressBar
        currentIndex={currentIndex}
        totalInteractions={totalInteractions}
        startTime={sprintStartTimeRef.current}
        mode={mode}
        onExit={onExit}
      />

      {/* Streak Badge */}
      <StreakBadge streak={streak} />

      {/* Interaction Card with transitions */}
      <AnimatePresence mode="wait">
        <InteractionCard
          key={currentInteraction.id}
          cardKey={currentInteraction.id}
          showFeedback={showFeedback}
          isCorrect={lastCorrect}
        >
          {currentInteraction.type === "SPOT_THE_SIGNAL" && (
            <SpotTheSignal {...sharedProps} />
          )}

          {currentInteraction.type === "FORCED_TRADEOFF" && (
            <ForcedTradeoff {...sharedProps} />
          )}

          {currentInteraction.type === "FILL_THE_GAP" && (
            <FillTheGap {...sharedProps} />
          )}

          {currentInteraction.type === "RANK_AND_PRIORITIZE" && (
            <RankAndPrioritize {...sharedProps} />
          )}

          {currentInteraction.type === "CURVEBALL" && (
            <Curveball
              {...sharedProps}
              priorContext={currentInteraction.priorContext}
            />
          )}

          {currentInteraction.type === "TEACH_AND_TEST" && (
            <TeachAndTest
              {...sharedProps}
              teachingPreamble={currentInteraction.teachingPreamble}
            />
          )}
        </InteractionCard>
      </AnimatePresence>

      {/* Continue Button — visible in LEARN mode (manual advance) and PRACTICE mode (tap to skip timer) */}
      <AnimatePresence>
        {showFeedback && (waitingForContinue || mode === "PRACTICE") && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="mt-4 px-4"
          >
            <button
              onClick={advance}
              className={cn(
                "w-full min-h-[48px] rounded-xl text-base font-semibold",
                "flex items-center justify-center gap-2 transition-colors",
                "active:scale-[0.98] touch-manipulation",
                lastCorrect === true
                  ? "bg-success text-success-foreground"
                  : lastCorrect === false
                  ? "bg-danger text-danger-foreground"
                  : "bg-primary text-primary-foreground"
              )}
            >
              Continue
              <ArrowRight className="size-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
