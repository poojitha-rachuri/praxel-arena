"use client";

import { useState, useCallback, useMemo } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Lightbulb, PenLine } from "lucide-react";
import type { InteractionOption } from "@/types";
import { InteractionChart } from "./InteractionChart";

interface FillTheGapProps {
  id: string;
  prompt: string;
  options: InteractionOption[];
  correctAnswer: string | null;
  insightAnswer: string | null;
  timeTarget: number;
  chartData?: unknown;
  onAnswer: (answer: string) => void;
  disabled?: boolean;
}

export function FillTheGap({
  prompt,
  options,
  correctAnswer,
  insightAnswer,
  chartData,
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
      onAnswer(optionId);
    },
    [selected, disabled, onAnswer]
  );

  return (
    <div className="flex flex-col gap-6 px-4 py-6">
      {/* Type Header */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-success/10 border border-success/20">
          <PenLine className="size-4 text-success" />
          <span className="text-xs font-bold text-success uppercase tracking-wide">Fill the Gap</span>
        </div>
      </div>

      {/* Chart (when available) */}
      {chartData != null && <InteractionChart chartData={chartData} />}

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
                "border-success bg-success/10 text-success",
              revealed && !isCorrect &&
                "border-danger bg-danger/10 text-danger line-through"
            )}
          >
            {selectedText ?? "\u00A0____\u00A0"}
          </span>
          {/* If wrong, show correct answer inline */}
          {revealed && !isCorrect && correctText && (
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-block mx-1 px-2 py-0.5 rounded-md border-b-2 border-success bg-success/10 text-success"
            >
              {correctText}
            </motion.span>
          )}
          {promptParts.after}
        </p>
      </div>

      {/* Option Cards */}
      <div className="grid grid-cols-2 gap-3 mt-1">
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
                "min-h-[48px] px-3 py-3 rounded-xl text-center text-sm font-medium",
                "border transition-all duration-200",
                "active:scale-[0.97] touch-manipulation",
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
              {option.text}
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
            <p className="text-xs font-bold text-warning mb-1">Key Concept</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {insightAnswer}
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
