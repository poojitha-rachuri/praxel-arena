"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Timer, BookOpen, Target, Swords, Check } from "lucide-react";

interface ProgressBarProps {
  currentIndex: number;
  totalInteractions: number;
  /** Start time as Date or timestamp */
  startTime: number;
  mode: "LEARN" | "PRACTICE" | "COMPETE";
}

const MODE_CONFIG = {
  LEARN: { icon: BookOpen, label: "Learn", colorClass: "text-mode-learn", bgClass: "bg-mode-learn", dotActive: "bg-mode-learn", dotGlow: "shadow-[0_0_8px_var(--mode-learn)]" },
  PRACTICE: { icon: Target, label: "Practice", colorClass: "text-mode-practice", bgClass: "bg-mode-practice", dotActive: "bg-mode-practice", dotGlow: "shadow-[0_0_8px_var(--mode-practice)]" },
  COMPETE: { icon: Swords, label: "Compete", colorClass: "text-mode-compete", bgClass: "bg-mode-compete", dotActive: "bg-mode-compete", dotGlow: "shadow-[0_0_8px_var(--mode-compete)]" },
};

export function ProgressBar({
  currentIndex,
  totalInteractions,
  startTime,
  mode,
}: ProgressBarProps) {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
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

  const config = MODE_CONFIG[mode];
  const ModeIcon = config.icon;

  // Timer warning thresholds (based on ~2min per sprint)
  const isWarning = elapsed > 90;
  const isCritical = elapsed > 110;

  return (
    <div className="w-full px-4 py-3">
      {/* Top row: mode badge, step dots, timer */}
      <div className="flex items-center justify-between mb-3">
        {/* Mode badge */}
        <div className={cn(
          "flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full",
          `${config.bgClass}/15 ${config.colorClass}`
        )}>
          <ModeIcon className="size-3.5" />
          {config.label}
        </div>

        {/* Timer */}
        <div className={cn(
          "flex items-center gap-1.5 text-sm font-mono tabular-nums",
          isCritical ? "text-danger font-bold animate-pulse" :
          isWarning ? "text-warning" :
          "text-muted-foreground"
        )}>
          <Timer className="size-3.5" />
          {timeString}
        </div>
      </div>

      {/* Step indicator dots */}
      <div className="flex items-center gap-1.5 justify-center">
        {Array.from({ length: totalInteractions }).map((_, i) => {
          const isCompleted = i < currentIndex;
          const isCurrent = i === currentIndex;
          const isFuture = i > currentIndex;

          return (
            <div
              key={i}
              className={cn(
                "rounded-full transition-all duration-300 flex items-center justify-center",
                isCompleted && `h-2.5 w-2.5 ${config.bgClass}`,
                isCurrent && `h-3.5 w-3.5 ${config.bgClass} ${config.dotGlow} ring-2 ring-current/20 animate-pulse`,
                isFuture && "h-2.5 w-2.5 bg-surface-2",
                isCurrent && config.colorClass
              )}
            >
              {isCompleted && <Check className="size-1.5 text-white" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
