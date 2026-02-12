"use client";

import { useState } from "react";
import useSWR from "swr";
import { ChallengeCard } from "@/components/gamification/ChallengeCard";
import { Trophy, Timer, Target } from "lucide-react";
import { cn } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type TabType = "all" | "speed" | "score";

export default function ChallengesClient() {
  const [tab, setTab] = useState<TabType>("all");
  const { data, error, isLoading } = useSWR("/api/challenges", fetcher, {
    refreshInterval: 300000,
    revalidateOnFocus: false,
  });

  if (error) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        Failed to load. Please try again.
      </div>
    );
  }

  const challenges = data?.challenges ?? [];

  const filtered =
    tab === "all"
      ? challenges
      : challenges.filter(
          (c: { type: string }) =>
            (tab === "speed" && c.type === "SPEED_ROUND") ||
            (tab === "score" && c.type === "SCORE_ATTACK")
        );

  const tabs: { key: TabType; label: string; icon: typeof Trophy }[] = [
    { key: "all", label: "All", icon: Trophy },
    { key: "speed", label: "Speed Rounds", icon: Timer },
    { key: "score", label: "Score Attacks", icon: Target },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4">
      <div>
        <h1 className="text-2xl font-bold">Challenges</h1>
        <p className="text-sm text-muted-foreground">
          Compete in timed challenges to earn XP and climb the leaderboard.
        </p>
      </div>

      <div className="flex gap-2">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                tab === t.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="size-3" />
              {t.label}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-48 animate-pulse rounded-xl bg-muted"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <Trophy className="mx-auto mb-3 size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No active challenges right now. Check back soon!
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map(
            (
              challenge: {
                id: string;
                type: "SPEED_ROUND" | "SCORE_ATTACK";
                name: string;
                description: string;
                skill?: { name: string } | null;
                endsAt: string;
                rewardXpFirst: number;
                rewardXpTenth: number;
                attemptCount: number;
                userBestAttempt?: {
                  score: number;
                  timeSpentMs: number;
                  xpEarned: number;
                } | null;
              },
              i: number
            ) => (
              <ChallengeCard
                key={challenge.id}
                id={challenge.id}
                type={challenge.type}
                name={challenge.name}
                description={challenge.description}
                skillName={challenge.skill?.name}
                endsAt={challenge.endsAt}
                rewardXpFirst={challenge.rewardXpFirst}
                rewardXpTenth={challenge.rewardXpTenth}
                attemptCount={challenge.attemptCount}
                userBestAttempt={challenge.userBestAttempt}
                index={i}
              />
            )
          )}
        </div>
      )}
    </div>
  );
}
