import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import AppShell from "@/components/layout/AppShell";
import SkillSprintBrowser from "@/components/layout/SkillSprintBrowser";

export default async function LearnPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

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
