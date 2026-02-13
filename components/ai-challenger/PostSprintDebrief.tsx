"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Brain, ChevronRight } from "lucide-react";
import { AIChallenger } from "./AIChallenger";
import { CARD_SPRING } from "@/lib/utils/constants";

interface PostSprintDebriefProps {
  attemptId: string;
}

export function PostSprintDebrief({ attemptId }: PostSprintDebriefProps) {
  const [state, setState] = useState<"cta" | "active" | "done">("cta");

  return (
    <AnimatePresence mode="wait">
      {state === "cta" && (
        <motion.div
          key="cta"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ type: "spring", ...CARD_SPRING }}
          className="rounded-2xl border border-primary/20 bg-primary/5 p-4"
        >
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Brain className="size-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-foreground">
                Want AI to challenge your thinking?
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                A 90-second AI debrief on your weakest answers. Sharpen your
                reasoning.
              </p>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => setState("active")}
              className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors min-h-[44px]"
            >
              Challenge My Thinking
              <ChevronRight className="size-4" />
            </button>
            <button
              onClick={() => setState("done")}
              className="rounded-xl px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors min-h-[44px]"
            >
              Skip
            </button>
          </div>
        </motion.div>
      )}

      {state === "active" && (
        <motion.div
          key="active"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ type: "spring", ...CARD_SPRING }}
        >
          <AIChallenger
            context={{ type: "post-sprint", attemptId }}
            onClose={() => setState("done")}
          />
        </motion.div>
      )}

      {/* When done or skipped, render nothing  -  the results page CTAs are below */}
    </AnimatePresence>
  );
}
