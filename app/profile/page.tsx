import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { ensureUser } from "@/lib/auth/ensure-user";
import { DIMENSION_KEYS } from "@/lib/scoring/dimensions";
import { computeCareerMatches } from "@/lib/scoring/career-match";
import {
  xpForLevel,
  titleForLevel,
  LEAGUE_TIERS,
} from "@/lib/gamification/constants";
import AppShell from "@/components/layout/AppShell";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage() {
  const baseUser = await ensureUser();
  if (!baseUser) redirect("/sign-in");

  // Run user data, recent attempts, credentials, and duels queries in parallel
  const [user, recentAttempts, credentials, duels] = await Promise.all([
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
    prisma.credential.findMany({
      where: { userId: baseUser.id },
      include: { skill: { select: { name: true, slug: true, icon: true } } },
      orderBy: { grantedAt: "desc" },
    }),
    prisma.duel.findMany({
      where: {
        OR: [{ player1Id: baseUser.id }, { player2Id: baseUser.id }],
        status: "COMPLETED",
      },
      select: {
        id: true,
        winnerId: true,
        player1Id: true,
        eloChange: true,
        completedAt: true,
        skill: { select: { name: true, slug: true, icon: true } },
      },
      orderBy: { completedAt: "desc" },
      take: 10,
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
      slug: goal.careerOutcome.slug,
      icon: goal.careerOutcome.icon,
      skillMaps: goal.careerOutcome.skillMaps.map((m) => ({
        skillId: m.skillId,
        weight: m.weight,
      })),
    }))
  );

  // Ensure referral code exists (race-safe: conditional update + unique constraint handling)
  let referralCode = user.referralCode;
  if (!referralCode) {
    const randomPart = crypto.randomUUID().slice(0, 6).toUpperCase();
    const code = `PA-${user.id.slice(-6).toUpperCase()}-${randomPart}`;
    try {
      // Conditional update: only sets code if referralCode is still null
      const updated = await prisma.user.updateMany({
        where: { id: user.id, referralCode: { equals: null } },
        data: { referralCode: code },
      });
      if (updated.count > 0) {
        referralCode = code;
      } else {
        // Another request set it first — re-fetch
        const refreshed = await prisma.user.findUnique({
          where: { id: user.id },
          select: { referralCode: true },
        });
        referralCode = refreshed?.referralCode ?? code;
      }
    } catch {
      // Another request generated the code concurrently — re-fetch it
      const refreshed = await prisma.user.findUnique({
        where: { id: user.id },
        select: { referralCode: true },
      });
      referralCode = refreshed?.referralCode ?? code;
    }
  }

  // Gamification data
  const currentLevelXp = xpForLevel(user.level);
  const nextLevelXp = xpForLevel(user.level + 1);
  const xpProgress = Math.max(0, user.xp - currentLevelXp);
  const xpNeeded = nextLevelXp - currentLevelXp;
  const tierConfig = LEAGUE_TIERS[user.leagueTier];

  const gamification = {
    xp: user.xp,
    level: user.level,
    title: user.title ?? titleForLevel(user.level),
    xpProgress,
    xpNeeded,
    progressPercent:
      xpNeeded > 0 ? Math.round((xpProgress / xpNeeded) * 100) : 100,
    currentStreak: user.currentStreak,
    longestStreak: user.longestStreak,
    leagueTier: user.leagueTier,
    leagueTierName: tierConfig?.name ?? "Rookie",
    weeklyXp: user.weeklyXp,
    credentials: credentials.map((c) => ({
      id: c.id,
      type: c.type,
      skillName: c.skill.name,
      skillSlug: c.skill.slug,
      skillIcon: c.skill.icon,
      eloAtGrant: c.eloAtGrant,
      grantedAt: c.grantedAt.toISOString(),
      verificationCode: c.verificationCode,
    })),
  };

  return (
    <AppShell>
      <ProfileClient
        user={{
          name: user.name,
          imageUrl: user.imageUrl,
          id: user.id,
        }}
        aggregateScores={aggregateScores}
        skills={skills}
        careerMatches={careerMatches}
        attemptHistory={attemptHistory}
        attemptCursor={attemptCursor}
        gamification={gamification}
        isOwnProfile
        referralCode={referralCode}
        duelHistory={duels.map((d) => ({
          id: d.id,
          skillName: d.skill.name,
          skillSlug: d.skill.slug,
          skillIcon: d.skill.icon,
          completedAt: d.completedAt?.toISOString() ?? null,
          eloChange: d.eloChange,
          isWinner: d.winnerId === baseUser.id,
          isDraw: d.winnerId === null,
        }))}
      />
    </AppShell>
  );
}
