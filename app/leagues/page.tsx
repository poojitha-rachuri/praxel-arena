"use client";

import useSWR from "swr";
import { motion } from "motion/react";
import { LeagueCard } from "@/components/gamification/LeagueCard";
import {
  Crown,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function LeaguesPage() {
  const { data, error, isLoading } = useSWR("/api/leagues", fetcher, {
    refreshInterval: 30000,
  });

  if (error) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        Failed to load. Please try again.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 p-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-32 animate-pulse rounded-xl bg-muted" />
        <div className="space-y-2">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.status === "unassigned") {
    return (
      <div className="mx-auto max-w-2xl space-y-6 p-4">
        <div>
          <h1 className="text-2xl font-bold">Leagues</h1>
          <p className="text-sm text-muted-foreground">
            Compete weekly against players at your level.
          </p>
        </div>

        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <Crown className="mx-auto mb-3 size-8 text-muted-foreground" />
          <h2 className="mb-2 text-lg font-semibold">League Starting Soon</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            You&apos;ll be assigned to the {data?.tierName ?? "Rookie"} league on
            Monday.
          </p>
          {data?.nextAssignment && (
            <div className="flex items-center justify-center gap-2 text-sm text-primary">
              <Clock className="size-4" />
              <span>
                Next assignment:{" "}
                {new Date(data.nextAssignment).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  const zoneIcon = {
    promote: TrendingUp,
    safe: Minus,
    demote: TrendingDown,
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4">
      <div>
        <h1 className="text-2xl font-bold">Leagues</h1>
        <p className="text-sm text-muted-foreground">
          Compete weekly against players at your level.
        </p>
      </div>

      <LeagueCard
        tier={data.tier}
        tierName={data.tierName}
        rank={data.rank}
        weeklyXp={data.weeklyXp}
        totalMembers={data.totalMembers}
        zone={data.zone}
        weekEnd={data.weekEnd}
      />

      {/* Standings Table */}
      <div className="rounded-xl border border-border">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Users className="size-4 text-muted-foreground" />
          <span className="text-sm font-semibold">
            {data.tierName} League Standings
          </span>
        </div>

        <div className="divide-y divide-border">
          {data.standings?.map(
            (
              member: {
                rank: number;
                userId: string;
                name: string | null;
                imageUrl: string | null;
                weeklyXp: number;
                isCurrentUser: boolean;
              },
              i: number
            ) => {
              const zone =
                member.rank <= (data.tier === 0 ? 30 : 10)
                  ? "promote"
                  : member.rank > data.totalMembers - 5
                    ? "demote"
                    : "safe";

              const ZoneIcon = zoneIcon[zone];

              return (
                <motion.div
                  key={member.userId}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 text-sm",
                    member.isCurrentUser && "bg-primary/5"
                  )}
                >
                  <span
                    className={cn(
                      "w-8 text-center font-mono font-bold tabular-nums",
                      zone === "promote" && "text-emerald-400",
                      zone === "demote" && "text-red-400",
                      zone === "safe" && "text-muted-foreground"
                    )}
                  >
                    {member.rank}
                  </span>

                  {member.imageUrl ? (
                    <img
                      src={member.imageUrl}
                      alt=""
                      className="size-7 rounded-full"
                    />
                  ) : (
                    <div className="flex size-7 items-center justify-center rounded-full bg-muted text-xs font-medium">
                      {(member.name ?? "?")[0]}
                    </div>
                  )}

                  <span
                    className={cn(
                      "flex-1 truncate",
                      member.isCurrentUser && "font-semibold text-primary"
                    )}
                  >
                    {member.name ?? "Anonymous"}
                    {member.isCurrentUser && " (you)"}
                  </span>

                  <span className="font-mono text-xs tabular-nums text-muted-foreground">
                    {member.weeklyXp.toLocaleString()} XP
                  </span>

                  <ZoneIcon
                    className={cn(
                      "size-3.5",
                      zone === "promote" && "text-emerald-400",
                      zone === "demote" && "text-red-400",
                      zone === "safe" && "text-muted-foreground/50"
                    )}
                  />
                </motion.div>
              );
            }
          )}
        </div>
      </div>
    </div>
  );
}
