import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureUser } from "@/lib/auth/ensure-user";
import {
  MATCHMAKING_INITIAL_RANGE,
  ELO_INITIAL_RATING,
  DUEL_CREATION_RATE_LIMIT,
} from "@/lib/utils/constants";

/** Strip correctAnswer/insightAnswer from COMPETE sprint interactions before sending to client */
function sanitizeDuelForClient(duel: Record<string, unknown>) {
  const sprint = duel.sprint as Record<string, unknown> | null;
  if (!sprint || sprint.mode !== "COMPETE") return duel;
  const interactions = sprint.interactions as Record<string, unknown>[];
  return {
    ...duel,
    sprint: {
      ...sprint,
      interactions: interactions.map((i) => ({
        ...i,
        correctAnswer: null,
        insightAnswer: null,
      })),
    },
  };
}

export async function GET() {
  const user = await ensureUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {

    const duels = await prisma.duel.findMany({
      where: {
        OR: [{ player1Id: user.id }, { player2Id: user.id }],
      },
      include: {
        skill: { select: { name: true, slug: true, icon: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({ duels });
  } catch (error) {
    console.error("Failed to fetch duels:", error);
    return NextResponse.json(
      { error: "Failed to fetch duels" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const user = await ensureUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { skillSlug?: string; duelId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {

    // JOIN an existing duel
    if (body.duelId) {
      // Atomic check-and-update: only joins if still WAITING and not own duel
      try {
        const updatedDuel = await prisma.duel.update({
          where: {
            id: body.duelId,
            status: "WAITING",
            player1Id: { not: user.id },
          },
          data: {
            player2Id: user.id,
            status: "IN_PROGRESS",
          },
          include: {
            skill: true,
            sprint: {
              include: {
                interactions: { orderBy: { order: "asc" } },
              },
            },
            player1: {
              select: { id: true, name: true, imageUrl: true },
            },
            player2: {
              select: { id: true, name: true, imageUrl: true },
            },
          },
        });

        return NextResponse.json({ duel: sanitizeDuelForClient(updatedDuel as unknown as Record<string, unknown>), action: "joined" });
      } catch {
        // Update failed = duel not found, already taken, or is own duel
        return NextResponse.json(
          { error: "Duel is not available to join" },
          { status: 400 }
        );
      }
    }

    // CREATE a new duel (or find existing match)
    if (!body.skillSlug) {
      return NextResponse.json(
        { error: "skillSlug or duelId is required" },
        { status: 400 }
      );
    }

    // Rate limit duel creation
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const [skill, recentDuelCount] = await Promise.all([
      prisma.skill.findUnique({ where: { slug: body.skillSlug } }),
      prisma.duel.count({
        where: { player1Id: user.id, createdAt: { gte: oneHourAgo } },
      }),
    ]);

    if (!skill) {
      return NextResponse.json({ error: "Skill not found" }, { status: 404 });
    }

    if (recentDuelCount >= DUEL_CREATION_RATE_LIMIT) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Try again later.", retryAfter: 3600 },
        { status: 429 }
      );
    }

    // Get user's Elo for this skill
    const userElo = await prisma.userEloRating.findUnique({
      where: {
        userId_skillId: { userId: user.id, skillId: skill.id },
      },
    });
    const userRating = userElo?.rating ?? ELO_INITIAL_RATING;

    // Check if user already has a waiting duel for this skill
    const existingWaiting = await prisma.duel.findFirst({
      where: {
        player1Id: user.id,
        skillId: skill.id,
        status: "WAITING",
      },
      include: {
        skill: true,
        sprint: {
          include: {
            interactions: { orderBy: { order: "asc" } },
          },
        },
      },
    });

    if (existingWaiting) {
      return NextResponse.json({
        duel: sanitizeDuelForClient(existingWaiting as unknown as Record<string, unknown>),
        action: "already_waiting",
      });
    }

    // Find a waiting duel from another player within Elo range
    // Batch-fetch player Elo ratings via include to avoid N+1 queries
    const waitingDuels = await prisma.duel.findMany({
      where: {
        skillId: skill.id,
        status: "WAITING",
        player1Id: { not: user.id },
      },
      include: {
        player1: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
            eloRatings: {
              where: { skillId: skill.id },
              select: { rating: true },
            },
          },
        },
      },
    });

    // Find best match within Elo range (no additional queries needed)
    let bestMatch = null;
    let bestEloDiff = Infinity;

    for (const duel of waitingDuels) {
      const opponentRating =
        duel.player1.eloRatings[0]?.rating ?? ELO_INITIAL_RATING;
      const diff = Math.abs(userRating - opponentRating);

      if (diff <= MATCHMAKING_INITIAL_RANGE && diff < bestEloDiff) {
        bestMatch = duel;
        bestEloDiff = diff;
      }
    }

    if (bestMatch) {
      // Atomic join: only succeeds if duel is still WAITING
      try {
        const updatedDuel = await prisma.duel.update({
          where: { id: bestMatch.id, status: "WAITING" },
          data: {
            player2Id: user.id,
            status: "IN_PROGRESS",
          },
          include: {
            skill: true,
            sprint: {
              include: {
                interactions: { orderBy: { order: "asc" } },
              },
            },
            player1: {
              select: { id: true, name: true, imageUrl: true },
            },
            player2: {
              select: { id: true, name: true, imageUrl: true },
            },
          },
        });

        return NextResponse.json({ duel: sanitizeDuelForClient(updatedDuel as unknown as Record<string, unknown>), action: "matched" });
      } catch {
        // Another user took this duel first -- fall through to create new
      }
    }

    // No match found - find a COMPETE sprint for this skill to use
    const sprint = await prisma.sprint.findFirst({
      where: {
        skillId: skill.id,
        mode: "COMPETE",
      },
      include: {
        interactions: { orderBy: { order: "asc" } },
      },
    });

    // Create a new waiting duel
    const newDuel = await prisma.duel.create({
      data: {
        skillId: skill.id,
        sprintId: sprint?.id ?? null,
        player1Id: user.id,
        status: "WAITING",
      },
      include: {
        skill: true,
        sprint: {
          include: {
            interactions: { orderBy: { order: "asc" } },
          },
        },
        player1: {
          select: { id: true, name: true, imageUrl: true },
        },
      },
    });

    return NextResponse.json({ duel: sanitizeDuelForClient(newDuel as unknown as Record<string, unknown>), action: "created" });
  } catch (error) {
    console.error("Failed to handle duel:", error);
    return NextResponse.json(
      { error: "Failed to handle duel" },
      { status: 500 }
    );
  }
}
