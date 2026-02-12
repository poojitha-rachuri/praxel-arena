"use client";

import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { AnimatePresence } from "motion/react";
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
import type { SprintResponse, InteractionOption } from "@/types";

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

export function SprintRunner({ sprint, onComplete, mode }: SprintRunnerProps) {
  // Sort interactions by order
  const sortedInteractions = useMemo(
    () => [...sprint.interactions].sort((a, b) => a.order - b.order),
    [sprint.interactions]
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<SprintResponse[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const [streak, setStreak] = useState(0);
  const streakRef = useRef(0);

  // Track when each card starts
  const cardStartTimeRef = useRef<number>(Date.now());
  const sprintStartTimeRef = useRef<number>(Date.now());
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const submittedRef = useRef(false);

  const { onCorrect } = useCelebration();

  // Clear feedback timer on unmount
  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    };
  }, []);

  const currentInteraction = sortedInteractions[currentIndex] ?? null;
  const totalInteractions = sortedInteractions.length;

  const handleAnswer = useCallback(
    (answer: string) => {
      if (!currentInteraction) return;
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

      const updatedResponses = [...responses, newResponse];
      setResponses(updatedResponses);

      // After feedback delay, advance or complete
      const feedbackDelay = 400;
      feedbackTimerRef.current = setTimeout(() => {
        setShowFeedback(false);
        setLastCorrect(null);
        submittedRef.current = false;

        if (currentIndex + 1 >= totalInteractions) {
          // Sprint complete
          onComplete(updatedResponses);
        } else {
          // Next card
          setCurrentIndex((prev) => prev + 1);
          cardStartTimeRef.current = Date.now();
        }
      }, feedbackDelay);
    },
    [currentInteraction, currentIndex, totalInteractions, responses, onComplete, onCorrect]
  );

  if (!currentInteraction) {
    return null;
  }

  const options = parseOptions(currentInteraction.options);

  // Resolve insightAnswer: if it's just an option ID (e.g. "a"), show that option's text instead
  const resolvedInsight = useMemo(() => {
    const raw = currentInteraction.insightAnswer;
    if (!raw) return null;
    // If it's a single option ID or a comma-separated ranking (e.g. "b,a,d,c"), resolve to option text
    if (/^[a-d]$/.test(raw)) {
      const match = options.find((o) => o.id === raw);
      return match ? match.text : raw;
    }
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
  }, [currentInteraction.insightAnswer, options]);

  // Shared props for all interaction types
  const sharedProps = {
    id: currentInteraction.id,
    prompt: currentInteraction.prompt,
    options,
    correctAnswer: currentInteraction.correctAnswer,
    insightAnswer: resolvedInsight,
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
    </div>
  );
}
