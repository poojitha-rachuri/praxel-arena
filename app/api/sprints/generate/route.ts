import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { generateSprint } from "@/lib/ai/generate";
import { SPRINT_GENERATION_RATE_LIMIT } from "@/lib/utils/constants";
import type { InteractionType } from "@/app/generated/prisma/client";

export async function POST(request: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { skillSlug?: string; difficulty?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { skillSlug, difficulty = 3 } = body;

  if (!skillSlug) {
    return NextResponse.json(
      { error: "skillSlug is required" },
      { status: 400 }
    );
  }

  if (difficulty < 1 || difficulty > 5) {
    return NextResponse.json(
      { error: "difficulty must be between 1 and 5" },
      { status: 400 }
    );
  }

  try {
    // Look up user
    const user = await prisma.user.findUnique({
      where: { clerkId },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Look up skill
    const skill = await prisma.skill.findUnique({
      where: { slug: skillSlug },
    });
    if (!skill) {
      return NextResponse.json({ error: "Skill not found" }, { status: 404 });
    }

    // Rate limit: check SprintAttempt count in last hour where mode = COMPETE
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentAttempts = await prisma.sprintAttempt.count({
      where: {
        userId: user.id,
        mode: "COMPETE",
        startedAt: { gte: oneHourAgo },
      },
    });

    if (recentAttempts >= SPRINT_GENERATION_RATE_LIMIT) {
      return NextResponse.json(
        {
          error: `Rate limit exceeded. Maximum ${SPRINT_GENERATION_RATE_LIMIT} compete sprints per hour.`,
          retryAfter: 3600,
        },
        { status: 429 }
      );
    }

    // Get user's Elo for difficulty calibration
    const userElo = await prisma.userEloRating.findUnique({
      where: {
        userId_skillId: { userId: user.id, skillId: skill.id },
      },
    });

    // Generate sprint via AI
    let sprintData;
    try {
      sprintData = await generateSprint(
        skill.name,
        skill.description ?? "",
        "COMPETE",
        difficulty,
        { playerElo: userElo?.rating ?? 1200 }
      );
    } catch (aiError) {
      console.error("AI generation failed, using fallback:", aiError);
      // Fallback: try to find an existing COMPETE sprint for this skill
      const fallbackSprint = await prisma.sprint.findFirst({
        where: {
          skillId: skill.id,
          mode: "COMPETE",
        },
        include: {
          interactions: {
            orderBy: { order: "asc" },
          },
        },
      });

      if (fallbackSprint) {
        return NextResponse.json({ sprint: fallbackSprint, generated: false });
      }

      // If no fallback exists either, return the AI error
      return NextResponse.json(
        { error: "Failed to generate sprint. Please try again." },
        { status: 503 }
      );
    }

    // Save generated sprint to DB
    const sprint = await prisma.sprint.create({
      data: {
        skillId: skill.id,
        mode: "COMPETE",
        title: sprintData.title,
        description: null,
        isGenerated: true,
        difficulty,
        interactions: {
          create: sprintData.interactions.map((interaction) => ({
            skillId: skill.id,
            type: interaction.type as InteractionType,
            order: interaction.order,
            prompt: interaction.prompt,
            options: interaction.options,
            correctAnswer: interaction.correctAnswer ?? null,
            insightAnswer: interaction.insightAnswer ?? null,
            teachingPreamble: interaction.teachingPreamble ?? null,
            priorContext: interaction.priorContext ?? null,
            timeTarget: interaction.timeTarget,
          })),
        },
      },
      include: {
        interactions: {
          orderBy: { order: "asc" },
        },
      },
    });

    return NextResponse.json({ sprint, generated: true });
  } catch (error) {
    console.error("Failed to generate sprint:", error);
    return NextResponse.json(
      { error: "Failed to generate sprint" },
      { status: 500 }
    );
  }
}
