"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { motion } from "motion/react";
import {
  Brain,
  Briefcase,
  Flame,
  Lightbulb,
  ChevronRight,
  Trophy,
  Timer,
  Target,
  Sparkles,
} from "lucide-react";
import { ChallengeCard, type ChallengeCardProps } from "@/components/gamification/ChallengeCard";
import {
  CHALLENGE_TYPE_CONFIG,
  type AIChallengeTypeName,
} from "@/lib/ai/prompts/challenge-types";
import { cn } from "@/lib/utils";
import { CARD_SPRING } from "@/lib/utils/constants";
import { fetcher } from "@/lib/swr/fetcher";
import { SkillIcon } from "@/components/ui/SkillIcon";

// ─── Types ──────────────────────────────────────────────

interface Skill {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
}

type ChallengeResponse = Omit<ChallengeCardProps, "skillName" | "index"> & {
  id: string;
  skill?: { id: string; name: string; slug: string } | null;
};

const AI_ICON_MAP = {
  Briefcase,
  Flame,
  Lightbulb,
} as const;

// ─── Component ──────────────────────────────────────────

export default function ChallengesHub({ skills }: { skills: Skill[] }) {
  const router = useRouter();

  // AI challenge state
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<AIChallengeTypeName | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  // Daily challenges data
  const { data, isLoading } = useSWR("/api/challenges", fetcher, {
    refreshInterval: 300000,
    revalidateOnFocus: false,
  });
  const dailyChallenges = (data?.challenges ?? []) as ChallengeResponse[];

  const handleStartAI = useCallback(async () => {
    if (!selectedSkill || !selectedType || isStarting) return;
    setIsStarting(true);

    try {
      const res = await fetch("/api/challenge/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skillId: selectedSkill,
          challengeType: selectedType,
        }),
      });

      if (!res.ok) {
        const body = await res.json();
        alert(body.error || "Failed to create challenge session");
        setIsStarting(false);
        return;
      }

      const { sessionId } = await res.json();
      router.push(`/challenge/${sessionId}`);
    } catch {
      alert("Network error. Please try again.");
      setIsStarting(false);
    }
  }, [selectedSkill, selectedType, isStarting, router]);

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-4">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Challenges</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sharpen your skills with AI conversations and timed challenges
        </p>
      </div>

      {/* ─── AI Challenges (Featured) ──────────────────── */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
            <Brain className="size-4 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-semibold">AI Challenges</h2>
            <p className="text-xs text-muted-foreground">Powered by Claude</p>
          </div>
          <div className="ml-auto flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5">
            <Sparkles className="size-3 text-primary" />
            <span className="text-[10px] font-semibold text-primary">NEW</span>
          </div>
        </div>

        {/* Skill picker */}
        <div className="mb-4">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Choose a skill</p>
          <div className="grid gap-2 grid-cols-2 sm:grid-cols-3">
            {skills.map((skill) => (
              <button
                key={skill.id}
                onClick={() => setSelectedSkill(skill.id)}
                className={cn(
                  "flex items-center gap-2 rounded-xl border p-2.5 text-left transition-all min-h-[44px]",
                  selectedSkill === skill.id
                    ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                    : "border-border hover:border-foreground/20 hover:bg-muted/50"
                )}
              >
                <SkillIcon slug={skill.slug} size="sm" className="size-6" />
                <span className="text-xs font-medium truncate">{skill.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Challenge type cards */}
        <div className="mb-4">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Choose a challenge type</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {(
              Object.entries(CHALLENGE_TYPE_CONFIG) as [
                AIChallengeTypeName,
                (typeof CHALLENGE_TYPE_CONFIG)[AIChallengeTypeName],
              ][]
            ).map(([key, config]) => {
              const Icon = AI_ICON_MAP[config.icon];
              return (
                <motion.button
                  key={key}
                  onClick={() => setSelectedType(key)}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all min-h-[44px]",
                    selectedType === key
                      ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                      : "border-border hover:border-foreground/20 hover:bg-muted/50"
                  )}
                >
                  <div
                    className={cn(
                      "flex size-10 items-center justify-center rounded-xl",
                      config.bgColor
                    )}
                  >
                    <Icon className={cn("size-5", config.color)} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{config.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                      {config.description}
                    </p>
                  </div>
                  <span className="mt-auto text-xs text-muted-foreground">
                    ~{config.estimatedMinutes} min
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Start button */}
        <motion.button
          onClick={handleStartAI}
          disabled={!selectedSkill || !selectedType || isStarting}
          animate={{
            opacity: selectedSkill && selectedType ? 1 : 0.5,
          }}
          transition={{ type: "spring", ...CARD_SPRING }}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-colors min-h-[44px]",
            selectedSkill && selectedType && !isStarting
              ? "bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
        >
          {isStarting ? "Starting..." : "Start AI Challenge"}
          {!isStarting && <ChevronRight className="size-4" />}
        </motion.button>
      </section>

      {/* ─── Timed Challenges (hidden — seed data expires, feature not demo-ready) ─── */}
      {false && (<>
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs font-medium text-muted-foreground">Daily Challenges</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <section>
        <div className="mb-4 flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10">
            <Trophy className="size-4 text-amber-500" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Timed Challenges</h2>
            <p className="text-xs text-muted-foreground">Compete for XP and leaderboard rank</p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[...Array(2)].map((_, i) => (
              <div
                key={i}
                className="h-48 animate-pulse rounded-xl bg-muted"
              />
            ))}
          </div>
        ) : dailyChallenges.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center">
            <Trophy className="mx-auto mb-2 size-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No active challenges right now. Check back soon!
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {dailyChallenges.map((challenge, i) => (
              <ChallengeCard
                key={challenge.id}
                type={challenge.type}
                name={challenge.name}
                description={challenge.description}
                skillName={challenge.skill?.name}
                endsAt={challenge.endsAt}
                rewardXpFirst={challenge.rewardXpFirst}
                rewardXpTenth={challenge.rewardXpTenth}
                attemptCount={challenge.attemptCount}
                userBestAttempt={challenge.userBestAttempt}
                onStart={() => {
                  router.push(`/challenges/${challenge.id}`);
                }}
                index={i}
              />
            ))}
          </div>
        )}
      </section>
      </>)}
    </div>
  );
}
