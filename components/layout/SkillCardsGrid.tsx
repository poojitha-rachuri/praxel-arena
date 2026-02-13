"use client";

import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { CARD_SPRING } from "@/lib/utils/constants";
import type { ModePageSkill, SprintMeta } from "@/lib/data/mode-page-data";

interface SkillCardsGridProps {
  skills: ModePageSkill[];
  sprints: SprintMeta[];
  completedSprints: Record<string, number>;
  basePath: string;
}

export default function SkillCardsGrid({
  skills,
  sprints,
  completedSprints,
  basePath,
}: SkillCardsGridProps) {
  const router = useRouter();

  // Build per-skill sprint counts
  const skillSprintCounts = new Map<string, { total: number; completed: number }>();
  for (const sprint of sprints) {
    const entry = skillSprintCounts.get(sprint.skillId) ?? { total: 0, completed: 0 };
    entry.total++;
    if (completedSprints[sprint.id] !== undefined) {
      entry.completed++;
    }
    skillSprintCounts.set(sprint.skillId, entry);
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {skills.map((skill, i) => {
        const counts = skillSprintCounts.get(skill.id) ?? { total: 0, completed: 0 };
        const progress = counts.total > 0 ? counts.completed / counts.total : 0;

        return (
          <motion.button
            key={skill.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, type: "spring", ...CARD_SPRING }}
            whileTap={{ scale: 0.96 }}
            onClick={() => router.push(`${basePath}/${skill.slug}`)}
            className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-4 text-center transition-colors hover:border-primary/30 hover:bg-primary/5 min-h-[120px]"
          >
            {/* Skill icon with progress ring */}
            <div className="relative flex items-center justify-center">
              <svg width="56" height="56" viewBox="0 0 56 56" className="absolute">
                {/* Background track */}
                <circle
                  cx="28"
                  cy="28"
                  r="24"
                  fill="none"
                  strokeWidth="3"
                  className="stroke-muted"
                />
                {/* Progress arc */}
                {progress > 0 && (
                  <circle
                    cx="28"
                    cy="28"
                    r="24"
                    fill="none"
                    strokeWidth="3"
                    strokeLinecap="round"
                    className="stroke-primary"
                    strokeDasharray={`${progress * 150.8} 150.8`}
                    transform="rotate(-90 28 28)"
                  />
                )}
              </svg>
              <span className="text-2xl" role="img" aria-label={skill.name}>
                {skill.icon || "📊"}
              </span>
            </div>

            {/* Skill name */}
            <span className="text-xs font-semibold leading-tight line-clamp-2">
              {skill.name}
            </span>

            {/* Sprint count */}
            <span className="text-[10px] text-muted-foreground tabular-nums">
              {counts.completed}/{counts.total}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
