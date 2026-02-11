"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, Sparkles } from "lucide-react";
import CareerSelector, { type Career } from "./CareerSelector";
import { Button } from "@/components/ui/button";
import { CARD_SPRING } from "@/lib/utils/constants";

interface SkillMapping {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
}

interface OnboardingFlowProps {
  careers: Career[];
  skillsByCareerId: Record<string, SkillMapping[]>;
}

export default function OnboardingFlow({
  careers,
  skillsByCareerId,
}: OnboardingFlowProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedCareerIds, setSelectedCareerIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Derive the unique skills from selected careers
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
      // Save career selections to profile
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ careerOutcomeIds: ids }),
      });

      if (!res.ok) {
        console.error("Failed to save career selections");
      }
    } catch (error) {
      console.error("Failed to save career selections:", error);
    } finally {
      setLoading(false);
      setStep(2);
    }
  };

  const handleStart = () => {
    if (topSkill) {
      router.push(`/learn`);
    } else {
      router.push("/learn");
    }
  };

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-8">
      {/* Step indicator */}
      <div className="mb-8 flex items-center justify-center gap-2">
        {[1, 2].map((s) => (
          <div
            key={s}
            className={`h-1.5 rounded-full transition-all ${
              s <= step
                ? "w-8 bg-primary"
                : "w-4 bg-muted"
            }`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step-1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{
              type: "spring",
              stiffness: CARD_SPRING.stiffness,
              damping: CARD_SPRING.damping,
            }}
          >
            <CareerSelector
              careers={careers}
              onComplete={handleCareerComplete}
              loading={loading}
            />
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{
              type: "spring",
              stiffness: CARD_SPRING.stiffness,
              damping: CARD_SPRING.damping,
            }}
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
                    type: "spring",
                    stiffness: CARD_SPRING.stiffness,
                    damping: CARD_SPRING.damping,
                    delay: 0.15 + index * 0.08,
                  }}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
                >
                  <span className="text-xl">{skill.icon ?? "🎯"}</span>
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
