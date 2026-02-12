"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "motion/react";
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import RadarChart from "@/components/skill-graph/RadarChart";
import InteractionReview from "@/components/results/InteractionReview";
import ScoringExplainer from "@/components/results/ScoringExplainer";
import { Button } from "@/components/ui/button";
import { CARD_SPRING, SCORE_COUNT_DURATION } from "@/lib/utils/constants";
import { SCORING_DIMENSIONS } from "@/lib/scoring/dimensions";
import { useCelebration } from "@/lib/hooks/use-celebration";
import type { DimensionScores, EnrichedResponse } from "@/types";
import { cn } from "@/lib/utils";

interface ResultsRevealProps {
  attemptId: string;
  totalScore: number;
  scores: DimensionScores;
  feedback: string | null;
  highlights: string[];
  improvements: string[];
  enrichedResponses?: EnrichedResponse[] | null;
  sprintTitle: string;
  skillName: string;
  skillSlug: string;
  mode: string;
}

function AnimatedNumber({
  target,
  delay = 0,
}: {
  target: number;
  delay?: number;
}) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let controls: { stop: () => void } | undefined;
    const timeout = setTimeout(() => {
      controls = animate(count, target, {
        duration: SCORE_COUNT_DURATION,
        ease: "easeOut",
      });
    }, delay * 1000);

    return () => {
      clearTimeout(timeout);
      controls?.stop();
    };
  }, [count, target, delay]);

  useEffect(() => {
    const unsubscribe = rounded.on("change", (v) => setDisplay(v));
    return () => unsubscribe();
  }, [rounded]);

  return <span>{display}</span>;
}

