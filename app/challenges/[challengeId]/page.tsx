import { redirect, notFound } from "next/navigation";
import { ensureUser } from "@/lib/auth/ensure-user";
import { prisma } from "@/lib/db";
import ChallengeSprintWrapper from "./ChallengeSprintWrapper";

export default async function ChallengeDetailPage({
  params,
}: {
  params: Promise<{ challengeId: string }>;
}) {
  const user = await ensureUser();
  if (!user) redirect("/sign-in");
  if (!user.onboardingComplete) redirect("/onboarding");

  const { challengeId } = await params;

  // Load the challenge with its skill
  const challenge = await prisma.challenge.findUnique({
    where: { id: challengeId },
    include: {
      skill: { select: { id: true, name: true, slug: true, icon: true } },
    },
  });

  if (!challenge || !challenge.skill) {
    notFound();
  }

  // Check if challenge is still active
  const now = new Date();
  if (!challenge.isActive || challenge.endsAt < now) {
    redirect("/challenges");
  }

  // Pick a PRACTICE sprint for this skill (random order for variety)
  const sprint = await prisma.sprint.findFirst({
    where: {
      skillId: challenge.skill.id,
      mode: "PRACTICE",
    },
    include: {
      interactions: {
        orderBy: { order: "asc" },
      },
      skill: {
        select: { slug: true },
      },
    },
    orderBy: { order: "asc" },
  });

  if (!sprint) {
    // Fallback: try any mode
    const fallbackSprint = await prisma.sprint.findFirst({
      where: { skillId: challenge.skill.id },
      include: {
        interactions: { orderBy: { order: "asc" } },
        skill: { select: { slug: true } },
      },
      orderBy: { order: "asc" },
    });

    if (!fallbackSprint) {
      notFound();
    }

    const sprintData = serializeSprint(fallbackSprint);
    return (
      <ChallengeSprintWrapper
        sprint={sprintData}
        skillSlug={challenge.skill.slug}
        challengeId={challengeId}
        challengeName={challenge.name}
        challengeType={challenge.type}
      />
    );
  }

  const sprintData = serializeSprint(sprint);

  return (
    <ChallengeSprintWrapper
      sprint={sprintData}
      skillSlug={challenge.skill.slug}
      challengeId={challengeId}
      challengeName={challenge.name}
      challengeType={challenge.type}
    />
  );
}

function serializeSprint(sprint: {
  id: string;
  title: string;
  description: string | null;
  mode: string;
  difficulty: number;
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
    chartData?: unknown;
  }[];
}) {
  return {
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
}
