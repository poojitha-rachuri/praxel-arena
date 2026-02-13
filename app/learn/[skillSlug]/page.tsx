import { redirect, notFound } from "next/navigation";
import { ensureUser } from "@/lib/auth/ensure-user";
import { prisma } from "@/lib/db";
import AppShell from "@/components/layout/AppShell";
import SkillNodePath from "@/components/layout/SkillNodePath";

export default async function LearnSkillPage({
  params,
}: {
  params: Promise<{ skillSlug: string }>;
}) {
  const user = await ensureUser();
  if (!user) redirect("/sign-in");
  if (!user.onboardingComplete) redirect("/onboarding");

  const { skillSlug } = await params;

  const [skill, topics, sprints, attempts] = await Promise.all([
    prisma.skill.findFirst({
      where: { slug: skillSlug },
      select: { id: true, name: true, slug: true, icon: true },
    }),
    prisma.topic.findMany({
      where: { skill: { slug: skillSlug } },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        order: true,
        icon: true,
        skillId: true,
      },
      orderBy: { order: "asc" },
    }),
    prisma.sprint.findMany({
      where: { skill: { slug: skillSlug }, mode: "LEARN", isGenerated: false },
      select: {
        id: true,
        title: true,
        description: true,
        difficulty: true,
        level: true,
        levelLabel: true,
        order: true,
        skillId: true,
        topicId: true,
        _count: { select: { interactions: true } },
      },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    }),
    prisma.sprintAttempt.findMany({
      where: {
        userId: user.id,
        mode: "LEARN",
        sprint: { skill: { slug: skillSlug } },
        completedAt: { not: null },
      },
      select: { sprintId: true, totalScore: true },
      distinct: ["sprintId"],
      orderBy: { totalScore: "desc" },
    }),
  ]);

  if (!skill) notFound();

  const completedSprints: Record<string, number> = {};
  for (const a of attempts) {
    if (a.totalScore !== null) {
      completedSprints[a.sprintId] = a.totalScore;
    }
  }

  const sprintMetas = sprints.map((s) => ({
    id: s.id,
    title: s.title,
    description: s.description,
    difficulty: s.difficulty,
    level: s.level,
    levelLabel: s.levelLabel,
    order: s.order,
    skillId: s.skillId,
    topicId: s.topicId,
    interactionCount: s._count.interactions,
  }));

  return (
    <AppShell>
      <SkillNodePath
        skill={skill}
        topics={topics}
        sprints={sprintMetas}
        completedSprints={completedSprints}
        mode="LEARN"
        basePath="/learn"
      />
    </AppShell>
  );
}
