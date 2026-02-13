import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { ensureUser } from "@/lib/auth/ensure-user";
import AppShell from "@/components/layout/AppShell";
import ArenaLobby from "@/components/arena/ArenaLobby";

export default async function CompetePage() {
  const user = await ensureUser();
  if (!user) redirect("/sign-in");
  if (!user.onboardingComplete) redirect("/onboarding");

  const skills = await prisma.skill.findMany({
    select: { id: true, name: true, slug: true, icon: true },
    orderBy: { name: "asc" },
  });

  return (
    <AppShell>
      <ArenaLobby skills={skills} userId={user.id} />
    </AppShell>
  );
}
