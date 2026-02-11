import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { evaluateAttempt } from "@/lib/scoring/evaluate";
import { DIMENSION_KEYS } from "@/lib/scoring/dimensions";
import type { SprintResponse } from "@/types";

export async function POST(request: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { sprintId?: string; responses?: SprintResponse[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { sprintId, responses } = body;

  if (!sprintId) {
    return NextResponse.json(
      { error: "sprintId is required" },
      { status: 400 }
    );
  }

  if (!responses || !Array.isArray(responses) || responses.length === 0) {
    return NextResponse.json(
      { error: "responses array is required and must not be empty" },
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

    // Look up sprint with interactions and skill
    const sprint = await prisma.sprint.findUnique({
      where: { id: sprintId },
      include: {
        interactions: {
          orderBy: { order: "asc" },
        },
        skill: true,
      },
    });

    if (!sprint) {
      return NextResponse.json({ error: "Sprint not found" }, { status: 404 });
    }

    // Build SprintData for the evaluator
    const sprintData = {
      title: sprint.title,
      mode: sprint.mode,
      difficulty: sprint.difficulty,
      interactions: sprint.interactions.map((i) => ({
        id: i.id,
        type: i.type,
        order: i.order,
        prompt: i.prompt,
        options: i.options as { id: string; text: string }[],
        correctAnswer: i.correctAnswer,
        insightAnswer: i.insightAnswer,
        teachingPreamble: i.teachingPreamble,
        priorContext: i.priorContext,
        timeTarget: i.timeTarget,
      })),
    };

    // Evaluate using the unified evaluateAttempt function
    const evaluation = await evaluateAttempt(
      sprintData,
      responses,
      sprint.mode
    );

    // Validate response interactionIds belong to this sprint
    const validIds = new Set(sprint.interactions.map((i) => i.id));
    for (const r of responses) {
      if (!validIds.has(r.interactionId)) {
        return NextResponse.json(
          { error: "Invalid interaction ID in responses" },
          { status: 400 }
        );
      }
    }

    // Atomic: create attempt + update skill scores in a transaction
    const attempt = await prisma.$transaction(async (tx) => {
      const newAttempt = await tx.sprintAttempt.create({
        data: {
          userId: user.id,
          sprintId: sprint.id,
          mode: sprint.mode,
          responses: JSON.parse(JSON.stringify(responses)),
          scores: JSON.parse(JSON.stringify(evaluation.scores)),
          totalScore: evaluation.totalScore,
          completedAt: new Date(),
        },
      });

      // Update UserSkillScore (running average across attempts)
      const existingScore = await tx.userSkillScore.findUnique({
        where: {
          userId_skillId: {
            userId: user.id,
            skillId: sprint.skillId,
          },
        },
      });

      if (existingScore) {
        const count = existingScore.sprintCount;
        const newCount = count + 1;

        const updateData: Record<string, number> = {
          sprintCount: newCount,
        };

        let overallSum = 0;
        for (const key of DIMENSION_KEYS) {
          const oldVal = existingScore[key] as number;
          const newVal = evaluation.scores[key];
          const avg = (oldVal * count + newVal) / newCount;
          updateData[key] = Math.round(avg * 10) / 10;
          overallSum += updateData[key];
        }
        updateData.overallScore =
          Math.round((overallSum / DIMENSION_KEYS.length) * 10) / 10;

        await tx.userSkillScore.update({
          where: {
            userId_skillId: {
              userId: user.id,
              skillId: sprint.skillId,
            },
          },
          data: updateData,
        });
      } else {
        const overallScore =
          Math.round(
            (DIMENSION_KEYS.reduce(
              (sum, key) => sum + evaluation.scores[key],
              0
            ) /
              DIMENSION_KEYS.length) *
              10
          ) / 10;

        await tx.userSkillScore.create({
          data: {
            userId: user.id,
            skillId: sprint.skillId,
            analyticalThinking: evaluation.scores.analyticalThinking,
            strategicReasoning: evaluation.scores.strategicReasoning,
            quantitativeReasoning: evaluation.scores.quantitativeReasoning,
            communicationClarity: evaluation.scores.communicationClarity,
            decisionQuality: evaluation.scores.decisionQuality,
            creativeProblemSolving: evaluation.scores.creativeProblemSolving,
            overallScore,
            sprintCount: 1,
          },
        });
      }

      return newAttempt;
    });

    return NextResponse.json({
      attempt: {
        id: attempt.id,
        sprintId: attempt.sprintId,
        mode: attempt.mode,
        totalScore: evaluation.totalScore,
        completedAt: attempt.completedAt,
      },
      evaluation,
    });
  } catch (error) {
    console.error("Failed to evaluate sprint:", error);
    return NextResponse.json(
      { error: "Failed to evaluate sprint" },
      { status: 500 }
    );
  }
}
