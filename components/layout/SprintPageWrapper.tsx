"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Loader2, CheckCircle2 } from "lucide-react";
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

interface SprintPageWrapperProps {
  sprint: Required<Sprint>;
  skillSlug: string;
}

type EvalState = "running" | "evaluating" | "done" | "error";

export default function SprintPageWrapper({
  sprint,
  skillSlug,
}: SprintPageWrapperProps) {
  const router = useRouter();
  const [evalState, setEvalState] = useState<EvalState>("running");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showExitDialog, setShowExitDialog] = useState(false);

  const handleExitRequest = useCallback(() => {
    // Don't allow exit during evaluation
    if (evalState !== "running") return;
    setShowExitDialog(true);
  }, [evalState]);

  const handleExitConfirm = useCallback(() => {
    setShowExitDialog(false);
    router.push(`/${sprint.mode.toLowerCase()}`);
  }, [router, sprint.mode]);

  const handleComplete = useCallback(
    async (responses: SprintResponse[]) => {
      setEvalState("evaluating");

      try {
        const res = await fetch("/api/evaluate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sprintId: sprint.id,
            responses,
            mode: sprint.mode,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "Evaluation failed");
        }

        const data = await res.json();
        setEvalState("done");

        // Navigate to results
        if (data.attempt?.id) {
          router.push(`/results/${data.attempt.id}`);
        } else {
          router.push(`/${sprint.mode.toLowerCase()}`);
        }
      } catch (error) {
        console.error("Evaluation error:", error);
        setEvalState("error");
        setErrorMsg(
          error instanceof Error ? error.message : "Something went wrong"
        );
      }
    },
    [sprint.id, sprint.mode, router]
  );

  return (
    <div className="flex min-h-screen flex-col">
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
              mode={sprint.mode as "LEARN" | "PRACTICE" | "COMPETE"}
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
              <h2 className="text-lg font-semibold">AI Analyzing Your Responses</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Evaluating across 6 skill dimensions...
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
            <p className="text-sm text-muted-foreground">Redirecting to results...</p>
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
              onClick={() => router.push(`/${sprint.mode.toLowerCase()}`)}
              className="text-sm text-primary hover:underline"
            >
              Back to {sprint.mode.toLowerCase()}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave this sprint?</AlertDialogTitle>
            <AlertDialogDescription>
              Your progress won&apos;t be saved. You can restart this sprint
              anytime.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep going</AlertDialogCancel>
            <AlertDialogAction onClick={handleExitConfirm}>
              Leave sprint
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
