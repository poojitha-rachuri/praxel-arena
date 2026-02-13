import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import SprintPageWrapper from "@/components/layout/SprintPageWrapper";

export default async function PracticeSprintPage({
  params,
}: {
  params: Promise<{ skillSlug: string; sprintId: string }>;
}) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const { skillSlug, sprintId } = await params;

  const sprint = await prisma.sprint.findUnique({
    where: { id: sprintId },
    include: {
      interactions: {
        orderBy: { order: "asc" },
      },
      skill: {
        select: { slug: true },
      },
    },
  });

  if (!sprint || sprint.skill.slug !== skillSlug) {
    notFound();
  }

  const sprintData = {
    id: sprint.id,
    title: sprint.title,
    description: sprint.description,
    mode: sprint.mode,
    difficulty: sprint.difficulty,
    interactions: sprint.interactions.map((i) => ({
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
  };

  return <SprintPageWrapper sprint={sprintData} skillSlug={skillSlug} />;
}
