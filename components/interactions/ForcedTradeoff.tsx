"use client";

import { useState, useCallback } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Lightbulb, Scale } from "lucide-react";
import type { InteractionOption } from "@/types";
import { renderBoldPrompt } from "@/lib/utils/safe-html";

const OPTION_ACCENT_COLORS = [
  "bg-info",
  "bg-success",
  "bg-warning",
  "bg-danger",
];

interface ForcedTradeoffProps {
  id: string;
  prompt: string;
  options: InteractionOption[];
  correctAnswer: string | null;
  insightAnswer: string | null;
  timeTarget: number;
  onAnswer: (answer: string) => void;
  disabled?: boolean;
}

export function ForcedTradeoff({
  prompt,
  options,
  correctAnswer,
  insightAnswer,
  onAnswer,
  disabled = false,
}: ForcedTradeoffProps) {
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
    <div className="flex flex-col gap-5 px-4 py-6">
      {/* Type Header */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-insight/10 border border-insight/20">
          <Scale className="size-4 text-insight" />
          <span className="text-xs font-bold text-insight uppercase tracking-wide">Forced Tradeoff</span>
        </div>
      </div>

      {/* Scenario Prompt */}
      <div className="space-y-2">
        <p className="text-lg font-medium text-foreground leading-relaxed">
          {renderBoldPrompt(prompt)}
        </p>
      </div>

      {/* Strategic Option Cards */}
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
              transition={{ delay: index * 0.06, duration: 0.25 }}
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
              {/* Left accent stripe */}
              <div className={cn(
                "absolute left-0 top-3 bottom-3 w-1 rounded-full",
                isBestAnswer ? "bg-success" :
                isSelectedWrong ? "bg-warning" :
                OPTION_ACCENT_COLORS[index] ?? "bg-muted"
              )} />
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mt-0.5",
                    !selected && "bg-muted text-muted-foreground",
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
            <p className="text-xs font-bold text-warning mb-1">Tradeoff Insight</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {insightAnswer}
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
