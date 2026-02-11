"use client";

import { useState, useCallback } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { InteractionOption } from "@/types";

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
    <div className="flex flex-col gap-6 px-4 py-6">
      {/* Type Badge */}
      <Badge variant="secondary" className="self-start text-xs">
        Spot the Signal
      </Badge>

      {/* Prompt */}
      <div className="space-y-2">
        <p
          className="text-lg font-medium text-foreground leading-relaxed"
          dangerouslySetInnerHTML={{
            __html: prompt.replace(
              /\*\*(.*?)\*\*/g,
              '<strong class="text-primary font-bold">$1</strong>'
            ),
          }}
        />
      </div>

      {/* Options */}
      <div className="flex flex-col gap-3 mt-2">
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
                "relative w-full min-h-[44px] px-4 py-3 rounded-xl text-left text-sm font-medium",
                "border-2 transition-colors duration-150",
                "active:scale-[0.98] touch-manipulation",
                // Default state
                !selected &&
                  "border-border bg-card text-card-foreground active:border-primary active:bg-primary/5",
                // Correct answer revealed
                showAsCorrect &&
                  "border-emerald-500 bg-emerald-500/10 text-emerald-300",
                // Incorrect selection
                showAsIncorrect &&
                  "border-red-500 bg-red-500/10 text-red-300",
                // Unselected after reveal
                revealed &&
                  !isSelected &&
                  !isCorrectOption &&
                  "border-border/50 bg-card/50 text-muted-foreground opacity-60",
                // Disabled
                (!!selected || disabled) && "cursor-default"
              )}
            >
              <span className="flex items-start gap-3">
                <span
                  className={cn(
                    "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold",
                    !selected && "bg-muted text-muted-foreground",
                    showAsCorrect && "bg-emerald-500/20 text-emerald-400",
                    showAsIncorrect && "bg-red-500/20 text-red-400",
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
            </motion.button>
          );
        })}
      </div>

      {/* Insight explanation after answer */}
      {revealed && insightAnswer && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="mt-2 px-4 py-3 rounded-xl bg-primary/5 border border-primary/20"
        >
          <p className="text-xs text-muted-foreground leading-relaxed">
            <span className="font-semibold text-primary">Insight:</span>{" "}
            {insightAnswer}
          </p>
        </motion.div>
      )}
    </div>
  );
}
