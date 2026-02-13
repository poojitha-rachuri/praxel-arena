"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, Sparkles, BookOpen, Target, Swords } from "lucide-react";
import CareerSelector, { type Career } from "./CareerSelector";
import { Button } from "@/components/ui/button";
import { CARD_SPRING } from "@/lib/utils/constants";
import { trackEvent } from "@/lib/analytics";
import { SkillIcon } from "@/components/ui/SkillIcon";

interface SkillMapping {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
}

interface OnboardingFlowProps {
  userName: string | null;
  careers: Career[];
  skillsByCareerId: Record<string, SkillMapping[]>;
}

const TOTAL_STEPS = 4;

const MODE_CARDS = [
  {
    mode: "Learn",
    icon: BookOpen,
    color: "var(--mode-learn)",
    borderClass: "border-mode-learn/40",
    bgClass: "bg-mode-learn/10",
    iconClass: "text-mode-learn",
    description:
      "Guided micro-lessons. Concepts taught, then tested. ~2 min each.",
  },
  {
    mode: "Practice",
    icon: Target,
    color: "var(--mode-practice)",
    borderClass: "border-mode-practice/40",
    bgClass: "bg-mode-practice/10",
    iconClass: "text-mode-practice",
    description:
      "Timed challenges. Faster pace, AI debriefs your weak spots.",
  },
  {
    mode: "Compete",
    icon: Swords,
    color: "var(--mode-compete)",
    borderClass: "border-mode-compete/40",
    bgClass: "bg-mode-compete/10",
    iconClass: "text-mode-compete",
    description:
      "Head-to-head duels. Same sprint, compared by AI. Earn credentials.",
  },
] as const;

export default function OnboardingFlow({
  userName,
  careers,
  skillsByCareerId,
}: OnboardingFlowProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedCareerIds, setSelectedCareerIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const recommendedSkills = (() => {
    const seen = new Set<string>();
    const skills: SkillMapping[] = [];
    for (const careerId of selectedCareerIds) {
      const mapped = skillsByCareerId[careerId] ?? [];
      for (const skill of mapped) {
        if (!seen.has(skill.id)) {
          seen.add(skill.id);
          skills.push(skill);
        }
      }
    }
    return skills;
  })();

  const topSkill = recommendedSkills[0];

  const handleCareerComplete = async (ids: string[]) => {
    setSelectedCareerIds(ids);
    setLoading(true);

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ careerOutcomeIds: ids }),
      });

      if (!res.ok) {
        console.error("Failed to save career selections");
        return;
      }

      setStep(3);
    } catch (error) {
      console.error("Failed to save career selections:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = () => {
    trackEvent("onboarding_completed", {
      careerCount: selectedCareerIds.length,
      skillCount: recommendedSkills.length,
    });
    if (topSkill) {
      router.push(`/learn?skill=${encodeURIComponent(topSkill.slug)}`);
    } else {
      router.push("/learn");
    }
  };

  const springTransition = {
    type: "spring" as const,
    stiffness: CARD_SPRING.stiffness,
    damping: CARD_SPRING.damping,
  };

  const firstName = userName?.split(" ")[0] ?? null;

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-8">
      {/* Step indicator */}
      <div className="mb-8 flex items-center justify-center gap-2">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
          <div
            key={s}
            className={`h-1.5 rounded-full transition-all ${
              s <= step ? "w-8 bg-primary" : "w-4 bg-muted"
            }`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Welcome */}
        {step === 1 && (
          <motion.div
            key="step-1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={springTransition}
            className="flex flex-col items-center gap-6 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ ...springTransition, delay: 0.1 }}
              className="flex size-16 items-center justify-center rounded-2xl bg-primary/10"
            >
              <Sparkles className="size-8 text-primary" />
            </motion.div>

            <div>
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-2xl font-bold tracking-tight"
              >
                {firstName
                  ? `Hi ${firstName}, ready to build your business edge?`
                  : "Ready to build your business edge?"}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
                className="mt-3 text-sm text-muted-foreground"
              >
                Praxel Arena helps you master business skills through
                interactive sprints, AI feedback, and head-to-head competition.
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
            >
              <Button
                size="lg"
                onClick={() => {
                  trackEvent("onboarding_step_viewed", { step: 2 });
                  setStep(2);
                }}
                className="w-full max-w-xs gap-2"
              >
                Let&apos;s Go
                <ArrowRight className="size-4" />
              </Button>
            </motion.div>
          </motion.div>
        )}

        {/* Step 2: Career Goals */}
        {step === 2 && (
          <motion.div
            key="step-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={springTransition}
          >
            <CareerSelector
              careers={careers}
              onComplete={handleCareerComplete}
              loading={loading}
            />
          </motion.div>
        )}

        {/* Step 3: How It Works */}
        {step === 3 && (
          <motion.div
            key="step-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={springTransition}
            className="flex flex-col gap-6"
          >
            <div className="text-center">
              <h1 className="text-2xl font-bold tracking-tight">
                How It Works
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Three modes, one goal: sharpen your business skills
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {MODE_CARDS.map((card, index) => {
                const Icon = card.icon;
                return (
                  <motion.div
                    key={card.mode}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      ...springTransition,
                      delay: 0.1 + index * 0.1,
                    }}
                    className={`flex items-start gap-3 rounded-xl border p-4 ${card.borderClass}`}
                  >
                    <div
                      className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${card.bgClass}`}
                    >
                      <Icon className={`size-5 ${card.iconClass}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{card.mode}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {card.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
              className="text-center text-xs text-muted-foreground"
            >
              Every skill is built from <strong>sprints</strong> — short sets of
              interactive cards you swipe through.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              className="flex flex-col items-center"
            >
              <Button
                size="lg"
                onClick={() => {
                  trackEvent("onboarding_step_viewed", { step: 4 });
                  setStep(4);
                }}
                className="w-full max-w-xs gap-2"
              >
                Show Me My Skills
                <ArrowRight className="size-4" />
              </Button>
            </motion.div>
          </motion.div>
        )}

        {/* Step 4: Your Skill Map */}
        {step === 4 && (
          <motion.div
            key="step-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={springTransition}
            className="flex flex-col gap-6"
          >
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 20,
                  delay: 0.1,
                }}
                className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10"
              >
                <Sparkles className="size-6 text-primary" />
              </motion.div>
              <h1 className="text-2xl font-bold tracking-tight">
                Your Skill Map
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Based on your goals, here are the skills we recommend
              </p>
            </div>

            <div className="flex flex-col gap-2">
              {recommendedSkills.map((skill, index) => (
                <motion.div
                  key={skill.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    ...springTransition,
                    delay: 0.15 + index * 0.08,
                  }}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
                >
                  <SkillIcon slug={skill.slug} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{skill.name}</p>
                    {skill.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {skill.description}
                      </p>
                    )}
                  </div>
                  {index === 0 && (
                    <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                      Start here
                    </span>
                  )}
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col items-center"
            >
              <Button
                size="lg"
                onClick={handleStart}
                className="w-full max-w-xs gap-2"
              >
                {topSkill
                  ? `Start Learning ${topSkill.name}`
                  : "Start Learning"}
                <ArrowRight className="size-4" />
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
