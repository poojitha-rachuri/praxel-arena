"use client";

import { motion } from "motion/react";
import { TrendingUp, ChevronRight } from "lucide-react";
import Link from "next/link";
import { CARD_SPRING } from "@/lib/utils/constants";

interface CareerProgressBannerProps {
  careerName: string;
  careerIcon: string | null;
  matchPercentage: number;
  completedSkills: number;
  totalSkills: number;
}

export default function CareerProgressBanner({
  careerName,
  careerIcon,
  matchPercentage,
  completedSkills,
  totalSkills,
}: CareerProgressBannerProps) {
  return (
    <Link href="/profile" className="block group">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          type: "spring",
          stiffness: CARD_SPRING.stiffness,
          damping: CARD_SPRING.damping,
        }}
        className="relative overflow-hidden rounded-xl border border-border bg-surface-1 px-4 py-3"
      >
        {/* Gradient accent on left edge */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
          style={{
            background:
              "linear-gradient(to bottom, oklch(0.65 0.25 275), oklch(0.72 0.19 155))",
          }}
        />

        <div className="flex items-center gap-3">
          <span className="text-lg">{careerIcon ?? "🎯"}</span>

          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">Your path to</p>
            <p className="text-sm font-bold truncate">{careerName}</p>
          </div>

          {/* Progress ring */}
          <div className="relative size-10 shrink-0">
            <svg viewBox="0 0 36 36" className="size-10 -rotate-90">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="var(--border)"
                strokeWidth="3"
              />
              <motion.path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="var(--primary)"
                strokeWidth="3"
                strokeLinecap="round"
                initial={{ strokeDasharray: "0, 100" }}
                animate={{
                  strokeDasharray: `${matchPercentage}, 100`,
                }}
                transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold tabular-nums">
              {matchPercentage}%
            </span>
          </div>

          <ChevronRight className="size-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
        </div>

        {/* Skills progress */}
        <div className="mt-2 flex items-center gap-2">
          <TrendingUp className="size-3 text-muted-foreground" />
          <p className="text-[11px] text-muted-foreground">
            {completedSkills}/{totalSkills} skills started
          </p>
          <div className="flex-1 h-1 rounded-full bg-border overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: 0 }}
              animate={{
                width: `${totalSkills > 0 ? (completedSkills / totalSkills) * 100 : 0}%`,
              }}
              transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