export default function ResultsReveal({
  attemptId,
  totalScore,
  scores,
  feedback,
  highlights,
  improvements,
  enrichedResponses,
  sprintTitle,
  skillName,
  skillSlug,
  mode,
}: ResultsRevealProps) {
  const router = useRouter();
  const [showChart, setShowChart] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const { onSprintComplete } = useCelebration();
  const celebratedRef = useRef(false);

  useEffect(() => {
    const chartTimer = setTimeout(() => setShowChart(true), 800);
    const detailsTimer = setTimeout(() => setShowDetails(true), 2000);

    // Fire celebration confetti after score count-up (once only)
    let celebrationTimer: ReturnType<typeof setTimeout> | undefined;
    if (!celebratedRef.current) {
      celebratedRef.current = true;
      celebrationTimer = setTimeout(() => {
        onSprintComplete(totalScore);
      }, 1200);
    }

    return () => {
      clearTimeout(chartTimer);
      clearTimeout(detailsTimer);
      if (celebrationTimer) clearTimeout(celebrationTimer);
    };
  }, [onSprintComplete, totalScore]);

  // Fallback: derive from dimension scores when backend highlights are empty
  const displayHighlights =
    highlights.length > 0
      ? highlights
      : [...SCORING_DIMENSIONS]
          .sort((a, b) => (scores[b.key] ?? 0) - (scores[a.key] ?? 0))
          .slice(0, 2)
          .filter((d) => (scores[d.key] ?? 0) >= 50)
          .map((d) => `Strong ${d.label}`);
  const displayImprovements =
    improvements.length > 0
      ? improvements
      : [...SCORING_DIMENSIONS]
          .sort((a, b) => (scores[a.key] ?? 0) - (scores[b.key] ?? 0))
          .slice(0, 2)
          .filter((d) => (scores[d.key] ?? 0) < 70)
          .map((d) => `Focus on ${d.label}`);

  const scoreColor =
    totalScore >= 80
      ? "text-success"
      : totalScore >= 60
        ? "text-warning"
        : totalScore >= 40
          ? "text-warning"
          : "text-danger";

  return (
    <div className="mx-auto w-full max-w-lg p-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-2 text-center"
      >
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          {mode} Sprint Results
        </p>
        <p className="text-sm text-muted-foreground mt-0.5">
          {skillName} &middot; {sprintTitle}
        </p>
      </motion.div>

      {/* Big Score */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          type: "spring",
          stiffness: CARD_SPRING.stiffness,
          damping: CARD_SPRING.damping,
          delay: 0.2,
        }}
        className="mb-6 flex flex-col items-center"
      >
        <div className="relative">
          <div
            className={cn(
              "text-7xl font-bold tabular-nums tracking-tighter",
              scoreColor
            )}
          >
            <AnimatedNumber target={totalScore} delay={0.3} />
          </div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1.2 }}
            className="absolute -top-2 -right-6"
          >
            <Trophy className="size-6 text-yellow-500" />
          </motion.div>
        </div>
        <p className="text-sm text-muted-foreground mt-1">out of 100</p>
      </motion.div>

      {/* Radar Chart */}
      <AnimatePresence>
        {showChart && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              type: "spring",
              stiffness: CARD_SPRING.stiffness,
              damping: CARD_SPRING.damping,
            }}
            className="mb-6 flex justify-center"
          >
            <RadarChart scores={scores} size={280} animated />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dimension Scores */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: CARD_SPRING.stiffness,
              damping: CARD_SPRING.damping,
            }}
            className="flex flex-col gap-4"
          >
            {/* Dimension Bars */}
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">Skill Breakdown</h3>
                <ScoringExplainer />
              </div>
              <div className="flex flex-col gap-2.5">
                {SCORING_DIMENSIONS.map((dim, index) => {
                  const score = scores[dim.key] ?? 0;
                  return (
                    <motion.div
                      key={dim.key}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 2 + index * 0.1 }}
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">
                          {dim.label}
                        </span>
                        <span className="font-medium tabular-nums">
                          <AnimatedNumber
                            target={score}
                            delay={2 + index * 0.1}
                          />
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${score}%` }}
                          transition={{
                            duration: 0.8,
                            delay: 2 + index * 0.1,
                            ease: "easeOut",
                          }}
                          className={cn(
                            "h-full rounded-full",
                            score >= 70
                              ? "bg-success"
                              : score >= 50
                                ? "bg-warning"
                                : "bg-danger"
                          )}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Highlights + Improvements */}
            <div className="grid grid-cols-2 gap-3">
              {displayHighlights.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 2.8 }}
                  className="rounded-xl border border-success/20 bg-success/5 p-3"
                >
                  <h4 className="flex items-center gap-1 text-xs font-semibold text-success mb-2">
                    <TrendingUp className="size-3" />
                    Strengths
                  </h4>
                  <div className="flex flex-col gap-1.5">
                    {displayHighlights.map((text, i) => (
                      <p key={i} className="text-xs text-muted-foreground">
                        {text}
                      </p>
                    ))}
                  </div>
                </motion.div>
              )}

              {displayImprovements.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 3 }}
                  className="rounded-xl border border-warning/20 bg-warning/5 p-3"
                >
                  <h4 className="flex items-center gap-1 text-xs font-semibold text-warning mb-2">
                    <TrendingDown className="size-3" />
                    To Improve
                  </h4>
                  <div className="flex flex-col gap-1.5">
                    {displayImprovements.map((text, i) => (
                      <p key={i} className="text-xs text-muted-foreground">
                        {text}
                      </p>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* AI Feedback */}
            {feedback && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 3.2 }}
                className="rounded-xl border border-border bg-card p-4"
              >
                <h3 className="flex items-center gap-1.5 text-sm font-semibold mb-2">
                  <Sparkles className="size-4 text-primary" />
                  AI Debrief
                </h3>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {feedback}
                </p>
              </motion.div>
            )}

            {/* Per-Interaction Review */}
            {enrichedResponses && enrichedResponses.length > 0 ? (
              <InteractionReview responses={enrichedResponses} />
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 3.4 }}
                className="rounded-xl border border-border bg-card p-4 text-center"
              >
                <p className="text-xs text-muted-foreground">
                  Detailed answer review is not available for this attempt.
                </p>
              </motion.div>
            )}

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 3.6 }}
              className="flex flex-col gap-2 sm:flex-row sm:justify-center"
            >
              <Button
                onClick={() =>
                  router.push(
                    `/${mode.toLowerCase()}?skill=${skillSlug}`
                  )
                }
                className="gap-2"
              >
                Continue
                <ArrowRight className="size-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/profile")}
              >
                View Profile
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
