"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  Brain,
  Briefcase,
  Flame,
  Lightbulb,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import {
  CHALLENGE_TYPE_CONFIG,
  type AIChallengeTypeName,
} from "@/lib/ai/prompts/challenge-types";
import { cn } from "@/lib/utils";
import { CARD_SPRING } from "@/lib/utils/constants";
import { SkillIcon } from "@/components/ui/SkillIcon";

// ─── Types ──────────────────────────────────────────────

interface Skill {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
}

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
    <div className="mx-auto max-w-lg space-y-6 p-4">
      {/* Page Header */}
      <div>
        <h1 className="bg-gradient-to-r from-violet-400 to-primary bg-clip-text text-2xl font-extrabold tracking-tight text-transparent">
          Challenges
        </h1>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Test your skills with AI-powered conversations
        </p>
      </div>

      {/* ─── AI Challenges ──────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
            <Brain className="size-4 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-semibold">AI Challenges</h2>
            <p className="text-[10px] text-muted-foreground">Powered by Claude</p>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5">
            <Sparkles className="size-3 text-primary" />
            <span className="text-[10px] font-semibold text-primary">NEW</span>
          </div>
        </div>

        {/* Skill picker */}
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Choose a skill</p>
          <div className="grid gap-2 grid-cols-2">
            {skills.map((skill, i) => (
              <motion.button
                key={skill.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, type: "spring", ...CARD_SPRING }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setSelectedSkill(skill.id)}
                className={cn(
                  "flex items-center gap-2 rounded-xl border p-2.5 text-left transition-all min-h-[44px]",
                  selectedSkill === skill.id
                    ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                    : "border-border/50 bg-card/80 backdrop-blur-sm hover:border-primary/30"
                )}
              >
                <SkillIcon slug={skill.slug} size="sm" className="size-7" />
                <span className="text-xs font-medium truncate">{skill.name}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Challenge type cards */}
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Choose a challenge type</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {(
              Object.entries(CHALLENGE_TYPE_CONFIG) as [
                AIChallengeTypeName,
                (typeof CHALLENGE_TYPE_CONFIG)[AIChallengeTypeName],
              ][]
            ).map(([key, config], i) => {
              const Icon = AI_ICON_MAP[config.icon];
              return (
                <motion.button
                  key={key}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.05, type: "spring", ...CARD_SPRING }}
                  onClick={() => setSelectedType(key)}
                  whileTap={{ scale: 0.96 }}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all min-h-[44px]",
                    selectedType === key
                      ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                      : "border-border/50 bg-card/80 backdrop-blur-sm hover:border-primary/30"
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
          animate={{ opacity: selectedSkill && selectedType ? 1 : 0.4 }}
          whileTap={selectedSkill && selectedType ? { scale: 0.97 } : undefined}
          transition={{ type: "spring", ...CARD_SPRING }}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-colors min-h-[48px]",
            selectedSkill && selectedType && !isStarting
              ? "bg-gradient-to-r from-violet-600 to-primary text-white shadow-lg shadow-primary/20 cursor-pointer"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
        >
          {isStarting ? "Starting..." : "Start AI Challenge"}
          {!isStarting && <ChevronRight className="size-4" />}
        </motion.button>
      </section>

      {/* ─── Timed Challenges (hidden  -  seed data expires, feature not demo-ready) ─── */}
      {/* TODO: Re-enable when timed challenge feature is ready. Previous implementation
          used useSWR("/api/challenges") with ChallengeCard grid. See git history. */}
    </div>
  );
}
