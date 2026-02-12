"use client";

import { useEffect, useRef } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
} from "motion/react";
import { cn } from "@/lib/utils";
import { Zap } from "lucide-react";
import { SCORE_COUNT_DURATION } from "@/lib/utils/constants";

interface XpBarProps {
  level: number;
  xp: number;
  xpProgress: number;
  xpNeeded: number;
  progressPercent: number;
  title: string;
  compact?: boolean;
}

function AnimatedXp({ value, from }: { value: number; from: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionVal = useMotionValue(from);
  const display = useTransform(motionVal, (v) =>
    Math.round(v).toLocaleString()
  );

  useEffect(() => {
    const controls = animate(motionVal, value, {
      duration: SCORE_COUNT_DURATION,
      ease: "easeOut",
    });
    return controls.stop;
  }, [motionVal, value]);

  useEffect(() => {
    const unsub = display.on("change", (v) => {
      if (ref.current) ref.current.textContent = v;
    });
    return unsub;
  }, [display]);

  return <span ref={ref}>{Math.round(from).toLocaleString()}</span>;
}

export function XpBar({
  level,
  xp,
  xpProgress,
  xpNeeded,
  progressPercent,
  title,
  compact = false,
}: XpBarProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 text-primary">
          <Zap className="size-3" />
          <span className="text-xs font-bold tabular-nums">Lv.{level}</span>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground tabular-nums font-mono">
            {xp.toLocaleString()} XP
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1.5 text-primary">
            <Zap className="size-4" />
            <span className="text-sm font-bold tabular-nums">Level {level}</span>
          </div>
          <span className="text-sm font-medium text-muted-foreground">
            {title}
          </span>
        </div>
        <span className="text-sm font-mono tabular-nums text-muted-foreground">
          <AnimatedXp value={xp} from={Math.max(0, xp - 50)} /> XP
        </span>
      </div>

      <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-primary to-primary/80"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.2 }}
        />
      </div>

      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{xpProgress.toLocaleString()} / {xpNeeded.toLocaleString()} XP to next level</span>
        <span>{progressPercent}%</span>
      </div>
    </div>
  );
}
