"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface CountdownTimerProps {
  totalSeconds: number;
  onExpire: () => void;
  className?: string;
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function CountdownTimer({
  totalSeconds,
  onExpire,
  className,
}: CountdownTimerProps) {
  const [remaining, setRemaining] = useState(totalSeconds);
  const startTimeRef = useRef(Date.now());
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;
  const expiredRef = useRef(false);

  useEffect(() => {
    startTimeRef.current = Date.now();
    expiredRef.current = false;
    let lastSecond = totalSeconds;

    const tick = () => {
      const elapsed = Math.floor(
        (Date.now() - startTimeRef.current) / 1000
      );
      const left = Math.max(0, totalSeconds - elapsed);

      // Only trigger re-render when the displayed second changes
      if (left !== lastSecond) {
        lastSecond = left;
        setRemaining(left);
      }

      if (left > 0) {
        rafId = requestAnimationFrame(tick);
      } else if (!expiredRef.current) {
        expiredRef.current = true;
        onExpireRef.current();
      }
    };

    let rafId = requestAnimationFrame(tick);

    // Pause display updates when tab hidden, resume with correct time on return
    const handleVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(rafId);
      } else {
        rafId = requestAnimationFrame(tick);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [totalSeconds]);

  const progress = remaining / totalSeconds;
  const isWarning = remaining <= 15 && remaining > 5;
  const isCritical = remaining <= 5;

  // SVG circular progress
  const size = 48;
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
        />
        {/* Progress ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={cn(
            "transition-colors duration-300",
            isCritical
              ? "text-red-500"
              : isWarning
                ? "text-amber-500"
                : "text-primary"
          )}
        />
      </svg>
      <span
        className={cn(
          "absolute text-xs font-mono font-medium",
          isCritical
            ? "text-red-500"
            : isWarning
              ? "text-amber-500"
              : "text-muted-foreground"
        )}
        role="timer"
        aria-live="polite"
        aria-label={`${remaining} seconds remaining`}
      >
        {formatTime(remaining)}
      </span>
    </div>
  );
}
