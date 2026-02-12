import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { ensureUser } from "@/lib/auth/ensure-user";
import AppShell from "@/components/layout/AppShell";
import CompeteLobby from "@/components/arena/CompeteLobby";
import { ActiveChallengeBanner } from "@/components/gamification/ActiveChallengeBanner";

export default async function CompetePage() {
  const user = await ensureUser();
  if (!user) redirect("/sign-in");

  // Fetch skills
  const skills = await prisma.skill.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      icon: true,
    },
    orderBy: { name: "asc" },
  });

  return (
    <AppShell>
      <div className="p-4">
        <ActiveChallengeBanner />
      </div>
      <CompeteLobby skills={skills} userId={user.id} />
    </AppShell>
  );
}
