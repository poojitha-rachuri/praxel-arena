import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import AppShell from "@/components/layout/AppShell";
import ResultsReveal from "@/components/layout/ResultsReveal";
import { ensureUser } from "@/lib/auth/ensure-user";
import type { DimensionScores, EnrichedResponse } from "@/types";

/** Runtime type guard for enriched responses stored as JSON in the DB */
function isEnrichedResponseArray(value: unknown): value is EnrichedResponse[] {
  if (!Array.isArray(value) || value.length === 0) return false;
  const first = value[0];
  return (
    typeof first === "object" &&
    first !== null &&
    "interactionId" in first &&
    "isCorrect" in first &&
    "score" in first
  );
}

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
  const rawResponses = attempt.responses;
  const enrichedResponses: EnrichedResponse[] | null = isEnrichedResponseArray(rawResponses)
    ? rawResponses
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
