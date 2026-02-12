import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import ResultsReveal from "@/components/layout/ResultsReveal";
import { ensureUser } from "@/lib/auth/ensure-user";
import type { DimensionScores, EnrichedResponse } from "@/types";

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

  // Read feedback fields directly from the attempt record
  const feedback = attempt.feedback ?? null;
  const highlights = (attempt.highlights as string[] | null) ?? [];
  const improvements = (attempt.improvements as string[] | null) ?? [];

  // Parse enriched responses (may be missing for old attempts pre-migration)
  const rawResponses = attempt.responses as unknown[];
  const enrichedResponses: EnrichedResponse[] | null =
    Array.isArray(rawResponses) && rawResponses.length > 0 && typeof (rawResponses[0] as Record<string, unknown>).isCorrect === "boolean"
      ? (rawResponses as unknown as EnrichedResponse[])
      : null;

  return (
    <AppShell hideBottomNav>
      <ResultsReveal
        attemptId={attempt.id}
        totalScore={Math.round(totalScore)}
        scores={scores}
        feedback={feedback}
        highlights={highlights}
        improvements={improvements}
        enrichedResponses={enrichedResponses}
        sprintTitle={attempt.sprint.title}
        skillName={attempt.sprint.skill.name}
        skillSlug={attempt.sprint.skill.slug}
        mode={attempt.mode}
      />
    </AppShell>
  );
}
