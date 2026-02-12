"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, CheckCircle2, XCircle, Clock, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { CARD_SPRING } from "@/lib/utils/constants";
import type { EnrichedResponse } from "@/types";

/** Friendly labels for interaction types */
const TYPE_LABELS: Record<string, string> = {
  SPOT_THE_SIGNAL: "Spot the Signal",
  FORCED_TRADEOFF: "Forced Tradeoff",
  FILL_THE_GAP: "Fill the Gap",
  RANK_AND_PRIORITIZE: "Rank & Prioritize",
  CURVEBALL: "Curveball",
  TEACH_AND_TEST: "Teach & Test",
};

function TimeIndicator({
  timeSpent,
  timeTarget,
}: {
  timeSpent: number;
  timeTarget: number;
}) {
  const ratio = timeSpent / (timeTarget || 10);
  const color =
    ratio <= 1 ? "text-success" : ratio <= 1.5 ? "text-warning" : "text-danger";

  return (
    <span className={cn("flex items-center gap-0.5 text-xs tabular-nums", color)}>
      <Clock className="size-3" />
      {timeSpent.toFixed(1)}s
    </span>
  );
}

function ReviewItem({
  response,
  index,
  isOpen,
  onToggle,
}: {
  response: EnrichedResponse;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const typeLabel = TYPE_LABELS[response.interactionType] ?? response.interactionType;

  // Find the text of the user's answer and the correct answer
  const userOption = response.options.find((o) => o.id === response.answer);
  const correctOption = response.options.find(
    (o) => o.id === response.correctAnswer
  );

  return (
    <div className="border-b border-border last:border-b-0">
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/50 transition-colors"
      >
        {/* Correctness icon */}
        {response.isCorrect ? (
          <CheckCircle2 className="size-4 shrink-0 text-success" />
        ) : (
          <XCircle className="size-4 shrink-0 text-danger" />
        )}

        {/* Question number + type */}
        <div className="flex-1 min-w-0">
          <span className="text-xs font-medium">
            Q{index + 1}
          </span>
          <span className="text-xs text-muted-foreground ml-1.5">
            {typeLabel}
          </span>
        </div>

        {/* Score + time */}
        <span className="text-xs font-medium tabular-nums shrink-0">
          {response.score}
        </span>
        <TimeIndicator timeSpent={response.timeSpent} timeTarget={15} />

        {/* Expand chevron */}
        <ChevronDown
          className={cn(
            "size-3.5 text-muted-foreground transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-1 space-y-2">
              {/* Question prompt */}
              <p className="text-xs text-muted-foreground leading-relaxed">
                {response.prompt}
              </p>

              {/* Answer comparison */}
              {response.interactionType === "RANK_AND_PRIORITIZE" ? (
                <RankingComparison response={response} />
              ) : (
                <div className="flex flex-col gap-1">
                  <div className="flex items-start gap-2 text-xs">
                    <span className="text-muted-foreground shrink-0 w-16">
                      Your answer:
                    </span>
                    <span
                      className={cn(
                        "font-medium",
                        response.isCorrect ? "text-success" : "text-danger"
                      )}
                    >
                      {userOption?.text ?? response.answer}
                      {response.isCorrect ? " ✓" : " ✗"}
                    </span>
                  </div>
                  {!response.isCorrect && (
                    <div className="flex items-start gap-2 text-xs">
                      <span className="text-muted-foreground shrink-0 w-16">
                        Correct:
                      </span>
                      <span className="font-medium text-success">
                        {correctOption?.text ?? response.correctAnswer}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Insight — only show if it's real explanatory text, not a raw option letter */}
              {response.insightAnswer && response.insightAnswer.length > 10 && (
                <div className="flex gap-1.5 rounded-lg bg-primary/5 border border-primary/10 p-2">
                  <Info className="size-3 text-primary shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {response.insightAnswer}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RankingComparison({ response }: { response: EnrichedResponse }) {
  const userOrder = response.answer.split(",").map((s) => s.trim());
  const correctOrder = response.correctAnswer.split(",").map((s) => s.trim());

  // Map option IDs to their text labels
  const optionMap = new Map(response.options.map((o) => [o.id, o.text]));

  return (
    <div className="grid grid-cols-2 gap-3 text-xs">
      <div>
        <p className="text-muted-foreground mb-1 font-medium">Your Order</p>
        <ol className="list-decimal list-inside space-y-0.5">
          {userOrder.map((id, i) => {
            const isCorrectPosition = id === correctOrder[i];
            return (
              <li
                key={i}
                className={cn(
                  isCorrectPosition ? "text-success" : "text-danger"
                )}
              >
                {optionMap.get(id) ?? id}
              </li>
            );
          })}
        </ol>
      </div>
      <div>
        <p className="text-muted-foreground mb-1 font-medium">Correct Order</p>
        <ol className="list-decimal list-inside space-y-0.5">
          {correctOrder.map((id, i) => (
            <li key={i} className="text-success">
              {optionMap.get(id) ?? id}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

export default function InteractionReview({
  responses,
}: {
  responses: EnrichedResponse[];
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());

  const correctCount = responses.filter((r) => r.isCorrect).length;

  const toggleItem = (index: number) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: "spring",
        stiffness: CARD_SPRING.stiffness,
        damping: CARD_SPRING.damping,
        delay: 3.4,
      }}
      className="rounded-xl border border-border bg-card overflow-hidden"
    >
      {/* Header toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
      >
        <h3 className="text-sm font-semibold">
          Review Your Answers
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            ({correctCount}/{responses.length} correct)
          </span>
        </h3>
        <ChevronDown
          className={cn(
            "size-4 text-muted-foreground transition-transform",
            isExpanded && "rotate-180"
          )}
        />
      </button>

      {/* Expandable content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border">
              {responses.map((response, index) => (
                <ReviewItem
                  key={response.interactionId}
                  response={response}
                  index={index}
                  isOpen={openItems.has(index)}
                  onToggle={() => toggleItem(index)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
