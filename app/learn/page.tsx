import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { ensureUser } from "@/lib/auth/ensure-user";
import AppShell from "@/components/layout/AppShell";
import SkillSprintBrowser from "@/components/layout/SkillSprintBrowser";

export default async function LearnPage() {
  const user = await ensureUser();
  if (!user) redirect("/sign-in");

  const skills = await prisma.skill.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      icon: true,
      description: true,
    },
    orderBy: { name: "asc" },
  });

  return (
    <AppShell>
      <SkillSprintBrowser
        skills={skills}
        mode="LEARN"
        basePath="/learn"
        title="Learn"
        subtitle="Choose a skill and start with guided micro-lessons"
      />
    </AppShell>
  );
}
