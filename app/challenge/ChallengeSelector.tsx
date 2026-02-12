"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Briefcase, Flame, Lightbulb, ChevronRight } from "lucide-react";
import {
  CHALLENGE_TYPE_CONFIG,
  type AIChallengeTypeName,
} from "@/lib/ai/prompts/challenge-types";
import { cn } from "@/lib/utils";
import { CARD_SPRING } from "@/lib/utils/constants";

interface Skill {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
}

interface ChallengeSelectorProps {
  skills: Skill[];
}

const ICON_MAP = {
  Briefcase,
  Flame,
  Lightbulb,
} as const;

export default function ChallengeSelector({ skills }: ChallengeSelectorProps) {
  const router = useRouter();
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<AIChallengeTypeName | null>(
    null
  );
  const [isStarting, setIsStarting] = useState(false);

  const handleStart = useCallback(async () => {
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
        const data = await res.json();
        alert(data.error || "Failed to create challenge session");
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
    <div className="space-y-6">
      {/* Skill Selection */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          1. Choose a skill
        </h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {skills.map((skill) => (
            <button
              key={skill.id}
              onClick={() => setSelectedSkill(skill.id)}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-3 text-left transition-all min-h-[44px]",
                selectedSkill === skill.id
                  ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                  : "border-border hover:border-foreground/20 hover:bg-muted/50"
              )}
            >
              <span className="text-lg">{skill.icon || "📊"}</span>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{skill.name}</p>
                {skill.description && (
                  <p className="text-xs text-muted-foreground truncate">
                    {skill.description}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Challenge Type Selection */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          2. Choose a challenge type
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {(
            Object.entries(CHALLENGE_TYPE_CONFIG) as [
              AIChallengeTypeName,
              (typeof CHALLENGE_TYPE_CONFIG)[AIChallengeTypeName],
            ][]
          ).map(([key, config]) => {
            const Icon = ICON_MAP[config.icon];
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

      {/* Start Button */}
      <motion.button
        onClick={handleStart}
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
        {isStarting ? "Starting..." : "Start Challenge"}
        {!isStarting && <ChevronRight className="size-4" />}
      </motion.button>
    </div>
  );
}
