import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import {
  MATCHMAKING_INITIAL_RANGE,
  ELO_INITIAL_RATING,
} from "@/lib/utils/constants";

export async function POST(request: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { skillSlug?: string; duelId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    // Look up user
    const user = await prisma.user.findUnique({
      where: { clerkId },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // JOIN an existing duel
    if (body.duelId) {
      const duel = await prisma.duel.findUnique({
        where: { id: body.duelId },
        include: {
          skill: true,
          sprint: {
            include: {
              interactions: { orderBy: { order: "asc" } },
            },
          },
        },
      });

      if (!duel) {
        return NextResponse.json({ error: "Duel not found" }, { status: 404 });
      }

      if (duel.status !== "WAITING") {
        return NextResponse.json(
          { error: "Duel is no longer available to join" },
          { status: 400 }
        );
      }

      if (duel.player1Id === user.id) {
        return NextResponse.json(
          { error: "Cannot join your own duel" },
          { status: 400 }
        );
      }

      // Set player2 and status to IN_PROGRESS
      const updatedDuel = await prisma.duel.update({
        where: { id: duel.id },
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

      return NextResponse.json({ duel: updatedDuel, action: "joined" });
    }

    // CREATE a new duel (or find existing match)
    if (!body.skillSlug) {
      return NextResponse.json(
        { error: "skillSlug or duelId is required" },
        { status: 400 }
      );
    }

    const skill = await prisma.skill.findUnique({
      where: { slug: body.skillSlug },
    });
    if (!skill) {
      return NextResponse.json({ error: "Skill not found" }, { status: 404 });
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
        duel: existingWaiting,
        action: "already_waiting",
      });
    }

    // Find a waiting duel from another player within Elo range
    const waitingDuels = await prisma.duel.findMany({
      where: {
        skillId: skill.id,
        status: "WAITING",
        player1Id: { not: user.id },
      },
      include: {
        player1: {
          select: { id: true, name: true, imageUrl: true },
        },
      },
    });

    // Find best match within Elo range
    let bestMatch = null;
    let bestEloDiff = Infinity;

    for (const duel of waitingDuels) {
      const opponentElo = await prisma.userEloRating.findUnique({
        where: {
          userId_skillId: { userId: duel.player1Id, skillId: skill.id },
        },
      });
      const opponentRating = opponentElo?.rating ?? ELO_INITIAL_RATING;
      const diff = Math.abs(userRating - opponentRating);

      if (diff <= MATCHMAKING_INITIAL_RANGE && diff < bestEloDiff) {
        bestMatch = duel;
        bestEloDiff = diff;
      }
    }

    if (bestMatch) {
      // Join the matched duel
      const updatedDuel = await prisma.duel.update({
        where: { id: bestMatch.id },
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

      return NextResponse.json({ duel: updatedDuel, action: "matched" });
    }

    // No match found - find a COMPETE sprint for this skill to use
    let sprint = await prisma.sprint.findFirst({
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

    return NextResponse.json({ duel: newDuel, action: "created" });
  } catch (error) {
    console.error("Failed to handle duel:", error);
    return NextResponse.json(
      { error: "Failed to handle duel" },
      { status: 500 }
    );
  }
}
