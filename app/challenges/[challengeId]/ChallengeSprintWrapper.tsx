"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Loader2, CheckCircle2, Timer, Target } from "lucide-react";
import { SprintRunner } from "@/components/interactions/SprintRunner";
import type { Sprint } from "@/components/interactions/SprintRunner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { SprintResponse } from "@/types";
import { trackEvent } from "@/lib/analytics";

interface ChallengeSprintWrapperProps {
  sprint: Required<Sprint>;
  skillSlug: string;
  challengeId: string;
  challengeName: string;
  challengeType: "SPEED_ROUND" | "SCORE_ATTACK";
}

type EvalState = "running" | "evaluating" | "done" | "error";

export default function ChallengeSprintWrapper({
  sprint,
  skillSlug,
  challengeId,
  challengeName,
  challengeType,
}: ChallengeSprintWrapperProps) {
  const router = useRouter();
  const [evalState, setEvalState] = useState<EvalState>("running");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const sprintStartRef = useRef<number>(Date.now());

  useEffect(() => {
    trackEvent("challenge_sprint_started", {
      challengeId,
      challengeName,
      challengeType,
      sprintId: sprint.id,
      skillSlug,
    });
  }, [challengeId, challengeName, challengeType, sprint.id, skillSlug]);

  const handleExitRequest = useCallback(() => {
    if (evalState !== "running") return;
    setShowExitDialog(true);
  }, [evalState]);

  const handleExitConfirm = useCallback(() => {
    trackEvent("challenge_sprint_abandoned", {
      challengeId,
      sprintId: sprint.id,
      timeSpent: Math.round((Date.now() - sprintStartRef.current) / 1000),
    });
    setShowExitDialog(false);
    router.push("/challenges");
  }, [router, challengeId, sprint.id]);

  const handleComplete = useCallback(
    async (responses: SprintResponse[]) => {
      setEvalState("evaluating");
      const timeSpentMs = Date.now() - sprintStartRef.current;

      try {
        // Step 1: Evaluate the sprint (same as normal flow)
        const evalRes = await fetch("/api/evaluate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sprintId: sprint.id,
            responses,
            mode: sprint.mode,
          }),
        });

        if (!evalRes.ok) {
          const data = await evalRes.json().catch(() => ({}));
          throw new Error(data.error ?? "Evaluation failed");
        }

        const evalData = await evalRes.json();
        const totalScore = evalData.attempt?.totalScore ?? 0;

        // Derive accuracy from the totalScore (0-100 scale → 0-1)
        const accuracy = Math.min(1, Math.max(0, totalScore / 100));

        // Step 2: Submit challenge attempt
        try {
          await fetch(`/api/challenges/${challengeId}/attempt`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              score: totalScore,
              timeSpentMs,
              accuracy,
              sprintId: sprint.id,
            }),
          });
        } catch {
          // Challenge attempt submission is non-critical
          console.error("Failed to submit challenge attempt");
        }

        trackEvent("challenge_sprint_completed", {
          challengeId,
          sprintId: sprint.id,
          totalScore,
          accuracy,
          timeSpentMs,
        });

        setEvalState("done");

        if (evalData.attempt?.id) {
          router.push(`/results/${evalData.attempt.id}`);
        } else {
          router.push("/challenges");
        }
      } catch (error) {
        console.error("Challenge evaluation error:", error);
        setEvalState("error");
        setErrorMsg(
          error instanceof Error ? error.message : "Something went wrong"
        );
      }
    },
    [sprint.id, sprint.mode, router, challengeId]
  );

  return (
    <div className="flex min-h-screen flex-col">
      {/* Challenge banner at top */}
      {evalState === "running" && (
        <div className="flex items-center justify-center gap-2 bg-primary/10 px-4 py-1.5">
          {challengeType === "SPEED_ROUND" ? (
            <Timer className="size-3.5 text-amber-400" />
          ) : (
            <Target className="size-3.5 text-cyan-400" />
          )}
          <span className="text-xs font-semibold text-primary">
            {challengeName}
          </span>
        </div>
      )}

      <AnimatePresence mode="wait">
        {evalState === "running" && (
          <motion.div
            key="runner"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1"
          >
            <SprintRunner
              sprint={sprint}
              onComplete={handleComplete}
              mode="PRACTICE"
              onExit={handleExitRequest}
              exitPending={showExitDialog}
            />
          </motion.div>
        )}

        {evalState === "evaluating" && (
          <motion.div
            key="evaluating"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-1 flex-col items-center justify-center gap-4 p-4"
          >
            <Loader2 className="size-8 animate-spin text-primary" />
            <div className="text-center">
              <h2 className="text-lg font-semibold">Evaluating Challenge</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Scoring your performance across 6 dimensions...
              </p>
            </div>
          </motion.div>
        )}

        {evalState === "done" && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-1 flex-col items-center justify-center gap-4 p-4"
          >
            <CheckCircle2 className="size-8 text-green-500" />
            <p className="text-sm text-muted-foreground">
              Redirecting to results...
            </p>
          </motion.div>
        )}

        {evalState === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-1 flex-col items-center justify-center gap-4 p-4"
          >
            <div className="text-center">
              <h2 className="text-lg font-semibold text-destructive">
                Evaluation Failed
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {errorMsg ?? "Something went wrong. Please try again."}
              </p>
            </div>
            <button
              onClick={() => router.push("/challenges")}
              className="text-sm text-primary hover:underline"
            >
              Back to Challenges
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave this challenge?</AlertDialogTitle>
            <AlertDialogDescription>
              Your progress won&apos;t be saved. You can retry this challenge
              anytime before it ends.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep going</AlertDialogCancel>
            <AlertDialogAction onClick={handleExitConfirm}>
              Leave challenge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
