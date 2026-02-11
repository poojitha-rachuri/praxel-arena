"use client";

import { motion } from "motion/react";
import { CARD_SPRING } from "@/lib/utils/constants";

interface CareerMatchBarProps {
  career: {
    name: string;
    icon?: string | null;
    matchPercentage: number;
  };
}

function getBarColor(percentage: number): string {
  if (percentage >= 75) return "from-emerald-500 to-green-400";
  if (percentage >= 50) return "from-amber-500 to-yellow-400";
  return "from-orange-500 to-red-400";
}

function getTextColor(percentage: number): string {
  if (percentage >= 75) return "text-emerald-400";
  if (percentage >= 50) return "text-amber-400";
  return "text-orange-400";
}

export default function CareerMatchBar({ career }: CareerMatchBarProps) {
  const clamped = Math.min(100, Math.max(0, career.matchPercentage));

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg" role="img" aria-label={career.name}>
            {career.icon ?? "💼"}
          </span>
          <span className="text-sm font-medium">{career.name}</span>
        </div>
        <span className={`text-sm font-mono font-semibold tabular-nums ${getTextColor(clamped)}`}>
          {Math.round(clamped)}%
        </span>
      </div>
      <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden">
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${getBarColor(clamped)}`}
          initial={{ width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{
            type: "spring",
            stiffness: CARD_SPRING.stiffness,
            damping: CARD_SPRING.damping,
            delay: 0.15,
          }}
        />
      </div>
    </div>
  );
}
