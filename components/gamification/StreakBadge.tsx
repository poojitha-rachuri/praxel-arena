"use client";

import { motion, AnimatePresence } from "motion/react";
import { Flame } from "lucide-react";

interface StreakBadgeProps {
  streak: number;
}

export function StreakBadge({ streak }: StreakBadgeProps) {
  if (streak < 2) return null;

  return (
    <AnimatePresence>
      <motion.div
        key={streak}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
        className="flex items-center justify-center gap-1.5 py-1.5"
      >
        <div className="flex items-center gap-1 rounded-full bg-warning/15 px-3 py-1 text-warning">
          <Flame className="size-3.5" />
          <span className="text-xs font-bold tabular-nums">{streak} streak!</span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
