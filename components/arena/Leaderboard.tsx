"use client";

import useSWR from "swr";
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

function getRankDisplay(rank: number): string {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `#${rank}`;
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
    { refreshInterval: 5000 }
  );

  const entries = data?.entries ?? [];

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-muted-foreground">
            <th className="py-2 px-3 font-medium w-12">Rank</th>
            <th className="py-2 px-3 font-medium">Player</th>
            <th className="py-2 px-3 font-medium text-right w-20">Elo</th>
            <th className="py-2 px-3 font-medium text-right w-20">Matches</th>
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

          {entries.map((entry) => {
            const isCurrentUser = entry.userId === currentUserId;
            const isProvisional = entry.matchCount < ELO_PROVISIONAL_THRESHOLD;

            return (
              <tr
                key={entry.userId}
                className={cn(
                  "border-b border-border/50 transition-colors hover:bg-accent/30",
                  isCurrentUser && "bg-violet-500/10 hover:bg-violet-500/15"
                )}
              >
                <td className="py-3 px-3 font-medium">
                  {entry.rank <= 3 ? (
                    <span className="text-lg">{getRankDisplay(entry.rank)}</span>
                  ) : (
                    <span className="text-muted-foreground">
                      {getRankDisplay(entry.rank)}
                    </span>
                  )}
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
                        isCurrentUser && "font-semibold text-violet-400"
                      )}
                    >
                      {entry.name}
                      {isCurrentUser && (
                        <span className="text-xs text-muted-foreground ml-1">
                          (you)
                        </span>
                      )}
                    </span>
                    {isProvisional && (
                      <Badge variant="outline" className="text-xs shrink-0">
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
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
