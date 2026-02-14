"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Loader2, Swords, Clock, AlertCircle } from "lucide-react";
import { SprintRunner } from "@/components/interactions/SprintRunner";
import MatchResult from "@/components/arena/MatchResult";
import { Button } from "@/components/ui/button";
import { SkillIcon } from "@/components/ui/SkillIcon";
import type { SprintResponse } from "@/types";

interface DuelData {
  id: string;
  status: string;
  skillName: string;
  skillSlug: string;
  skillIcon: string | null;
  sprint: {
    id: string;
    title: string;
    description: string | null;
    mode: string;
    difficulty: number;
    interactions: {
      id: string;
      type: string;
      order: number;
      prompt: string;
      options: unknown;
      correctAnswer: string | null;
      insightAnswer: string | null;
      teachingPreamble: string | null;
      priorContext: string | null;
      timeTarget: number;
    }[];
  } | null;
  evaluation: unknown;
  isPlayer1: boolean;
  myAttemptComplete: boolean;
}

interface DuelPageClientProps {
  initialDuel: DuelData;
}

export default function DuelPageClient({ initialDuel }: DuelPageClientProps) {
  const router = useRouter();
  const [duel, setDuel] = useState(initialDuel);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Poll for duel status updates (WAITING / EVALUATING states)
  useEffect(() => {
    if (
      duel.status !== "WAITING" &&
      duel.status !== "EVALUATING" &&
      !(duel.status === "IN_PROGRESS" && duel.myAttemptComplete)
    ) {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/duels/${duel.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.duel) {
            // Preserve original sprint data (includes correctAnswer for feedback)
            // The poll response strips correctAnswer to prevent cheating via
            // network inspection, but we already have it from the initial SSR.
            setDuel((prev) => ({
              ...data.duel,
              sprint: prev.sprint ?? data.duel.sprint,
            }));
          }
        }
      } catch {
        // Silently retry on next interval
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [duel.id, duel.status, duel.myAttemptComplete]);

  const handleSprintComplete = useCallback(
    async (responses: SprintResponse[]) => {
      setSubmitting(true);
      try {
        const res = await fetch("/api/evaluate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sprintId: duel.sprint?.id,
            duelId: duel.id,
            responses,
            mode: "COMPETE",
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "Submission failed");
        }

        const data = await res.json();
        // Update duel status locally
        setDuel((prev) => ({
          ...prev,
          status: "EVALUATING",
          myAttemptComplete: true,
        }));

        // If we got a results redirect
        if (data.attempt?.id) {
          // Stay on duel page for evaluation state, will redirect when complete
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setSubmitting(false);
      }
    },
    [duel.id, duel.sprint?.id]
  );

  return (
    <div className="flex min-h-screen flex-col">
      <AnimatePresence mode="wait">
        {duel.status === "WAITING" && (
          <motion.div
            key="waiting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-1 flex-col items-center justify-center gap-6 p-4"
          >
            <motion.div
              animate={{
                rotate: [0, 10, -10, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: "loop",
              }}
            >
              <Swords className="size-16 text-primary" />
            </motion.div>
            <div className="text-center">
              <h2 className="text-xl font-bold">Waiting for Opponent</h2>
              <p className="mt-2 text-sm text-muted-foreground flex items-center justify-center gap-1">
                <Clock className="size-3" />
                Looking for a worthy challenger...
              </p>
            </div>
            <div className="flex items-center gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                  className="size-2 rounded-full bg-primary"
                />
              ))}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <SkillIcon slug={duel.skillSlug} size="sm" />
              <span>{duel.skillName}</span>
            </div>
          </motion.div>
        )}

        {duel.status === "IN_PROGRESS" && !duel.myAttemptComplete && duel.sprint && (
          <motion.div
            key="in-progress"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1"
          >
            {submitting ? (
              <div className="flex flex-1 min-h-screen flex-col items-center justify-center gap-4 p-4">
                <Loader2 className="size-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  Submitting your responses...
                </p>
              </div>
            ) : (
              <SprintRunner
                sprint={duel.sprint}
                onComplete={handleSprintComplete}
                mode="COMPETE"
              />
            )}
          </motion.div>
        )}

        {duel.status === "IN_PROGRESS" && !duel.myAttemptComplete && !duel.sprint && (
          <motion.div
            key="no-sprint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-1 flex-col items-center justify-center gap-4 p-4"
          >
            <AlertCircle className="size-10 text-muted-foreground" />
            <div className="text-center">
              <h2 className="text-lg font-semibold">Sprint Not Available</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                This duel doesn&apos;t have content loaded. Please create a new duel.
              </p>
            </div>
            <Button variant="outline" onClick={() => router.push("/compete")}>
              Back to Arena
            </Button>
          </motion.div>
        )}

        {duel.status === "IN_PROGRESS" && duel.myAttemptComplete && (
          <motion.div
            key="waiting-opponent"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-1 flex-col items-center justify-center gap-4 p-4"
          >
            <Loader2 className="size-8 animate-spin text-primary" />
            <div className="text-center">
              <h2 className="text-lg font-semibold">Sprint Complete!</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Waiting for your opponent to finish...
              </p>
            </div>
          </motion.div>
        )}

        {duel.status === "EVALUATING" && (
          <motion.div
            key="evaluating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-1 flex-col items-center justify-center gap-4 p-4"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              <Loader2 className="size-10 text-primary" />
            </motion.div>
            <div className="text-center">
              <h2 className="text-lg font-semibold">
                AI Evaluating Both Players
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Comparing responses across 6 skill dimensions...
              </p>
            </div>
          </motion.div>
        )}

        {duel.status === "COMPLETED" && !!duel.evaluation && (
          <motion.div
            key="completed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 p-4 max-w-lg mx-auto"
          >
            {(() => {
              const evalData = duel.evaluation as {
                player1Scores?: Record<string, number>;
                player2Scores?: Record<string, number>;
                player1Name?: string;
                player2Name?: string;
                winnerId?: string;
                dimensionWinners?: Record<string, string>;
                eloChange?: number;
                analysis?: string;
              };

              // Remap so current user always appears as "me" (violet / left)
              const iAmPlayer1 = duel.isPlayer1;
              const myName = iAmPlayer1
                ? (evalData.player1Name ?? "You")
                : (evalData.player2Name ?? "You");
              const opponentName = iAmPlayer1
                ? (evalData.player2Name ?? "Opponent")
                : (evalData.player1Name ?? "Opponent");
              const myScores = iAmPlayer1
                ? (evalData.player1Scores ?? {})
                : (evalData.player2Scores ?? {});
              const opponentScores = iAmPlayer1
                ? (evalData.player2Scores ?? {})
                : (evalData.player1Scores ?? {});
              const iWon = iAmPlayer1
                ? evalData.winnerId === "player1"
                : evalData.winnerId === "player2";

              // Remap dimension winners to use display names
              const remappedDimWinners: Record<string, string> = {};
              for (const [key, winner] of Object.entries(evalData.dimensionWinners ?? {})) {
                // dimensionWinners are stored as player names by the API
                const origP1Name = evalData.player1Name ?? "Player 1";
                const isP1Win = winner === origP1Name;
                remappedDimWinners[key] = (iAmPlayer1 ? isP1Win : !isP1Win)
                  ? myName
                  : opponentName;
              }

              // Replace generic player references in AI analysis with actual names
              let analysis = evalData.analysis ?? "";
              const p1Name = evalData.player1Name ?? "Player 1";
              const p2Name = evalData.player2Name ?? "Player 2";
              analysis = analysis
                .replace(/\bplayer\s*1\b/gi, p1Name)
                .replace(/\bplayer\s*2\b/gi, p2Name);

              return (
                <MatchResult
                  player1={{
                    name: myName,
                    scores: myScores,
                    isWinner: iWon,
                  }}
                  player2={{
                    name: opponentName,
                    scores: opponentScores,
                    isWinner: !iWon,
                  }}
                  dimensionWinners={remappedDimWinners}
                  eloChange={evalData.eloChange ?? 0}
                  analysis={analysis}
                />
              );
            })()}
            <div className="mt-6 flex justify-center">
              <Button
                variant="outline"
                onClick={() => router.push("/compete")}
              >
                Back to Compete
              </Button>
            </div>
          </motion.div>
        )}

        {(duel.status === "CANCELLED" || duel.status === "FORFEIT") && (
          <motion.div
            key="cancelled"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-1 flex-col items-center justify-center gap-4 p-4"
          >
            <AlertCircle className="size-10 text-muted-foreground" />
            <div className="text-center">
              <h2 className="text-lg font-semibold">Duel Ended</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                This duel was{" "}
                {duel.status === "CANCELLED" ? "cancelled" : "forfeited"}.
              </p>
            </div>
            <Button variant="outline" onClick={() => router.push("/compete")}>
              Back to Compete
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error overlay */}
      {error && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4">
          <div className="rounded-xl border border-destructive/50 bg-card p-6 text-center max-w-sm">
            <AlertCircle className="mx-auto size-8 text-destructive mb-3" />
            <p className="text-sm font-medium">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => setError(null)}
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
