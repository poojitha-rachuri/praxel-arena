"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { CARD_SPRING } from "@/lib/utils/constants";
import Link from "next/link";
import type { ModePageSkill, SprintMeta } from "@/lib/data/mode-page-data";

// Skill accent colors for left border
const SKILL_ACCENTS: Record<string, string> = {
  guesstimation: "border-l-amber-500",
  "data-interpretation": "border-l-sky-500",
  "gtm-strategy": "border-l-emerald-500",
  "pricing-monetization": "border-l-violet-500",
  prioritization: "border-l-rose-500",
  "stakeholder-communication": "border-l-teal-500",
};

interface SkillAccordionProps {
  skills: ModePageSkill[];
  sprints: SprintMeta[];
  mode: "LEARN" | "PRACTICE";
  basePath: string;
  initialSkill?: string;
  completedSprints?: Record<string, number>; // sprintId -> totalScore
}

export default function SkillAccordion({
  skills,
  sprints,
  mode,
  basePath,
  initialSkill,
  completedSprints = {},
}: SkillAccordionProps) {
  // Validate initialSkill against known slugs
  const validSlugs = new Set(skills.map((s) => s.slug));
  const [expandedSlug, setExpandedSlug] = useState<string | undefined>(
    initialSkill && validSlugs.has(initialSkill) ? initialSkill : undefined
  );
  const expandedRef = useRef<HTMLDivElement>(null);

  // Auto-scroll when expanding
  useEffect(() => {
    if (expandedSlug && expandedRef.current) {
      const timer = setTimeout(() => {
        expandedRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [expandedSlug]);

  function toggleSkill(slug: string) {
    setExpandedSlug((prev) => (prev === slug ? undefined : slug));
  }

  // Group sprints by skill
  // Build skill lookup by ID for O(1) access
  const skillById = new Map(skills.map((s) => [s.id, s]));
  const sprintsBySkill = new Map<string, SprintMeta[]>();
  for (const sprint of sprints) {
    const skill = skillById.get(sprint.skillId);
    if (!skill) continue;
    if (!sprintsBySkill.has(skill.slug)) {
      sprintsBySkill.set(skill.slug, []);
    }
    sprintsBySkill.get(skill.slug)!.push(sprint);
  }

  return (
    <div className="flex flex-col gap-2">
      {skills.map((skill, index) => {
        const isExpanded = expandedSlug === skill.slug;
        const skillSprints = sprintsBySkill.get(skill.slug) ?? [];
        const completedCount = skillSprints.filter(
          (s) => s.id in completedSprints
        ).length;
        const totalCount = skillSprints.length;
        const accentClass =
          SKILL_ACCENTS[skill.slug] ?? "border-l-primary";

        // Group sprints by level
        const levels = new Map<
          number,
          { label: string; sprints: SprintMeta[] }
        >();
        for (const sprint of skillSprints) {
          if (!levels.has(sprint.level)) {
            levels.set(sprint.level, {
              label: sprint.levelLabel ?? `Level ${sprint.level}`,
              sprints: [],
            });
          }
          levels.get(sprint.level)!.sprints.push(sprint);
        }

        return (
          <motion.div
            key={skill.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: CARD_SPRING.stiffness,
              damping: CARD_SPRING.damping,
              delay: index * 0.05,
            }}
            ref={isExpanded ? expandedRef : undefined}
          >
            {/* Accordion header */}
            <button
              onClick={() => toggleSkill(skill.slug)}
              className={cn(
                "w-full flex items-center gap-3 rounded-xl px-4 py-3 min-h-[56px] text-left transition-all border-l-[3px]",
                accentClass,
                isExpanded
                  ? "bg-surface-1 ring-1 ring-border"
                  : "bg-surface-1 hover:bg-surface-2"
              )}
              style={{
                boxShadow: isExpanded
                  ? undefined
                  : "inset 0 0 0 1px oklch(1 0 0 / 8%)",
              }}
            >
              <span className="text-xl shrink-0">
                {skill.icon ?? "🎯"}
              </span>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold leading-tight truncate">
                  {skill.name}
                </p>
                {!isExpanded && skill.description && (
                  <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                    {skill.description}
                  </p>
                )}
              </div>

              {/* Progress indicator */}
              {totalCount > 0 && (
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] font-medium text-muted-foreground tabular-nums">
                    {completedCount}/{totalCount}
                  </span>
                  <div className="w-12 h-1 rounded-full bg-border overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{
                        width: `${(completedCount / totalCount) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              <motion.div
                animate={{ rotate: isExpanded ? 90 : 0 }}
                transition={{ duration: 0.15 }}
              >
                <ChevronRight className="size-4 text-muted-foreground shrink-0" />
              </motion.div>
            </button>

            {/* Expanded content */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{
                    height: {
                      type: "spring",
                      stiffness: CARD_SPRING.stiffness,
                      damping: 30,
                    },
                    opacity: { duration: 0.2 },
                  }}
                  className="overflow-hidden"
                >
                  <div className="rounded-b-xl bg-background border border-t-0 border-border/50 px-3 pb-3 pt-2">
                    {skillSprints.length === 0 ? (
                      <p className="py-6 text-center text-sm text-muted-foreground">
                        No {mode.toLowerCase()} sprints available yet.
                      </p>
                    ) : (
                      Array.from(levels.entries()).map(
                        ([levelNum, levelData]) => (
                          <div key={levelNum}>
                            {/* Level divider */}
                            {levels.size > 1 && (
                              <div className="flex items-center gap-3 px-3 pt-4 pb-2">
                                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                                  Level {levelNum}
                                </span>
                                <span className="text-[10px] text-muted-foreground/60">
                                  {levelData.label}
                                </span>
                                <div className="flex-1 h-px bg-border/40" />
                              </div>
                            )}

                            {/* Sprint rows */}
                            <div className="flex flex-col gap-1">
                              {levelData.sprints.map(
                                (sprint, sprintIndex) => {
                                  const isCompleted =
                                    sprint.id in completedSprints;
                                  const score = completedSprints[sprint.id];
                                  // "Current" = first non-completed sprint
                                  const isCurrent =
                                    !isCompleted &&
                                    levelData.sprints
                                      .slice(0, sprintIndex)
                                      .every(
                                        (s) => s.id in completedSprints
                                      );

                                  return (
                                    <Link
                                      key={sprint.id}
                                      href={`${basePath}/${skill.slug}/${sprint.id}`}
                                      className={cn(
                                        "flex items-center gap-3 rounded-lg px-3 py-2.5 min-h-[52px] transition-colors",
                                        isCompleted && "bg-success/[0.03]",
                                        isCurrent &&
                                          "bg-primary/[0.05] ring-1 ring-primary/20",
                                        !isCompleted &&
                                          !isCurrent &&
                                          "hover:bg-surface-2"
                                      )}
                                    >
                                      {/* Status indicator */}
                                      <div
                                        className={cn(
                                          "size-6 rounded-full flex items-center justify-center shrink-0",
                                          isCompleted &&
                                            "bg-success/15",
                                          isCurrent &&
                                            "ring-2 ring-primary/40 bg-primary/10",
                                          !isCompleted &&
                                            !isCurrent &&
                                            "border border-border/60"
                                        )}
                                      >
                                        {isCompleted ? (
                                          <Check className="size-3.5 text-success" />
                                        ) : isCurrent ? (
                                          <span className="size-2 rounded-full bg-primary animate-pulse" />
                                        ) : null}
                                      </div>

                                      <div className="flex-1 min-w-0">
                                        <p
                                          className={cn(
                                            "text-sm font-medium leading-tight truncate",
                                            isCompleted &&
                                              "text-muted-foreground"
                                          )}
                                        >
                                          {sprint.title}
                                        </p>
                                        {sprint.description && (
                                          <p className="mt-0.5 text-xs text-muted-foreground/70 line-clamp-1">
                                            {sprint.description}
                                          </p>
                                        )}
                                      </div>

                                      {/* Score badge for completed */}
                                      {isCompleted &&
                                        score !== undefined && (
                                          <span className="text-[11px] font-bold text-success tabular-nums">
                                            {Math.round(score)}%
                                          </span>
                                        )}

                                      <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                                    </Link>
                                  );
                                }
                              )}
                            </div>
                          </div>
                        )
                      )
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}
