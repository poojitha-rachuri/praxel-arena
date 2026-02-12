import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureUser } from "@/lib/auth/ensure-user";
import { evaluateAttempt, evaluateDuel } from "@/lib/scoring/evaluate";
import { DIMENSION_KEYS } from "@/lib/scoring/dimensions";
import { ELO_INITIAL_RATING, EVALUATION_RATE_LIMIT } from "@/lib/utils/constants";
import { processGamification } from "@/lib/gamification/xp";
import { processCredentials } from "@/lib/gamification/credentials";
import type { SprintResponse } from "@/types";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  const user = await ensureUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit: max evaluations per user per hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentEvals = await prisma.sprintAttempt.count({
    where: {
      userId: user.id,
      completedAt: { gte: oneHourAgo },
    },
  });
  if (recentEvals >= EVALUATION_RATE_LIMIT) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please try again later.", retryAfter: 3600 },
      { status: 429 }
    );
  }

  let body: {
    sprintId?: string;
    duelId?: string;
    responses?: SprintResponse[];
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { sprintId, duelId, responses } = body;

  if (!sprintId) {
    return NextResponse.json(
      { error: "sprintId is required" },
      { status: 400 }
    );
  }

  if (!responses || !Array.isArray(responses) || responses.length === 0 || responses.length > 50) {
    return NextResponse.json(
      { error: "responses array is required, must not be empty, and must have at most 50 items" },
      { status: 400 }
    );
  }

  // Validate and coerce response shapes
  for (const r of responses) {
    if (typeof r.answer !== "string") {
      return NextResponse.json(
        { error: "Each response must have a string 'answer'" },
        { status: 400 }
      );
    }
    r.timeSpent = Number(r.timeSpent) || 0;
  }

  try {
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

    // Validate response interactionIds belong to this sprint (fail fast before expensive AI call)
    const validIds = new Set(sprint.interactions.map((i) => i.id));
    for (const r of responses) {
      if (!validIds.has(r.interactionId)) {
        return NextResponse.json(
          { error: "Invalid interaction ID in responses" },
          { status: 400 }
        );
      }
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

    // Clamp all dimension scores to valid numbers before DB write
    for (const key of DIMENSION_KEYS) {
      const val = evaluation.scores[key];
      if (typeof val !== "number" || !Number.isFinite(val)) {
        evaluation.scores[key] = 0;
      }
    }

    // Recalculate totalScore from clamped values
    evaluation.totalScore = Math.round(
      DIMENSION_KEYS.reduce((sum, key) => sum + evaluation.scores[key], 0) /
        DIMENSION_KEYS.length
    );

    // Deep clone outside the transaction — JSON round-trip produces Prisma-compatible JsonValue
    const enrichedJson = JSON.parse(
      JSON.stringify(evaluation.enrichedResponses ?? responses)
    );
    const scoresJson = JSON.parse(JSON.stringify(evaluation.scores));

    // Atomic: create attempt + update skill scores in a transaction
    const attempt = await prisma.$transaction(async (tx) => {
      const newAttempt = await tx.sprintAttempt.create({
        data: {
          userId: user.id,
          sprintId: sprint.id,
          mode: sprint.mode,
          responses: enrichedJson,
          scores: scoresJson,
          totalScore: evaluation.totalScore,
          feedback: evaluation.feedback ?? null,
          highlights: evaluation.highlights ?? [],
          improvements: evaluation.improvements ?? [],
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

    // ── Duel completion logic ──
    if (duelId) {
      // Validate user is a participant before processing
      const duel = await prisma.duel.findUnique({
        where: { id: duelId },
        select: { player1Id: true, player2Id: true, status: true },
      });

      if (duel && (duel.player1Id === user.id || duel.player2Id === user.id) &&
          duel.status !== "COMPLETED" && duel.status !== "CANCELLED") {
        try {
          await completeDuelAttempt(
            duelId,
            user.id,
            attempt.id,
            sprint,
            responses
          );
        } catch (duelError) {
          // Log but don't fail the evaluate response — the attempt is saved
          console.error("Failed to update duel:", duelError);
        }
      }
    }

    // Strip correctAnswer/insightAnswer from enriched responses to prevent answer leaks
    const sanitizedEvaluation = {
      ...evaluation,
      enrichedResponses: evaluation.enrichedResponses?.map(
        ({ correctAnswer, insightAnswer, ...rest }) => rest
      ),
    };

    // Process gamification (non-blocking — fire and forget)
    const gamificationPromise = processGamification({
      userId: user.id,
      mode: sprint.mode,
      totalScore: evaluation.totalScore,
      skillId: sprint.skillId,
      sprintId: sprint.id,
      duelId: duelId ?? undefined,
    }).catch((err) => {
      console.error("[gamification] Failed to process:", err);
      return null;
    });

    // Wait briefly for gamification to complete (up to 500ms) so we can return data
    const gamification = await Promise.race([
      gamificationPromise,
      new Promise<null>((resolve) => setTimeout(() => {
        console.warn("[gamification] Timeout: exceeded 500ms, returning without gamification data");
        resolve(null);
      }, 500)),
    ]);

    return NextResponse.json({
      attempt: {
        id: attempt.id,
        sprintId: attempt.sprintId,
        mode: attempt.mode,
        totalScore: evaluation.totalScore,
        completedAt: attempt.completedAt,
      },
      evaluation: sanitizedEvaluation,
      gamification: gamification ?? undefined,
    });
  } catch (error) {
    const errorId = crypto.randomUUID();
    console.error(`[${errorId}] Failed to evaluate sprint:`, {
      error: error instanceof Error ? { message: error.message, stack: error.stack, name: error.name } : error,
      sprintId,
      responseCount: responses?.length,
    });
    return NextResponse.json(
      { error: "Failed to evaluate sprint", errorId },
      { status: 500 }
    );
  }
}

/**
 * Link a player's attempt to their duel, and if both players have
 * completed, run the head-to-head AI evaluation, update Elo ratings,
 * and finalize the duel.
 */
async function completeDuelAttempt(
  duelId: string,
  userId: string,
  attemptId: string,
  sprint: {
    id: string;
    title: string;
    mode: string;
    difficulty: number;
    skillId: string;
    interactions: {
      id: string;
      type: string;
      order: number;
      prompt: string;
      options: unknown;
      correctAnswer: string | null;
      insightAnswer: string | null;
      teachingPreamble: string | null;
      priorContext: string | null;
      timeTarget: number;
    }[];
  },
  responses: SprintResponse[]
) {
  const duel = await prisma.duel.findUnique({
    where: { id: duelId },
  });

  if (!duel || duel.status === "COMPLETED" || duel.status === "CANCELLED" || duel.status === "EVALUATING") {
    return;
  }

  // Determine which player slot this is
  const isPlayer1 = duel.player1Id === userId;
  const isPlayer2 = duel.player2Id === userId;

  if (!isPlayer1 && !isPlayer2) {
    return; // User is not a participant
  }

  // Update the duel with this player's attempt
  const updateData: Record<string, string> = {};
  if (isPlayer1) {
    updateData.player1AttemptId = attemptId;
  } else {
    updateData.player2AttemptId = attemptId;
  }

  await prisma.duel.update({
    where: { id: duelId },
    data: updateData,
  });

  // Refresh duel to check if both players are done
  const updatedDuel = await prisma.duel.findUnique({
    where: { id: duelId },
  });

  if (
    !updatedDuel ||
    !updatedDuel.player1AttemptId ||
    !updatedDuel.player2AttemptId
  ) {
    return;
  }

  // Atomic status transition to EVALUATING — prevents double evaluation race
  const claimed = await prisma.duel.updateMany({
    where: {
      id: duelId,
      status: { in: ["IN_PROGRESS", "WAITING"] },
    },
    data: { status: "EVALUATING" },
  });

  if (claimed.count === 0) {
    return; // Another request already claimed this duel for evaluation
  }

  // Load both attempts' responses
  const [p1Attempt, p2Attempt] = await Promise.all([
    prisma.sprintAttempt.findUnique({
      where: { id: updatedDuel.player1AttemptId },
    }),
    prisma.sprintAttempt.findUnique({
      where: { id: updatedDuel.player2AttemptId },
    }),
  ]);

  if (!p1Attempt || !p2Attempt) {
    return;
  }

  const p1Responses = p1Attempt.responses as unknown as SprintResponse[];
  const p2Responses = p2Attempt.responses as unknown as SprintResponse[];

  // Get both players' Elo ratings
  const [p1Elo, p2Elo] = await Promise.all([
    prisma.userEloRating.findUnique({
      where: {
        userId_skillId: {
          userId: updatedDuel.player1Id,
          skillId: sprint.skillId,
        },
      },
    }),
    prisma.userEloRating.findUnique({
      where: {
        userId_skillId: {
          userId: updatedDuel.player2Id!,
          skillId: sprint.skillId,
        },
      },
    }),
  ]);

  const player1Rating = p1Elo?.rating ?? ELO_INITIAL_RATING;
  const player2Rating = p2Elo?.rating ?? ELO_INITIAL_RATING;
  const player1Matches = p1Elo?.matchCount ?? 0;
  const player2Matches = p2Elo?.matchCount ?? 0;

  // Build sprint data for the evaluator
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

  // Run the head-to-head AI evaluation
  const duelResult = await evaluateDuel(
    sprintData,
    p1Responses,
    p2Responses,
    updatedDuel.player1Id,
    updatedDuel.player2Id!,
    player1Rating,
    player2Rating,
    player1Matches,
    player2Matches
  );

  // Get player names for the evaluation record
  const [player1, player2] = await Promise.all([
    prisma.user.findUnique({
      where: { id: updatedDuel.player1Id },
      select: { name: true },
    }),
    prisma.user.findUnique({
      where: { id: updatedDuel.player2Id! },
      select: { name: true },
    }),
  ]);

  const p1Name = player1?.name ?? "Player 1";
  const p2Name = player2?.name ?? "Player 2";

  // Map user IDs to "player1"/"player2" labels for the client
  const winnerLabel =
    duelResult.winnerId === updatedDuel.player1Id ? "player1" : "player2";

  // Map dimensionWinners from user IDs to player names (for MatchResult component)
  const dimensionWinnersAsNames: Record<string, string> = {};
  for (const [key, userId] of Object.entries(duelResult.dimensionWinners)) {
    dimensionWinnersAsNames[key] =
      userId === updatedDuel.player1Id ? p1Name : p2Name;
  }

  // Atomic: update duel + Elo ratings in a transaction
  await prisma.$transaction(async (tx) => {
    // Finalize the duel
    await tx.duel.update({
      where: { id: duelId },
      data: {
        status: "COMPLETED",
        winnerId: duelResult.winnerId,
        eloChange: duelResult.eloChange,
        evaluation: {
          winnerId: winnerLabel,
          player1Scores: duelResult.player1Scores,
          player2Scores: duelResult.player2Scores,
          dimensionWinners: dimensionWinnersAsNames,
          analysis: duelResult.analysis,
          eloChange: duelResult.eloChange,
          player1Name: p1Name,
          player2Name: p2Name,
        },
        completedAt: new Date(),
      },
    });

    // Update winner's Elo
    const loserId =
      duelResult.winnerId === updatedDuel.player1Id
        ? updatedDuel.player2Id!
        : updatedDuel.player1Id;

    await tx.userEloRating.upsert({
      where: {
        userId_skillId: {
          userId: duelResult.winnerId,
          skillId: sprint.skillId,
        },
      },
      create: {
        userId: duelResult.winnerId,
        skillId: sprint.skillId,
        rating: ELO_INITIAL_RATING + duelResult.eloChange,
        matchCount: 1,
      },
      update: {
        rating: {
          increment: duelResult.eloChange,
        },
        matchCount: { increment: 1 },
      },
    });

    // Update loser's Elo
    await tx.userEloRating.upsert({
      where: {
        userId_skillId: { userId: loserId, skillId: sprint.skillId },
      },
      create: {
        userId: loserId,
        skillId: sprint.skillId,
        rating: Math.max(ELO_INITIAL_RATING - duelResult.eloChange, 100),
        matchCount: 1,
      },
      update: {
        rating: {
          decrement: duelResult.eloChange,
        },
        matchCount: { increment: 1 },
      },
    });
  });

  // Check credentials for winner (non-blocking)
  const winnerCurrentElo =
    duelResult.winnerId === updatedDuel.player1Id
      ? player1Rating
      : player2Rating;
  const winnerNewElo = winnerCurrentElo + duelResult.eloChange;
  processCredentials(duelResult.winnerId, sprint.skillId, winnerNewElo).catch(
    (err) => console.error("[credentials] Failed:", err)
  );
}
