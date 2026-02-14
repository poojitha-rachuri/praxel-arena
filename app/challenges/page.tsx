import { redirect } from "next/navigation";
import { ensureUser } from "@/lib/auth/ensure-user";
import { prisma } from "@/lib/db";
import AppShell from "@/components/layout/AppShell";
import ModeWelcomeBanner from "@/components/layout/ModeWelcomeBanner";
import ChallengesHub from "./ChallengesHub";

export default async function ChallengesPage() {
  const user = await ensureUser();
  if (!user) redirect("/sign-in");
  if (!user.onboardingComplete) redirect("/onboarding");

  const [skills, sessionCount] = await Promise.all([
    prisma.skill.findMany({
      select: { id: true, name: true, slug: true, icon: true, description: true },
      orderBy: { name: "asc" },
    }),
    prisma.challengeSession.count({
      where: { userId: user.id, completed: true },
    }),
  ]);

  return (
    <AppShell>
      <ChallengesHub
        skills={skills}
        bannerSlot={
          <ModeWelcomeBanner mode="CHALLENGE" hasCompletions={sessionCount > 0} />
        }
      />
    </AppShell>
  );
}
