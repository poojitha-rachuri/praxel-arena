import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { ensureUser } from "@/lib/auth/ensure-user";
import { DIMENSION_KEYS } from "@/lib/scoring/dimensions";
import AppShell from "@/components/layout/AppShell";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage() {
  const baseUser = await ensureUser();
  if (!baseUser) redirect("/sign-in");

  const user = await prisma.user.findUnique({
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
  });

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

  // Career match percentages
  const scoreLookup = new Map(
    user.skillScores.map((ss) => [ss.skillId, ss.overallScore])
  );

  const careerMatches = user.careerGoals.map((goal) => {
    const career = goal.careerOutcome;
    const mappings = career.skillMaps;

    if (mappings.length === 0) {
      return { name: career.name, icon: career.icon, matchPercentage: 0 };
    }

    let weightedSum = 0;
    let careerWeight = 0;

    for (const mapping of mappings) {
      const score = scoreLookup.get(mapping.skillId) ?? 0;
      weightedSum += score * mapping.weight;
      careerWeight += mapping.weight;
    }

    return {
      name: career.name,
      icon: career.icon,
      matchPercentage: careerWeight > 0 ? Math.round(weightedSum / careerWeight) : 0,
    };
  });

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
        isOwnProfile
      />
    </AppShell>
  );
}
