import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureUser } from "@/lib/auth/ensure-user";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ duelId: string }> }
) {
  const user = await ensureUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { duelId } = await params;

  try {

    const duel = await prisma.duel.findUnique({
      where: { id: duelId },
      include: {
        skill: {
          select: { name: true, icon: true, slug: true },
        },
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

    // Verify user is a participant
    if (duel.player1Id !== user.id && duel.player2Id !== user.id) {
      return NextResponse.json(
        { error: "Not a participant in this duel" },
        { status: 403 }
      );
    }

    const isPlayer1 = duel.player1Id === user.id;
    const isPlayer2 = duel.player2Id === user.id;
    const myAttemptComplete =
      (isPlayer1 && !!duel.player1AttemptId) ||
      (isPlayer2 && !!duel.player2AttemptId);

    // Serialize sprint for client
    const sprintData = duel.sprint
      ? {
          id: duel.sprint.id,
          title: duel.sprint.title,
          description: duel.sprint.description,
          mode: duel.sprint.mode,
          difficulty: duel.sprint.difficulty,
          interactions: duel.sprint.interactions.map((i) => ({
            id: i.id,
            type: i.type,
            order: i.order,
            prompt: i.prompt,
            options: i.options,
            correctAnswer: i.correctAnswer,
            insightAnswer: i.insightAnswer,
            teachingPreamble: i.teachingPreamble,
            priorContext: i.priorContext,
            timeTarget: i.timeTarget,
          })),
        }
      : null;

    // Return in the same DuelData shape the client expects
    return NextResponse.json({
      duel: {
        id: duel.id,
        status: duel.status,
        skillName: duel.skill.name,
        skillIcon: duel.skill.icon,
        sprint: sprintData,
        evaluation: duel.evaluation,
        isPlayer1,
        myAttemptComplete,
      },
    });
  } catch (error) {
    console.error("Failed to fetch duel:", error);
    return NextResponse.json(
      { error: "Failed to fetch duel" },
      { status: 500 }
    );
  }
}
