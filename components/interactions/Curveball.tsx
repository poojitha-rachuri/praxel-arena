"use client";

import { useState, useCallback } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import type { InteractionOption } from "@/types";

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
        className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border-2 border-amber-500/30"
      >
        <AlertTriangle className="size-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-amber-300">CURVEBALL</p>
          {priorContext && (
            <p className="text-xs text-amber-200/70 mt-1 leading-relaxed">
              {priorContext}
            </p>
          )}
        </div>
      </motion.div>

      {/* Type Badge */}
      <Badge variant="secondary" className="self-start text-xs">
        Curveball
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
                "relative w-full min-h-[56px] px-4 py-4 rounded-xl text-left",
                "border-2 transition-colors duration-150",
                "active:scale-[0.98] touch-manipulation",
                // Default
                !selected &&
                  "border-border bg-card text-card-foreground active:border-amber-500 active:bg-amber-500/5",
                // Best
                isBestAnswer &&
                  "border-emerald-500 bg-emerald-500/10",
                // Selected wrong
                isSelectedWrong &&
                  "border-amber-500 bg-amber-500/10",
                // Unselected after reveal
                revealed &&
                  !isSelected &&
                  !isCorrectOption &&
                  "border-border/50 bg-card/50 opacity-60",
                (!!selected || disabled) && "cursor-default"
              )}
            >
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mt-0.5",
                    !selected && "bg-amber-500/10 text-amber-400",
                    isBestAnswer && "bg-emerald-500/20 text-emerald-400",
                    isSelectedWrong && "bg-amber-500/20 text-amber-400",
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
                      isBestAnswer && "text-emerald-300",
                      isSelectedWrong && "text-amber-300",
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

      {/* Insight */}
      {revealed && insightAnswer && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="mt-2 px-4 py-3 rounded-xl bg-amber-500/5 border border-amber-500/20"
        >
          <p className="text-xs text-muted-foreground leading-relaxed">
            <span className="font-semibold text-amber-400">Curveball insight:</span>{" "}
            {insightAnswer}
          </p>
        </motion.div>
      )}
    </div>
  );
}
