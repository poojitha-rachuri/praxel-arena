"use client";

import { motion } from "motion/react";
import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface StreakDisplayProps {
  streak: number;
  compact?: boolean;
}

export function StreakDisplay({ streak, compact = false }: StreakDisplayProps) {
  if (streak <= 0) return null;

  const intensity =
    streak >= 30
      ? "text-purple-400 bg-purple-400/15"
      : streak >= 7
        ? "text-red-400 bg-red-400/15"
        : "text-warning bg-warning/15";

  if (compact) {
    return (
      <motion.div
        className={cn(
          "flex items-center gap-1 rounded-full px-2.5 py-1",
          intensity
        )}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
      >
        <Flame className="size-3" />
        <span className="text-xs font-bold tabular-nums">{streak}</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={cn(
        "flex items-center gap-2 rounded-xl px-4 py-2.5",
        intensity
      )}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <Flame className="size-5" />
      </motion.div>
      <div>
        <div className="text-sm font-bold tabular-nums">{streak}-day streak</div>
        <div className="text-xs opacity-70">Keep it going!</div>
      </div>
    </motion.div>
  );
}
