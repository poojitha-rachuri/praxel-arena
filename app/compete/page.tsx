import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { ensureUser } from "@/lib/auth/ensure-user";
import AppShell from "@/components/layout/AppShell";
import CompeteLobby from "@/components/arena/CompeteLobby";
import { ActiveChallengeBanner } from "@/components/gamification/ActiveChallengeBanner";
import ModeWelcomeBanner from "@/components/layout/ModeWelcomeBanner";

export default async function CompetePage() {
  const user = await ensureUser();
  if (!user) redirect("/sign-in");
  if (!user.onboardingComplete) redirect("/onboarding");

  const [skills, completionCount] = await Promise.all([
    prisma.skill.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        icon: true,
      },
      orderBy: { name: "asc" },
    }),
    prisma.sprintAttempt.count({
      where: { userId: user.id, mode: "COMPETE", completedAt: { not: null } },
    }),
  ]);

  return (
    <AppShell>
      <div className="p-4">
        <ModeWelcomeBanner mode="COMPETE" hasCompletions={completionCount > 0} />
        <ActiveChallengeBanner />
      </div>
      <CompeteLobby skills={skills} userId={user.id} />
    </AppShell>
  );
}
