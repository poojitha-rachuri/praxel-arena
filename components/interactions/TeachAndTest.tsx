"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, ArrowRight } from "lucide-react";
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
    <div className="flex flex-col gap-6 px-4 py-6">
      <AnimatePresence mode="wait">
        {phase === "teach" && teachingPreamble && (
          <motion.div
            key="teach"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="flex flex-col gap-6"
          >
            {/* Badge */}
            <Badge variant="secondary" className="self-start text-xs gap-1.5">
              <BookOpen className="size-3" />
              Learn
            </Badge>

            {/* Teaching Content */}
            <div
              className={cn(
                "px-5 py-5 rounded-2xl",
                "bg-gradient-to-br from-primary/5 to-primary/10",
                "border border-primary/20"
              )}
            >
              <p className="text-base text-foreground leading-relaxed">
                {teachingPreamble}
              </p>
            </div>

            {/* Got It Button */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
            >
              <Button
                onClick={handleGotIt}
                size="lg"
                className="w-full min-h-[44px] text-base font-semibold gap-2"
              >
                Got it
                <ArrowRight className="size-4" />
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
