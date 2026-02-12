"use client";

import { motion, AnimatePresence } from "motion/react";
import { Trophy, TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface SeasonSummaryProps {
  open: boolean;
  onClose: () => void;
  seasonName: string;
  skillName: string;
  startElo: number;
  endElo: number;
  peakElo: number;
  rank: number;
  totalPlayers: number;
}

export function SeasonSummary({
  open,
  onClose,
  seasonName,
  skillName,
  startElo,
  endElo,
  peakElo,
  rank,
  totalPlayers,
}: SeasonSummaryProps) {
  const eloDiff = endElo - startElo;
  const isPositive = eloDiff >= 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-center gap-2">
              <Calendar className="size-5 text-primary" />
              <h2 className="text-lg font-bold">Season Summary</h2>
            </div>

            <div className="mb-4 text-center">
              <p className="text-sm text-muted-foreground">{seasonName}</p>
              <p className="text-xs text-muted-foreground">{skillName}</p>
            </div>

            <div className="mb-6 space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
                <span className="text-sm text-muted-foreground">Final Elo</span>
                <span className="text-lg font-bold font-mono tabular-nums">
                  {endElo}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
                <span className="text-sm text-muted-foreground">Change</span>
                <div className="flex items-center gap-1.5">
                  {isPositive ? (
                    <TrendingUp className="size-4 text-emerald-400" />
                  ) : (
                    <TrendingDown className="size-4 text-red-400" />
                  )}
                  <span
                    className={cn(
                      "font-mono font-bold tabular-nums",
                      isPositive ? "text-emerald-400" : "text-red-400"
                    )}
                  >
                    {isPositive ? "+" : ""}
                    {eloDiff}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
                <span className="text-sm text-muted-foreground">Peak Elo</span>
                <span className="font-mono font-bold tabular-nums text-amber-400">
                  {peakElo}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
                <span className="text-sm text-muted-foreground">Season Rank</span>
                <div className="flex items-center gap-1.5">
                  <Trophy className="size-4 text-primary" />
                  <span className="font-mono font-bold tabular-nums">
                    #{rank}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    / {totalPlayers}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Continue
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
