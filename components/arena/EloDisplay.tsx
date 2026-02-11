"use client";

import { useEffect, useRef } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
} from "motion/react";
import { cn } from "@/lib/utils";
import { SCORE_COUNT_DURATION } from "@/lib/utils/constants";

interface EloDisplayProps {
  rating: number;
  previousRating?: number;
  showChange?: boolean;
}

function AnimatedNumber({ value, from }: { value: number; from: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionVal = useMotionValue(from);
  const display = useTransform(motionVal, (v) => Math.round(v).toLocaleString());

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

export default function EloDisplay({
  rating,
  previousRating,
  showChange = true,
}: EloDisplayProps) {
  const hasChange = previousRating != null && previousRating !== rating;
  const change = hasChange ? rating - (previousRating ?? rating) : 0;
  const isPositive = change > 0;
  const isNegative = change < 0;

  return (
    <div className="flex flex-col items-center gap-1">
      <motion.div
        className={cn(
          "text-4xl font-bold font-mono tabular-nums tracking-tight",
          isPositive && "text-emerald-400",
          isNegative && "text-red-400",
          !hasChange && "text-foreground"
        )}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={
          hasChange
            ? {
                scale: [0.8, 1.08, 0.97, 1],
                opacity: 1,
              }
            : { scale: 1, opacity: 1 }
        }
        transition={
          hasChange
            ? { duration: 0.6, ease: "easeOut", times: [0, 0.4, 0.7, 1] }
            : { type: "spring", stiffness: 300, damping: 25 }
        }
        style={{
          textShadow: isPositive
            ? "0 0 20px rgba(52, 211, 153, 0.4)"
            : isNegative
              ? "0 0 20px rgba(248, 113, 113, 0.4)"
              : "none",
        }}
      >
        <AnimatedNumber value={rating} from={previousRating ?? rating} />
      </motion.div>

      {showChange && hasChange && (
        <motion.div
          className={cn(
            "flex items-center gap-1 text-sm font-medium",
            isPositive && "text-emerald-400",
            isNegative && "text-red-400"
          )}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: SCORE_COUNT_DURATION * 0.8, duration: 0.3 }}
        >
          {isPositive ? (
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 15.75l7.5-7.5 7.5 7.5"
              />
            </svg>
          ) : (
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 8.25l-7.5 7.5-7.5-7.5"
              />
            </svg>
          )}
          <span className="font-mono tabular-nums">
            {isPositive ? "+" : ""}
            {change}
          </span>
        </motion.div>
      )}

      <span className="text-xs text-muted-foreground uppercase tracking-wider">
        Elo Rating
      </span>
    </div>
  );
}
