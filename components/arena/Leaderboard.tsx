"use client";

import useSWR from "swr";
import { motion } from "motion/react";
import { Medal, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { ELO_PROVISIONAL_THRESHOLD } from "@/lib/utils/constants";

interface LeaderboardProps {
  skillSlug: string;
  currentUserId?: string;
}

interface LeaderboardEntryData {
  rank: number;
  userId: string;
  name: string;
  imageUrl?: string | null;
  eloRating: number;
  matchCount: number;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="py-3 px-3">
        <div className="h-4 w-6 bg-muted rounded" />
      </td>
      <td className="py-3 px-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-muted" />
          <div className="h-4 w-24 bg-muted rounded" />
        </div>
      </td>
      <td className="py-3 px-3">
        <div className="h-4 w-12 bg-muted rounded" />
      </td>
      <td className="py-3 px-3">
        <div className="h-4 w-8 bg-muted rounded" />
      </td>
    </tr>
  );
}

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Crown className="size-5 text-yellow-400" />;
  if (rank === 2) return <Medal className="size-5 text-slate-300" />;
  if (rank === 3) return <Medal className="size-5 text-amber-600" />;
  return <span className="text-sm text-muted-foreground">#{rank}</span>;
}

function getTierBadge(elo: number): { label: string; className: string } | null {
  if (elo >= 1800) return { label: "Diamond", className: "bg-info/15 text-info border-info/30" };
  if (elo >= 1500) return { label: "Gold", className: "bg-warning/15 text-warning border-warning/30" };
  if (elo >= 1300) return { label: "Silver", className: "bg-muted text-muted-foreground border-border" };
  return null;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function Leaderboard({
  skillSlug,
  currentUserId,
}: LeaderboardProps) {
  const { data, isLoading, error } = useSWR<{ entries: LeaderboardEntryData[] }>(
    `/api/leaderboard?skillSlug=${encodeURIComponent(skillSlug)}`,
    fetcher,
    { refreshInterval: 30000 }
  );

  const entries = data?.entries ?? [];

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-border/60 bg-card/50">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <th className="py-3 px-3 font-medium w-12">Rank</th>
            <th className="py-3 px-3 font-medium">Player</th>
            <th className="py-3 px-3 font-medium text-right w-20">Elo</th>
            <th className="py-3 px-3 font-medium text-right w-20">Matches</th>
          </tr>
        </thead>
        <tbody>
          {isLoading && (
            <>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </>
          )}

          {!isLoading && error && (
            <tr>
              <td colSpan={4} className="py-8 text-center text-muted-foreground">
                Failed to load leaderboard
              </td>
            </tr>
          )}

          {!isLoading && !error && entries.length === 0 && (
            <tr>
              <td colSpan={4} className="py-8 text-center text-muted-foreground">
                No competitors yet. Be the first!
              </td>
            </tr>
          )}

          {entries.map((entry, index) => {
            const isCurrentUser = entry.userId === currentUserId;
            const isProvisional = entry.matchCount < ELO_PROVISIONAL_THRESHOLD;
            const tier = getTierBadge(entry.eloRating);

            return (
              <motion.tr
                key={entry.userId}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                className={cn(
                  "border-b border-border/40 transition-colors hover:bg-surface-2/50",
                  isCurrentUser && "bg-mode-compete/8 hover:bg-mode-compete/12"
                )}
              >
                <td className="py-3 px-3">
                  <RankIcon rank={entry.rank} />
                </td>
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2">
                    <Avatar size="sm">
                      {entry.imageUrl ? (
                        <AvatarImage src={entry.imageUrl} alt={entry.name} />
                      ) : null}
                      <AvatarFallback>
                        {getInitials(entry.name || "?")}
                      </AvatarFallback>
                    </Avatar>
                    <span
                      className={cn(
                        "truncate",
                        isCurrentUser && "font-semibold text-mode-compete"
                      )}
                    >
                      {entry.name}
                      {isCurrentUser && (
                        <span className="text-xs text-muted-foreground ml-1">
                          (you)
                        </span>
                      )}
                    </span>
                    {tier && (
                      <Badge variant="outline" className={cn("text-[10px] shrink-0", tier.className)}>
                        {tier.label}
                      </Badge>
                    )}
                    {isProvisional && (
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        Provisional
                      </Badge>
                    )}
                  </div>
                </td>
                <td className="py-3 px-3 text-right font-mono tabular-nums font-medium">
                  {entry.eloRating.toLocaleString()}
                </td>
                <td className="py-3 px-3 text-right font-mono tabular-nums text-muted-foreground">
                  {entry.matchCount}
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
