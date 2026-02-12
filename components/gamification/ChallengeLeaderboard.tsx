"use client";

import useSWR from "swr";
import { motion } from "motion/react";
import { Trophy, Timer, Target } from "lucide-react";
import { cn } from "@/lib/utils";

interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string | null;
  imageUrl: string | null;
  score: number;
  timeSpentMs: number;
  isCurrentUser: boolean;
}

interface ChallengeLeaderboardProps {
  challengeId: string;
  type: "SPEED_ROUND" | "SCORE_ATTACK";
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function formatTime(ms: number): string {
  const secs = Math.floor(ms / 1000);
  const mins = Math.floor(secs / 60);
  const remainSecs = secs % 60;
  return mins > 0 ? `${mins}m ${remainSecs}s` : `${remainSecs}s`;
}

export function ChallengeLeaderboard({
  challengeId,
  type,
}: ChallengeLeaderboardProps) {
  const { data, isLoading } = useSWR(
    `/api/challenges/${challengeId}/leaderboard`,
    fetcher,
    { refreshInterval: 15000 }
  );

  const isSpeedRound = type === "SPEED_ROUND";

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-10 animate-pulse rounded bg-muted" />
        ))}
      </div>
    );
  }

  const entries: LeaderboardEntry[] = data?.leaderboard ?? [];

  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center">
        <Trophy className="mx-auto mb-2 size-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          No attempts yet. Be the first!
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        {isSpeedRound ? (
          <Timer className="size-4 text-amber-400" />
        ) : (
          <Target className="size-4 text-cyan-400" />
        )}
        <span className="text-sm font-semibold">Leaderboard</span>
      </div>

      <div className="divide-y divide-border">
        {entries.map((entry, i) => (
          <motion.div
            key={entry.userId}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
            className={cn(
              "flex items-center gap-3 px-4 py-2.5 text-sm",
              entry.isCurrentUser && "bg-primary/5"
            )}
          >
            <span
              className={cn(
                "w-6 text-center font-mono font-bold tabular-nums",
                entry.rank <= 3 ? "text-primary" : "text-muted-foreground"
              )}
            >
              {entry.rank}
            </span>

            {entry.imageUrl ? (
              <img
                src={entry.imageUrl}
                alt=""
                className="size-7 rounded-full"
              />
            ) : (
              <div className="flex size-7 items-center justify-center rounded-full bg-muted text-xs font-medium">
                {(entry.name ?? "?")[0]}
              </div>
            )}

            <span
              className={cn(
                "flex-1 truncate",
                entry.isCurrentUser && "font-semibold text-primary"
              )}
            >
              {entry.name ?? "Anonymous"}
              {entry.isCurrentUser && " (you)"}
            </span>

            {isSpeedRound ? (
              <span className="font-mono text-xs tabular-nums text-muted-foreground">
                {formatTime(entry.timeSpentMs)}
              </span>
            ) : (
              <span className="font-mono text-xs tabular-nums text-muted-foreground">
                {entry.score.toLocaleString()} pts
              </span>
            )}
          </motion.div>
        ))}
      </div>

      {data?.userRank && !entries.some((e: LeaderboardEntry) => e.isCurrentUser) && (
        <div className="border-t border-border px-4 py-2.5 text-sm">
          <span className="text-muted-foreground">Your rank: </span>
          <span className="font-mono font-bold tabular-nums text-primary">
            #{data.userRank}
          </span>
        </div>
      )}
    </div>
  );
}
