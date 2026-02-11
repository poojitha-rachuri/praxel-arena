"use client";

import { useState, useCallback, useMemo } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { InteractionOption } from "@/types";

interface FillTheGapProps {
  id: string;
  prompt: string;
  options: InteractionOption[];
  correctAnswer: string | null;
  insightAnswer: string | null;
  timeTarget: number;
  onAnswer: (answer: string) => void;
  disabled?: boolean;
}

export function FillTheGap({
  prompt,
  options,
  correctAnswer,
  insightAnswer,
  onAnswer,
  disabled = false,
}: FillTheGapProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);

  // Find the selected option text for filling in the blank
  const selectedText = useMemo(() => {
    if (!selected) return null;
    return options.find((o) => o.id === selected)?.text ?? null;
  }, [selected, options]);

  // Find the correct option text
  const correctText = useMemo(() => {
    if (!correctAnswer) return null;
    return options.find((o) => o.id === correctAnswer)?.text ?? null;
  }, [correctAnswer, options]);

  const isCorrect = selected === correctAnswer;

  // Split prompt on ____ to render the blank
  const promptParts = useMemo(() => {
    const blankPattern = /_{2,}|____/;
    const parts = prompt.split(blankPattern);
    if (parts.length < 2) return { before: prompt, after: "" };
    return { before: parts[0], after: parts.slice(1).join("____") };
  }, [prompt]);

  const handleSelect = useCallback(
    (optionId: string) => {
      if (selected || disabled) return;
      setSelected(optionId);
      setRevealed(true);

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
        Fill the Gap
      </Badge>

      {/* Prompt with blank */}
      <div className="space-y-2">
        <p className="text-lg font-medium text-foreground leading-relaxed">
          {promptParts.before}
          <span
            className={cn(
              "inline-block min-w-[100px] mx-1 px-2 py-0.5 rounded-md border-b-2 text-center transition-all duration-300",
              !selected &&
                "border-primary/40 bg-primary/5 text-muted-foreground",
              revealed && isCorrect &&
                "border-emerald-500 bg-emerald-500/10 text-emerald-300",
              revealed && !isCorrect &&
                "border-red-500 bg-red-500/10 text-red-300 line-through"
            )}
          >
            {selectedText ?? "\u00A0____\u00A0"}
          </span>
          {/* If wrong, show correct answer inline */}
          {revealed && !isCorrect && correctText && (
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-block mx-1 px-2 py-0.5 rounded-md border-b-2 border-emerald-500 bg-emerald-500/10 text-emerald-300"
            >
              {correctText}
            </motion.span>
          )}
          {promptParts.after}
        </p>
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-3 mt-2">
        {options.map((option, index) => {
          const isSelected = selected === option.id;
          const isCorrectOption = correctAnswer === option.id;
          const showAsCorrect = revealed && isCorrectOption;
          const showAsIncorrect = revealed && isSelected && !isCorrectOption;

          return (
            <motion.button
              key={option.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05, duration: 0.2 }}
              onClick={() => handleSelect(option.id)}
              disabled={!!selected || disabled}
              className={cn(
                "min-h-[44px] px-3 py-3 rounded-xl text-center text-sm font-medium",
                "border-2 transition-colors duration-150",
                "active:scale-[0.97] touch-manipulation",
                // Default
                !selected &&
                  "border-border bg-card text-card-foreground active:border-primary active:bg-primary/5",
                // Correct
                showAsCorrect &&
                  "border-emerald-500 bg-emerald-500/10 text-emerald-300",
                // Incorrect selection
                showAsIncorrect &&
                  "border-red-500 bg-red-500/10 text-red-300",
                // Unselected after reveal
                revealed &&
                  !isSelected &&
                  !isCorrectOption &&
                  "border-border/50 bg-card/50 text-muted-foreground opacity-50",
                (!!selected || disabled) && "cursor-default"
              )}
            >
              {option.text}
            </motion.button>
          );
        })}
      </div>

      {/* Insight */}
      {revealed && insightAnswer && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="mt-2 px-4 py-3 rounded-xl bg-primary/5 border border-primary/20"
        >
          <p className="text-xs text-muted-foreground leading-relaxed">
            <span className="font-semibold text-primary">Key concept:</span>{" "}
            {insightAnswer}
          </p>
        </motion.div>
      )}
    </div>
  );
}
