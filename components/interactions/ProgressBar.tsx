"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Timer, Zap } from "lucide-react";

interface ProgressBarProps {
  currentIndex: number;
  totalInteractions: number;
  /** Start time as Date or timestamp */
  startTime: number;
  mode: "LEARN" | "PRACTICE" | "COMPETE";
}

export function ProgressBar({
  currentIndex,
  totalInteractions,
  startTime,
  mode,
}: ProgressBarProps) {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Update elapsed time every second
    const update = () => {
      const now = Date.now();
      setElapsed(Math.floor((now - startTime) / 1000));
    };

    update();
    intervalRef.current = setInterval(update, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [startTime]);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const timeString = `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;

  const progress = totalInteractions > 0
    ? (currentIndex / totalInteractions) * 100
    : 0;

  const modeColor = {
    LEARN: "bg-blue-500",
    PRACTICE: "bg-emerald-500",
    COMPETE: "bg-amber-500",
  }[mode];

  const modeLabel = {
    LEARN: "Learn",
    PRACTICE: "Practice",
    COMPETE: "Compete",
  }[mode];

  return (
    <div className="w-full px-4 py-3">
      {/* Top row: mode label, counter, timer */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full",
              mode === "LEARN" && "bg-blue-500/15 text-blue-400",
              mode === "PRACTICE" && "bg-emerald-500/15 text-emerald-400",
              mode === "COMPETE" && "bg-amber-500/15 text-amber-400"
            )}
          >
            <Zap className="size-3" />
            {modeLabel}
          </span>
          <span className="text-sm font-medium text-foreground">
            {currentIndex + 1}{" "}
            <span className="text-muted-foreground">/ {totalInteractions}</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Timer className="size-3.5" />
          <span className="font-mono tabular-nums">{timeString}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative h-1.5 w-full rounded-full bg-muted/50 overflow-hidden">
        <motion.div
          className={cn("absolute inset-y-0 left-0 rounded-full", modeColor)}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      </div>
    </div>
  );
}
