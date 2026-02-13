import { redirect, notFound } from "next/navigation";
import { ensureUser } from "@/lib/auth/ensure-user";
import { prisma } from "@/lib/db";
import AppShell from "@/components/layout/AppShell";
import ChallengeSessionClient from "./ChallengeSessionClient";

export default async function ChallengeSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const user = await ensureUser();
  if (!user) redirect("/sign-in");

  const { sessionId } = await params;

  const session = await prisma.challengeSession.findUnique({
    where: { id: sessionId },
    include: {
      skill: { select: { id: true, name: true, slug: true } },
    },
  });

  if (!session || session.userId !== user.id) {
    notFound();
  }

  // If already completed, redirect back to challenge page
  if (session.completed) {
    redirect("/challenges");
  }

  return (
    <AppShell hideBottomNav>
      <ChallengeSessionClient
        sessionId={sessionId}
        skillId={session.skill.id}
        skillName={session.skill.name}
        challengeType={
          session.challengeType as
            | "MOCK_INTERVIEW"
            | "SCENARIO_DRILL"
            | "SOCRATIC_COACHING"
        }
      />
    </AppShell>
  );
}
