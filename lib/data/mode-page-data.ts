import "server-only";
import { prisma } from "@/lib/db";
import { computeCareerMatches, type CareerMatch } from "@/lib/scoring/career-match";
import type { SprintMode } from "@/app/generated/prisma/client";

export interface ModePageSkill {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
}

export interface SprintMeta {
  id: string;
  title: string;
  description: string | null;
  difficulty: number;
  level: number;
  levelLabel: string | null;
  order: number;
  skillId: string;
  interactionCount: number;
}

export interface ModePageData {
  skills: ModePageSkill[];
  sprints: SprintMeta[];
  completedSprints: Record<string, number>; // sprintId -> totalScore
  topCareerMatch: CareerMatch | null;
  completedSkillCount: number;
  totalSkillCount: number;
}

/**
 * Fetch all data needed for Learn/Practice mode pages in parallel.
 * Server-only function — eliminates N+1 client API calls.
 */
export async function getModePageData(
  userId: string,
  mode: SprintMode
): Promise<ModePageData> {
  const [skills, sprints, attempts, userData] = await Promise.all([
    prisma.skill.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        icon: true,
        description: true,
      },
      orderBy: { name: "asc" },
    }),
    prisma.sprint.findMany({
      where: {
        mode,
        ...(mode === "LEARN" ? { isGenerated: false } : {}),
      },
      select: {
        id: true,
        title: true,
        description: true,
        difficulty: true,
        level: true,
        levelLabel: true,
        order: true,
        skillId: true,
        _count: { select: { interactions: true } },
      },
      orderBy: [{ level: "asc" }, { order: "asc" }, { createdAt: "asc" }],
    }),
    prisma.sprintAttempt.findMany({
      where: { userId, mode, completedAt: { not: null } },
      select: { sprintId: true, totalScore: true },
      distinct: ["sprintId"],
      orderBy: { totalScore: "desc" },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        skillScores: {
          select: { skillId: true, overallScore: true },
        },
        careerGoals: {
          select: {
            careerOutcome: {
              select: {
                name: true,
                icon: true,
                skillMaps: {
                  select: { skillId: true, weight: true },
                },
              },
            },
          },
        },
      },
    }),
  ]);

  // Map sprints with interaction count
  const sprintMetas: SprintMeta[] = sprints.map((s) => ({
    id: s.id,
    title: s.title,
    description: s.description,
    difficulty: s.difficulty,
    level: s.level,
    levelLabel: s.levelLabel,
    order: s.order,
    skillId: s.skillId,
    interactionCount: s._count.interactions,
  }));

  // Build completion map (sprintId -> best totalScore)
  const completedSprints: Record<string, number> = {};
  for (const a of attempts) {
    if (a.totalScore !== null) {
      completedSprints[a.sprintId] = a.totalScore;
    }
  }

  // Career match computation
  const careerGoals = (userData?.careerGoals ?? []).map((g) => ({
    name: g.careerOutcome.name,
    icon: g.careerOutcome.icon,
    skillMaps: g.careerOutcome.skillMaps,
  }));
  const skillScores = (userData?.skillScores ?? []).map((ss) => ({
    skillId: ss.skillId,
    overallScore: ss.overallScore,
  }));

  const careerMatches = computeCareerMatches(skillScores, careerGoals);
  const topCareerMatch =
    careerMatches.length > 0
      ? careerMatches.reduce((a, b) =>
          a.matchPercentage >= b.matchPercentage ? a : b
        )
      : null;

  // Count skills the user has attempted
  const sprintSkillMap = new Map(sprints.map((s) => [s.id, s.skillId]));
  const attemptedSkillIds = new Set(
    attempts
      .map((a) => sprintSkillMap.get(a.sprintId))
      .filter(Boolean)
  );

  return {
    skills,
    sprints: sprintMetas,
    completedSprints,
    topCareerMatch,
    completedSkillCount: attemptedSkillIds.size,
    totalSkillCount: skills.length,
  };
}
