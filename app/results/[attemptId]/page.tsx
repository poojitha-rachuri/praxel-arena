import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import ResultsReveal from "@/components/layout/ResultsReveal";
import { ensureUser } from "@/lib/auth/ensure-user";
import type { DimensionScores } from "@/types";

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const user = await ensureUser();
  if (!user) {
    redirect("/sign-in");
  }

  const { attemptId } = await params;

  const attempt = await prisma.sprintAttempt.findUnique({
    where: { id: attemptId },
    include: {
      sprint: {
        include: {
          skill: {
            select: { name: true, slug: true },
          },
        },
      },
      user: {
        select: { clerkId: true },
      },
    },
  });

  if (!attempt) {
    notFound();
  }

  // Ensure this attempt belongs to the requesting user
  if (attempt.user.clerkId !== user.clerkId) {
    notFound();
  }

  // Parse scores
  const scores = (attempt.scores ?? {}) as DimensionScores;
  const totalScore = attempt.totalScore ?? 0;

  // Parse feedback from scores JSON (may include feedback fields)
  const rawScores = attempt.scores as Record<string, unknown> | null;
  const feedback = (rawScores?.feedback as string) ?? null;
  const dimensionFeedback =
    (rawScores?.dimensionFeedback as Partial<Record<string, string>>) ?? null;

  return (
    <AppShell hideBottomNav>
      <ResultsReveal
        attemptId={attempt.id}
        totalScore={Math.round(totalScore)}
        scores={scores}
        feedback={feedback}
        dimensionFeedback={dimensionFeedback}
        sprintTitle={attempt.sprint.title}
        skillName={attempt.sprint.skill.name}
        mode={attempt.mode}
      />
    </AppShell>
  );
}
