"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Timer, Zap, Trophy, Target } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChallengeCardProps {
  id: string;
  type: "SPEED_ROUND" | "SCORE_ATTACK";
  name: string;
  description: string;
  skillName?: string;
  endsAt: string;
  rewardXpFirst: number;
  rewardXpTenth: number;
  attemptCount: number;
  userBestAttempt?: {
    score: number;
    timeSpentMs: number;
    xpEarned: number;
  } | null;
  onStart?: () => void;
  index?: number;
}

function useCountdown(endsAt: string) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    const update = () => {
      const diff = new Date(endsAt).getTime() - Date.now();
      if (diff <= 0) {
        setRemaining("Ended");
        return;
      }
      const hours = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      if (hours > 0) {
        setRemaining(`${hours}h ${mins}m`);
      } else {
        const secs = Math.floor((diff % 60000) / 1000);
        setRemaining(`${mins}m ${secs}s`);
      }
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [endsAt]);

  return remaining;
}

export function ChallengeCard({
  type,
  name,
  description,
  skillName,
  endsAt,
  rewardXpFirst,
  rewardXpTenth,
  attemptCount,
  userBestAttempt,
  onStart,
  index = 0,
}: ChallengeCardProps) {
  const countdown = useCountdown(endsAt);
  const isSpeedRound = type === "SPEED_ROUND";
  const hasCompleted = !!userBestAttempt;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, type: "spring", stiffness: 300, damping: 25 }}
      className={cn(
        "rounded-xl border bg-card p-4 transition-colors",
        hasCompleted ? "border-primary/30" : "border-border hover:border-primary/20"
      )}
    >
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-2">
          {isSpeedRound ? (
            <Timer className="size-4 text-amber-400" />
          ) : (
            <Target className="size-4 text-cyan-400" />
          )}
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
              isSpeedRound
                ? "bg-amber-400/15 text-amber-400"
                : "bg-cyan-400/15 text-cyan-400"
            )}
          >
            {isSpeedRound ? "Speed" : "Score"}
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Timer className="size-3" />
          <span className="tabular-nums">{countdown}</span>
        </div>
      </div>

      <h3 className="mb-1 text-sm font-semibold">{name}</h3>
      <p className="mb-3 text-xs text-muted-foreground line-clamp-2">
        {description}
      </p>

      {skillName && (
        <div className="mb-3 text-xs text-muted-foreground">
          Skill: <span className="font-medium text-foreground">{skillName}</span>
        </div>
      )}

      <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Zap className="size-3 text-primary" />
          <span>
            {rewardXpTenth}-{rewardXpFirst} XP
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Trophy className="size-3" />
          <span>{attemptCount} attempts</span>
        </div>
      </div>

      {hasCompleted ? (
        <div className="rounded-lg bg-primary/10 px-3 py-2 text-center text-xs font-medium text-primary">
          Completed +{userBestAttempt.xpEarned} XP
        </div>
      ) : (
        <button
          onClick={onStart}
          className="w-full rounded-lg bg-primary py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Start Challenge
        </button>
      )}
    </motion.div>
  );
}
