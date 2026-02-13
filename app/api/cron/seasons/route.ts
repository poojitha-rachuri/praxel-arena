import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  ELO_INITIAL_RATING,
  ELO_RATING_FLOOR,
} from "@/lib/utils/constants";
import { SEASON_RESET_FACTOR } from "@/lib/gamification/constants";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const currentMonth = now.getUTCMonth() + 1; // 1-12
  const currentYear = now.getUTCFullYear();

  // ── Step 1: Close previous season ──

  const activeSeason = await prisma.eloSeason.findFirst({
    where: { isActive: true },
  });

  let closedSeasonId: string | null = null;

  if (activeSeason) {
    // Batch update all season stats with final Elo using raw SQL JOIN
    await prisma.$executeRaw`
      UPDATE "UserSeasonStats" uss
      SET "endElo" = uer."rating"
      FROM "UserEloRating" uer
      WHERE uss."userId" = uer."userId"
        AND uss."skillId" = uer."skillId"
        AND uss."eloSeasonId" = ${activeSeason.id}
    `;

    // Close season
    await prisma.eloSeason.update({
      where: { id: activeSeason.id },
      data: { isActive: false, seasonEnd: now },
    });

    closedSeasonId = activeSeason.id;
  }

  // ── Step 2: Soft reset Elo ──
  // Formula: newElo = 1200 + (currentElo - 1200) * SEASON_RESET_FACTOR

  // Batch Elo soft reset using raw SQL  -  avoids N+1 loop
  const resetResult = await prisma.$executeRaw`
    UPDATE "UserEloRating"
    SET "rating" = GREATEST(
      ${ELO_RATING_FLOOR},
      ROUND(${ELO_INITIAL_RATING} + ("rating" - ${ELO_INITIAL_RATING}) * ${SEASON_RESET_FACTOR})::int
    )
  `;
  const ratingsReset = resetResult;

  // ── Step 3: Create new season ──

  // Calculate season end (first day of next month)
  const seasonEnd = new Date(currentYear, currentMonth, 1); // JS months are 0-indexed, so this is first of next month

  const newSeason = await prisma.eloSeason.create({
    data: {
      month: currentMonth,
      year: currentYear,
      seasonStart: now,
      seasonEnd,
      isActive: true,
    },
  });

  // Create UserSeasonStats for all users with Elo ratings
  const freshRatings = await prisma.userEloRating.findMany({
    select: { userId: true, skillId: true, rating: true },
  });

  if (freshRatings.length > 0) {
    await prisma.userSeasonStats.createMany({
      data: freshRatings.map((r) => ({
        userId: r.userId,
        eloSeasonId: newSeason.id,
        skillId: r.skillId,
        startElo: r.rating,
        peakElo: r.rating,
      })),
      skipDuplicates: true,
    });
  }

  return NextResponse.json({
    closedSeason: closedSeasonId,
    ratingsReset,
    newSeasonId: newSeason.id,
    month: currentMonth,
    year: currentYear,
    statsCreated: freshRatings.length,
  });
}
