import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { DIMENSION_KEYS } from "@/lib/scoring/dimensions";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
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
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        imageUrl: user.imageUrl,
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
    });
  } catch (error) {
    console.error("Failed to fetch public profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}
