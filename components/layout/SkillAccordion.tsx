"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronRight, Check, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { CARD_SPRING } from "@/lib/utils/constants";
import Link from "next/link";
import type { ModePageSkill, TopicMeta, SprintMeta } from "@/lib/data/mode-page-data";

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
  topics: TopicMeta[];
  sprints: SprintMeta[];
  mode: "LEARN" | "PRACTICE";
  basePath: string;
  initialSkill?: string;
  completedSprints?: Record<string, number>; // sprintId -> totalScore
}

export default function SkillAccordion({
  skills,
  topics,
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

  // Build lookups
  const skillById = new Map(skills.map((s) => [s.id, s]));
  const topicsBySkillId = new Map<string, TopicMeta[]>();
  for (const topic of topics) {
    if (!topicsBySkillId.has(topic.skillId)) {
      topicsBySkillId.set(topic.skillId, []);
    }
    topicsBySkillId.get(topic.skillId)!.push(topic);
  }

  // Group sprints by topicId (and by skill for sprints without topics)
  const sprintsByTopicId = new Map<string, SprintMeta[]>();
  const sprintsBySkillNoTopic = new Map<string, SprintMeta[]>();
  for (const sprint of sprints) {
    if (sprint.topicId) {
      if (!sprintsByTopicId.has(sprint.topicId)) {
        sprintsByTopicId.set(sprint.topicId, []);
      }
      sprintsByTopicId.get(sprint.topicId)!.push(sprint);
    } else {
      if (!sprintsBySkillNoTopic.has(sprint.skillId)) {
        sprintsBySkillNoTopic.set(sprint.skillId, []);
      }
      sprintsBySkillNoTopic.get(sprint.skillId)!.push(sprint);
    }
  }

  // Count sprints per skill for progress
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
        const skillTopics = topicsBySkillId.get(skill.id) ?? [];
        const orphanSprints = sprintsBySkillNoTopic.get(skill.id) ?? [];
        const hasContent = totalCount > 0 || skillTopics.length > 0;

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
              {totalCount > 0 ? (
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
              ) : skillTopics.length > 0 ? (
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  Coming soon
                </span>
              ) : null}

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
                    {!hasContent ? (
                      <p className="py-6 text-center text-sm text-muted-foreground">
                        No {mode.toLowerCase()} sprints available yet.
                      </p>
                    ) : (
                      <>
                        {/* Topics with sprints */}
                        {skillTopics.map((topic, topicIdx) => {
                          const topicSprints =
                            sprintsByTopicId.get(topic.id) ?? [];
                          const topicCompletedCount = topicSprints.filter(
                            (s) => s.id in completedSprints
                          ).length;
                          const isTopicComplete =
                            topicSprints.length > 0 &&
                            topicCompletedCount === topicSprints.length;

                          return (
                            <div key={topic.id}>
                              {/* Topic header */}
                              <div className="flex items-center gap-3 px-3 pt-4 pb-2">
                                <span
                                  className={cn(
                                    "inline-flex items-center justify-center size-5 rounded text-[10px] font-bold",
                                    isTopicComplete
                                      ? "bg-success/15 text-success"
                                      : "bg-primary/10 text-primary"
                                  )}
                                >
                                  {isTopicComplete ? (
                                    <Check className="size-3" />
                                  ) : (
                                    topic.order
                                  )}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-foreground/80">
                                    {topic.icon ? `${topic.icon} ` : ""}
                                    {topic.name}
                                  </span>
                                  {topic.description && (
                                    <p className="text-[10px] text-muted-foreground/60 line-clamp-1 mt-0.5">
                                      {topic.description}
                                    </p>
                                  )}
                                </div>
                                {topicSprints.length > 0 && (
                                  <span className="text-[10px] text-muted-foreground/60 tabular-nums">
                                    {topicCompletedCount}/{topicSprints.length}
                                  </span>
                                )}
                              </div>

                              {/* "Start here" callout for first topic with no completions */}
                              {topicIdx === 0 &&
                                completedCount === 0 &&
                                topicSprints.length > 0 && (
                                  <div className="mx-3 mb-2 rounded-lg bg-primary/[0.06] border border-primary/15 px-3 py-1.5">
                                    <p className="text-[10px] font-medium text-primary">
                                      Start here
                                    </p>
                                  </div>
                                )}

                              {/* Sprint rows for this topic */}
                              {topicSprints.length > 0 ? (
                                <div className="flex flex-col gap-1">
                                  {topicSprints.map(
                                    (sprint, sprintIndex) => (
                                      <SprintRow
                                        key={sprint.id}
                                        sprint={sprint}
                                        skill={skill}
                                        basePath={basePath}
                                        completedSprints={completedSprints}
                                        isCurrent={
                                          !(sprint.id in completedSprints) &&
                                          topicSprints
                                            .slice(0, sprintIndex)
                                            .every(
                                              (s) =>
                                                s.id in completedSprints
                                            )
                                        }
                                      />
                                    )
                                  )}
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 mx-3 mb-2 py-2 text-muted-foreground/40">
                                  <Lock className="size-3" />
                                  <span className="text-[10px]">
                                    Content coming soon
                                  </span>
                                </div>
                              )}

                              {/* Divider between topics */}
                              {topicIdx < skillTopics.length - 1 && (
                                <div className="mx-3 my-1 h-px bg-border/30" />
                              )}
                            </div>
                          );
                        })}

                        {/* Orphan sprints (no topic assigned) */}
                        {orphanSprints.length > 0 && (
                          <div>
                            {skillTopics.length > 0 && (
                              <div className="flex items-center gap-3 px-3 pt-4 pb-2">
                                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                                  Other
                                </span>
                                <div className="flex-1 h-px bg-border/40" />
                              </div>
                            )}
                            <div className="flex flex-col gap-1">
                              {orphanSprints.map(
                                (sprint, sprintIndex) => (
                                  <SprintRow
                                    key={sprint.id}
                                    sprint={sprint}
                                    skill={skill}
                                    basePath={basePath}
                                    completedSprints={completedSprints}
                                    isCurrent={
                                      !(sprint.id in completedSprints) &&
                                      orphanSprints
                                        .slice(0, sprintIndex)
                                        .every(
                                          (s) => s.id in completedSprints
                                        )
                                    }
                                  />
                                )
                              )}
                            </div>
                          </div>
                        )}
                      </>
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

// ─── Sprint Row Component ────────────────────────────────────────────────────

function SprintRow({
  sprint,
  skill,
  basePath,
  completedSprints,
  isCurrent,
}: {
  sprint: SprintMeta;
  skill: ModePageSkill;
  basePath: string;
  completedSprints: Record<string, number>;
  isCurrent: boolean;
}) {
  const isCompleted = sprint.id in completedSprints;
  const score = completedSprints[sprint.id];

  return (
    <Link
      href={`${basePath}/${skill.slug}/${sprint.id}`}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 min-h-[52px] transition-colors",
        isCompleted && "bg-success/[0.03]",
        isCurrent && "bg-primary/[0.05] ring-1 ring-primary/20",
        !isCompleted && !isCurrent && "hover:bg-surface-2"
      )}
    >
      {/* Status indicator */}
      <div
        className={cn(
          "size-6 rounded-full flex items-center justify-center shrink-0",
          isCompleted && "bg-success/15",
          isCurrent && "ring-2 ring-primary/40 bg-primary/10",
          !isCompleted && !isCurrent && "border border-border/60"
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
            isCompleted && "text-muted-foreground"
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
      {isCompleted && score !== undefined && (
        <span className="text-[11px] font-bold text-success tabular-nums">
          {Math.round(score)}%
        </span>
      )}

      <ChevronRight className="size-4 text-muted-foreground shrink-0" />
    </Link>
  );
}
