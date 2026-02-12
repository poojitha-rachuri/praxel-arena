import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { ensureUser } from "@/lib/auth/ensure-user";
import { DIMENSION_KEYS } from "@/lib/scoring/dimensions";
import { computeCareerMatches } from "@/lib/scoring/career-match";
import AppShell from "@/components/layout/AppShell";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage() {
  const baseUser = await ensureUser();
  if (!baseUser) redirect("/sign-in");

  // Run user data and recent attempts queries in parallel
  const [user, recentAttempts] = await Promise.all([
    prisma.user.findUnique({
      where: { id: baseUser.id },
      include: {
        skillScores: {
          include: {
            skill: {
              select: { id: true, name: true, slug: true, icon: true },
            },
          },
        },
        eloRatings: {
          include: {
            skill: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
        careerGoals: {
          include: {
            careerOutcome: {
              include: {
                skillMaps: {
                  include: {
                    skill: { select: { id: true } },
                  },
                },
              },
            },
          },
        },
      },
    }),
    prisma.sprintAttempt.findMany({
      where: { userId: baseUser.id, completedAt: { not: null } },
      orderBy: { completedAt: "desc" },
      take: 6, // +1 for cursor detection
      select: {
        id: true,
        mode: true,
        totalScore: true,
        completedAt: true,
        sprint: {
          select: {
            title: true,
            skill: { select: { name: true, slug: true, icon: true } },
          },
        },
      },
    }),
  ]);

  if (!user) redirect("/onboarding");

  // Aggregate scores across all skills (weighted by sprint count)
  const aggregateScores: Record<string, number> = {};
  let totalWeight = 0;

  for (const key of DIMENSION_KEYS) {
    aggregateScores[key] = 0;
  }

  for (const ss of user.skillScores) {
    const weight = ss.sprintCount || 1;
    totalWeight += weight;
    for (const key of DIMENSION_KEYS) {
      aggregateScores[key] += ss[key] * weight;
    }
  }

  if (totalWeight > 0) {
    for (const key of DIMENSION_KEYS) {
      aggregateScores[key] = Math.round(aggregateScores[key] / totalWeight);
    }
  }

  // Per-skill data
  const skills = user.skillScores.map((ss) => {
    const elo = user.eloRatings.find((e) => e.skillId === ss.skillId);
    return {
      name: ss.skill.name,
      slug: ss.skill.slug,
      icon: ss.skill.icon,
      score: Math.round(ss.overallScore),
      eloRating: elo?.rating ?? undefined,
    };
  });

  const hasMoreAttempts = recentAttempts.length > 5;
  const displayAttempts = hasMoreAttempts ? recentAttempts.slice(0, 5) : recentAttempts;
  const attemptCursor =
    hasMoreAttempts && displayAttempts.length > 0
      ? `${displayAttempts[displayAttempts.length - 1].completedAt?.toISOString()}_${displayAttempts[displayAttempts.length - 1].id}`
      : null;

  const attemptHistory = displayAttempts.map((a) => ({
    id: a.id,
    sprintTitle: a.sprint.title,
    skillName: a.sprint.skill.name,
    skillSlug: a.sprint.skill.slug,
    skillIcon: a.sprint.skill.icon,
    mode: a.mode,
    totalScore: Math.round(a.totalScore ?? 0),
    completedAt: a.completedAt?.toISOString() ?? null,
  }));

  // Career match percentages (using shared utility)
  const careerMatches = computeCareerMatches(
    user.skillScores.map((ss) => ({
      skillId: ss.skillId,
      overallScore: ss.overallScore,
    })),
    user.careerGoals.map((goal) => ({
      name: goal.careerOutcome.name,
      icon: goal.careerOutcome.icon,
      skillMaps: goal.careerOutcome.skillMaps.map((m) => ({
        skillId: m.skillId,
        weight: m.weight,
      })),
    }))
  );

  return (
    <AppShell>
      <ProfileClient
        user={{
          name: user.name,
          imageUrl: user.imageUrl,
        }}
        aggregateScores={aggregateScores}
        skills={skills}
        careerMatches={careerMatches}
        attemptHistory={attemptHistory}
        attemptCursor={attemptCursor}
        isOwnProfile
      />
    </AppShell>
  );
}
