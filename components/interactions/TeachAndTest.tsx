"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { BookOpen, ArrowRight, Lightbulb, Check, GraduationCap } from "lucide-react";
import { SpotTheSignal } from "./SpotTheSignal";
import { ForcedTradeoff } from "./ForcedTradeoff";
import { FillTheGap } from "./FillTheGap";
import type { InteractionOption } from "@/types";

interface TeachAndTestProps {
  id: string;
  prompt: string;
  options: InteractionOption[];
  correctAnswer: string | null;
  insightAnswer: string | null;
  teachingPreamble: string | null;
  timeTarget: number;
  onAnswer: (answer: string) => void;
  disabled?: boolean;
}

const STEPS = [
  { label: "Learn", icon: BookOpen },
  { label: "Quiz", icon: GraduationCap },
];

export function TeachAndTest({
  id,
  prompt,
  options,
  correctAnswer,
  insightAnswer,
  teachingPreamble,
  timeTarget,
  onAnswer,
  disabled = false,
}: TeachAndTestProps) {
  const [phase, setPhase] = useState<"teach" | "test">(
    teachingPreamble ? "teach" : "test"
  );

  const currentStep = phase === "teach" ? 0 : 1;

  const handleGotIt = useCallback(() => {
    setPhase("test");
  }, []);

  // Determine test sub-type based on option count and prompt pattern
  const hasBlank = prompt.includes("____") || prompt.includes("___");
  const isForcedTradeoff = options.length <= 3 && !hasBlank;

  const testProps = {
    id,
    prompt,
    options,
    correctAnswer,
    insightAnswer,
    timeTarget,
    onAnswer,
    disabled,
  };

  return (
    <div className="flex flex-col gap-5 px-4 py-6">
      {/* Step Progress Indicator */}
      {teachingPreamble && (
        <div className="flex items-center justify-center gap-3">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            const isComplete = i < currentStep;
            const isCurrent = i === currentStep;
            return (
              <div key={step.label} className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-300",
                    isComplete && "bg-success/20 text-success",
                    isCurrent && "bg-primary/20 text-primary ring-2 ring-primary/30",
                    !isComplete && !isCurrent && "bg-muted text-muted-foreground"
                  )}
                >
                  {isComplete ? (
                    <Check className="size-3.5" />
                  ) : (
                    <Icon className="size-3.5" />
                  )}
                  {step.label}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={cn(
                    "w-8 h-0.5 rounded-full transition-colors",
                    isComplete ? "bg-success/50" : "bg-border"
                  )} />
                )}
              </div>
            );
          })}
        </div>
      )}

      <AnimatePresence mode="wait">
        {phase === "teach" && teachingPreamble && (
          <motion.div
            key="teach"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="flex flex-col gap-5"
          >
            {/* Teaching Content Card */}
            <div
              className={cn(
                "px-5 py-5 rounded-2xl space-y-4",
                "bg-gradient-to-br from-surface-2 to-surface-1",
                "border border-border/60"
              )}
            >
              {/* KEY CONCEPT badge */}
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md bg-primary/15 text-primary text-[10px] font-bold uppercase tracking-widest">
                  Key Concept
                </span>
              </div>

              {/* Teaching text */}
              <p className="text-base text-foreground leading-relaxed">
                {teachingPreamble}
              </p>

              {/* Insight section */}
              <div className="flex gap-3 pt-3 border-t border-border/40">
                <Lightbulb className="size-4 text-warning flex-shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Read carefully — you&apos;ll be tested on this next!
                </p>
              </div>
            </div>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
            >
              <Button
                onClick={handleGotIt}
                size="lg"
                className="group w-full min-h-[48px] text-base font-semibold gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white border-0"
              >
                Got it! Take me to the Quiz
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </motion.div>
          </motion.div>
        )}

        {phase === "test" && (
          <motion.div
            key="test"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="-mx-4 -my-6"
          >
            {hasBlank ? (
              <FillTheGap {...testProps} />
            ) : isForcedTradeoff ? (
              <ForcedTradeoff {...testProps} />
            ) : (
              <SpotTheSignal {...testProps} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
