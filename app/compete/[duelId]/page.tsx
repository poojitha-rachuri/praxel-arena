import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import DuelPageClient from "@/components/arena/DuelPageClient";

export default async function DuelPage({
  params,
}: {
  params: Promise<{ duelId: string }>;
}) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    redirect("/sign-in");
  }

  const { duelId } = await params;

  // Get internal user
  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });

  if (!user) {
    redirect("/onboarding");
  }

  const duel = await prisma.duel.findUnique({
    where: { id: duelId },
    include: {
      skill: {
        select: { name: true, icon: true, slug: true },
      },
      sprint: {
        include: {
          interactions: {
            orderBy: { order: "asc" },
          },
        },
      },
    },
  });

  if (!duel) {
    notFound();
  }

  const isPlayer1 = duel.player1Id === user.id;
  const isPlayer2 = duel.player2Id === user.id;

  // Check if the current user has completed their attempt
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
          chartData: i.chartData,
        })),
      }
    : null;

  const duelData = {
    id: duel.id,
    status: duel.status,
    skillName: duel.skill.name,
    skillIcon: duel.skill.icon,
    sprint: sprintData,
    evaluation: duel.evaluation,
    isPlayer1,
    myAttemptComplete,
  };

  return <DuelPageClient initialDuel={duelData} />;
}
