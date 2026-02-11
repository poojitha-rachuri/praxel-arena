"use client";

import { type ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { CARD_SPRING } from "@/lib/utils/constants";
import { CheckCircle2, XCircle } from "lucide-react";

interface InteractionCardProps {
  children: ReactNode;
  onAnswer: (answer: string) => void;
  showFeedback: boolean;
  isCorrect: boolean | null;
  /** Unique key for AnimatePresence transitions */
  cardKey: string;
}

export function InteractionCard({
  children,
  showFeedback,
  isCorrect,
  cardKey,
}: InteractionCardProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={cardKey}
        initial={{ x: 300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -300, opacity: 0 }}
        transition={{
          type: "spring",
          stiffness: CARD_SPRING.stiffness,
          damping: CARD_SPRING.damping,
        }}
        className="relative min-h-[calc(100vh-120px)] w-full max-w-lg mx-auto flex flex-col"
      >
        {/* Card Content */}
        <div className="flex-1 flex flex-col">{children}</div>

        {/* Feedback Overlay */}
        <AnimatePresence>
          {showFeedback && isCorrect !== null && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className={cn(
                "absolute inset-0 flex items-center justify-center rounded-2xl pointer-events-none z-10",
                isCorrect
                  ? "bg-emerald-500/10 dark:bg-emerald-500/15"
                  : "bg-red-500/10 dark:bg-red-500/15"
              )}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 20,
                  delay: 0.1,
                }}
                className={cn(
                  "rounded-full p-4",
                  isCorrect
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-red-500/20 text-red-400"
                )}
              >
                {isCorrect ? (
                  <CheckCircle2 className="size-16" strokeWidth={1.5} />
                ) : (
                  <XCircle className="size-16" strokeWidth={1.5} />
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
