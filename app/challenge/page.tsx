import { redirect } from "next/navigation";
import { ensureUser } from "@/lib/auth/ensure-user";
import { prisma } from "@/lib/db";
import AppShell from "@/components/layout/AppShell";
import ChallengeSelector from "./ChallengeSelector";

export default async function ChallengePage() {
  const user = await ensureUser();
  if (!user) redirect("/sign-in");

  const skills = await prisma.skill.findMany({
    select: { id: true, name: true, slug: true, icon: true, description: true },
    orderBy: { name: "asc" },
  });

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl p-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">AI Challenge</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose a skill and challenge type for a focused AI conversation
          </p>
        </div>
        <ChallengeSelector skills={skills} />
      </div>
    </AppShell>
  );
}
