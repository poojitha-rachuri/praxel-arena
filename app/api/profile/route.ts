import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { DIMENSION_KEYS } from "@/lib/scoring/dimensions";

export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { clerkId },
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
              select: { id: true, name: true, slug: true, icon: true },
            },
          },
        },
        careerGoals: {
          include: {
            careerOutcome: {
              select: {
                id: true,
                name: true,
                slug: true,
                icon: true,
                description: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Calculate career match percentages
    const careerMatches = await calculateCareerMatches(user.id, user.careerGoals);

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        imageUrl: user.imageUrl,
        onboardingComplete: user.onboardingComplete,
        createdAt: user.createdAt,
      },
      skillScores: user.skillScores.map((ss) => ({
        skill: ss.skill,
        scores: Object.fromEntries(
          DIMENSION_KEYS.map((key) => [key, ss[key]])
        ),
        overallScore: ss.overallScore,
        sprintCount: ss.sprintCount,
      })),
      eloRatings: user.eloRatings.map((er) => ({
        skill: er.skill,
        rating: er.rating,
        matchCount: er.matchCount,
      })),
      careerGoals: user.careerGoals.map((cg) => cg.careerOutcome),
      careerMatches,
    });
  } catch (error) {
    console.error("Failed to fetch profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { careerOutcomeIds?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { careerOutcomeIds } = body;

  if (
    !careerOutcomeIds ||
    !Array.isArray(careerOutcomeIds) ||
    careerOutcomeIds.length === 0
  ) {
    return NextResponse.json(
      { error: "careerOutcomeIds array is required" },
      { status: 400 }
    );
  }

  try {
    const user = await prisma.user.findUnique({
      where: { clerkId },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify all career outcomes exist
    const careers = await prisma.careerOutcome.findMany({
      where: { id: { in: careerOutcomeIds } },
    });
    if (careers.length !== careerOutcomeIds.length) {
      return NextResponse.json(
        { error: "One or more career outcome IDs are invalid" },
        { status: 400 }
      );
    }

    // Delete existing career goals and recreate
    await prisma.userCareerGoal.deleteMany({
      where: { userId: user.id },
    });

    await prisma.userCareerGoal.createMany({
      data: careerOutcomeIds.map((careerOutcomeId) => ({
        userId: user.id,
        careerOutcomeId,
      })),
    });

    // Mark onboarding as complete
    await prisma.user.update({
      where: { id: user.id },
      data: { onboardingComplete: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}

async function calculateCareerMatches(
  userId: string,
  careerGoals: { careerOutcome: { id: string; name: string; slug: string; icon: string | null; description: string } }[]
) {
  if (careerGoals.length === 0) return [];

  // Get all user skill scores
  const skillScores = await prisma.userSkillScore.findMany({
    where: { userId },
  });

  if (skillScores.length === 0) {
    return careerGoals.map((cg) => ({
      careerOutcome: cg.careerOutcome,
      matchPercentage: 0,
    }));
  }

  // Get all skill-career mappings for the user's career goals
  const careerIds = careerGoals.map((cg) => cg.careerOutcome.id);
  const skillCareerMaps = await prisma.skillCareerMap.findMany({
    where: { careerOutcomeId: { in: careerIds } },
  });

  // Build score lookup: skillId -> overallScore
  const scoreLookup = new Map(
    skillScores.map((ss) => [ss.skillId, ss.overallScore])
  );

  // Calculate weighted average for each career
  return careerGoals.map((cg) => {
    const maps = skillCareerMaps.filter(
      (m) => m.careerOutcomeId === cg.careerOutcome.id
    );
    if (maps.length === 0) {
      return { careerOutcome: cg.careerOutcome, matchPercentage: 0 };
    }

    let weightedSum = 0;
    let totalWeight = 0;

    for (const map of maps) {
      const score = scoreLookup.get(map.skillId) ?? 0;
      weightedSum += score * map.weight;
      totalWeight += map.weight;
    }

    const matchPercentage =
      totalWeight > 0
        ? Math.round((weightedSum / totalWeight) * 10) / 10
        : 0;

    return { careerOutcome: cg.careerOutcome, matchPercentage };
  });
}
