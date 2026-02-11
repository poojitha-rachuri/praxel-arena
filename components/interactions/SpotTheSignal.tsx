"use client";

import { useState, useCallback, useMemo } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Lightbulb, BarChart3 } from "lucide-react";
import type { InteractionOption } from "@/types";
import { renderBoldPrompt } from "@/lib/utils/safe-html";

const OPTION_ACCENT_COLORS = [
  "bg-info",      // A = blue
  "bg-success",   // B = green
  "bg-warning",   // C = amber
  "bg-danger",    // D = coral
];

interface SpotTheSignalProps {
  id: string;
  prompt: string;
  options: InteractionOption[];
  correctAnswer: string | null;
  insightAnswer: string | null;
  timeTarget: number;
  onAnswer: (answer: string) => void;
  disabled?: boolean;
}

export function SpotTheSignal({
  prompt,
  options,
  correctAnswer,
  insightAnswer,
  onAnswer,
  disabled = false,
}: SpotTheSignalProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);

  const handleSelect = useCallback(
    (optionId: string) => {
      if (selected || disabled) return;
      setSelected(optionId);
      setRevealed(true);

      // Brief delay for feedback then advance
      setTimeout(() => {
        onAnswer(optionId);
      }, 800);
    },
    [selected, disabled, onAnswer]
  );

  return (
    <div className="flex flex-col gap-5 px-4 py-6">
      {/* Type Header */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-info/10 border border-info/20">
          <BarChart3 className="size-4 text-info" />
          <span className="text-xs font-bold text-info uppercase tracking-wide">Spot the Signal</span>
        </div>
      </div>

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
          const showAsCorrect = revealed && isCorrectOption;
          const showAsIncorrect = revealed && isSelected && !isCorrectOption;

          return (
            <motion.button
              key={option.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.2 }}
              onClick={() => handleSelect(option.id)}
              disabled={!!selected || disabled}
              className={cn(
                "relative w-full min-h-[48px] pl-5 pr-4 py-3 rounded-xl text-left text-sm font-medium overflow-hidden",
                "border transition-all duration-200",
                "active:scale-[0.98] touch-manipulation",
                !selected &&
                  "border-border/60 bg-surface-2/80 text-card-foreground hover:border-border hover:bg-surface-3/60",
                showAsCorrect &&
                  "border-success/50 bg-success/10 text-success ring-1 ring-success/30",
                showAsIncorrect &&
                  "border-danger/50 bg-danger/10 text-danger",
                revealed &&
                  !isSelected &&
                  !isCorrectOption &&
                  "border-border/30 bg-card/30 text-muted-foreground opacity-50",
                (!!selected || disabled) && "cursor-default"
              )}
            >
              {/* Left accent stripe */}
              <div className={cn(
                "absolute left-0 top-3 bottom-3 w-1 rounded-full transition-opacity",
                showAsCorrect ? "bg-success" :
                showAsIncorrect ? "bg-danger" :
                OPTION_ACCENT_COLORS[index] ?? "bg-muted"
              )} />
              <span className="flex items-start gap-3">
                <span
                  className={cn(
                    "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold",
                    !selected && "bg-muted text-muted-foreground",
                    showAsCorrect && "bg-success/20 text-success",
                    showAsIncorrect && "bg-danger/20 text-danger",
                    revealed &&
                      !isSelected &&
                      !isCorrectOption &&
                      "bg-muted/50 text-muted-foreground/50"
                  )}
                >
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="flex-1 leading-snug">{option.text}</span>
              </span>
              {/* Correct badge */}
              {showAsCorrect && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-success bg-success/10 px-2 py-0.5 rounded-full"
                >
                  Correct!
                </motion.span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Insight Callout */}
      {revealed && insightAnswer && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="mt-1 flex gap-3 px-4 py-3 rounded-xl bg-warning/5 border border-warning/20"
        >
          <Lightbulb className="size-4 text-warning flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-warning mb-1">Key Insight</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {insightAnswer}
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
