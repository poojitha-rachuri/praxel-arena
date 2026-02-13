import { redirect } from "next/navigation";
import { ensureUser } from "@/lib/auth/ensure-user";
import { prisma } from "@/lib/db";
import AppShell from "@/components/layout/AppShell";
import ChallengesHub from "./ChallengesHub";

export default async function ChallengesPage() {
  const user = await ensureUser();
  if (!user) redirect("/sign-in");

  const skills = await prisma.skill.findMany({
    select: { id: true, name: true, slug: true, icon: true, description: true },
    orderBy: { name: "asc" },
  });

  return (
    <AppShell>
      <ChallengesHub skills={skills} />
    </AppShell>
  );
}
