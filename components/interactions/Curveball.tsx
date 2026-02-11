"use client";

import { useState, useCallback } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { AlertTriangle, Lightbulb } from "lucide-react";
import type { InteractionOption } from "@/types";
import { renderBoldPrompt } from "@/lib/utils/safe-html";

interface CurveballProps {
  id: string;
  prompt: string;
  options: InteractionOption[];
  correctAnswer: string | null;
  insightAnswer: string | null;
  priorContext: string | null;
  timeTarget: number;
  onAnswer: (answer: string) => void;
  disabled?: boolean;
}

export function Curveball({
  prompt,
  options,
  correctAnswer,
  insightAnswer,
  priorContext,
  onAnswer,
  disabled = false,
}: CurveballProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);

  const handleSelect = useCallback(
    (optionId: string) => {
      if (selected || disabled) return;
      setSelected(optionId);
      setRevealed(true);

      setTimeout(() => {
        onAnswer(optionId);
      }, 1000);
    },
    [selected, disabled, onAnswer]
  );

  return (
    <div className="flex flex-col gap-6 px-4 py-6">
      {/* Warning Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className="flex items-start gap-3 px-4 py-3 rounded-xl bg-warning/10 border-2 border-warning/30"
      >
        <AlertTriangle className="size-5 text-warning flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-warning">CURVEBALL</p>
          {priorContext && (
            <p className="text-xs text-warning/70 mt-1 leading-relaxed">
              {priorContext}
            </p>
          )}
        </div>
      </motion.div>

      {/* Type badge (kept subtle since warning banner is prominent) */}

      {/* Prompt */}
      <div className="space-y-2">
        <p className="text-lg font-medium text-foreground leading-relaxed">
          {renderBoldPrompt(prompt)}
        </p>
      </div>

      {/* Option Cards */}
      <div className="flex flex-col gap-3 mt-1">
        {options.map((option, index) => {
          const isSelected = selected === option.id;
          const isCorrectOption = correctAnswer === option.id;
          const isBestAnswer = revealed && isCorrectOption;
          const isSelectedWrong = revealed && isSelected && !isCorrectOption;

          const parts = option.text.match(/^(.+?)(?:\s[-:]\s)(.+)$/);
          const title = parts ? parts[1] : option.text;
          const description = parts ? parts[2] : null;

          return (
            <motion.button
              key={option.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.06, duration: 0.25 }}
              onClick={() => handleSelect(option.id)}
              disabled={!!selected || disabled}
              className={cn(
                "relative w-full min-h-[56px] pl-5 pr-4 py-4 rounded-xl text-left overflow-hidden",
                "border transition-all duration-200",
                "active:scale-[0.98] touch-manipulation",
                !selected &&
                  "border-border/60 bg-surface-2/80 text-card-foreground hover:border-border hover:bg-surface-3/60",
                isBestAnswer &&
                  "border-success/50 bg-success/10 ring-1 ring-success/30",
                isSelectedWrong &&
                  "border-warning/50 bg-warning/10",
                revealed &&
                  !isSelected &&
                  !isCorrectOption &&
                  "border-border/30 bg-card/30 opacity-50",
                (!!selected || disabled) && "cursor-default"
              )}
            >
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mt-0.5",
                    !selected && "bg-warning/10 text-warning",
                    isBestAnswer && "bg-success/20 text-success",
                    isSelectedWrong && "bg-warning/20 text-warning",
                    revealed &&
                      !isSelected &&
                      !isCorrectOption &&
                      "bg-muted/50 text-muted-foreground/50"
                  )}
                >
                  {String.fromCharCode(65 + index)}
                </span>
                <div className="flex-1 min-w-0">
                  <span
                    className={cn(
                      "block text-sm font-semibold leading-snug",
                      isBestAnswer && "text-success",
                      isSelectedWrong && "text-warning",
                      revealed &&
                        !isSelected &&
                        !isCorrectOption &&
                        "text-muted-foreground"
                    )}
                  >
                    {title}
                  </span>
                  {description && (
                    <span
                      className={cn(
                        "block text-xs mt-1 leading-relaxed",
                        !selected && "text-muted-foreground",
                        revealed && "text-muted-foreground/80"
                      )}
                    >
                      {description}
                    </span>
                  )}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Insight Callout */}
      {revealed && insightAnswer && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="mt-1 flex gap-3 px-4 py-3 rounded-xl bg-warning/5 border border-warning/20"
        >
          <Lightbulb className="size-4 text-warning flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-warning mb-1">Curveball Insight</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {insightAnswer}
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
