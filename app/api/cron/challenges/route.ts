import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { CHALLENGE_TEMPLATES } from "@/lib/gamification/challenges";

export async function POST(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  // 1. Deactivate expired challenges
  const deactivated = await prisma.challenge.updateMany({
    where: {
      isActive: true,
      endsAt: { lt: now },
    },
    data: { isActive: false },
  });

  // 2. Get all skills for random assignment
  const skills = await prisma.skill.findMany({
    select: { id: true, slug: true },
  });

  // 3. Create 2-3 Speed Rounds (24h duration)
  const speedTemplates = CHALLENGE_TEMPLATES.filter(
    (t) => t.type === "SPEED_ROUND"
  );
  const scoreTemplates = CHALLENGE_TEMPLATES.filter(
    (t) => t.type === "SCORE_ATTACK"
  );

  const tomorrow = new Date(now);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);

  const nextWeek = new Date(now);
  nextWeek.setUTCDate(nextWeek.getUTCDate() + 7);
  nextWeek.setUTCHours(0, 0, 0, 0);

  const todayStart = new Date(now);
  todayStart.setUTCHours(0, 0, 0, 0);

  const created: string[] = [];

  // Pick 2-3 random speed round templates
  const shuffledSpeed = [...speedTemplates].sort(() => Math.random() - 0.5);
  const speedCount = Math.random() > 0.5 ? 3 : 2;

  for (let i = 0; i < Math.min(speedCount, shuffledSpeed.length); i++) {
    const template = shuffledSpeed[i];
    const randomSkill =
      template.id === "marathon"
        ? null // marathon is cross-skill
        : skills[Math.floor(Math.random() * skills.length)];

    const challenge = await prisma.challenge.create({
      data: {
        type: "SPEED_ROUND",
        templateId: template.id,
        name: template.name,
        description: template.description,
        skillId: randomSkill?.id ?? null,
        config: template.config,
        startsAt: todayStart,
        endsAt: tomorrow,
        rewardXpFirst: template.rewardXpFirst,
        rewardXpTenth: template.rewardXpTenth,
      },
    });
    created.push(challenge.id);
  }

  // Pick 1 daily Score Attack
  const dailyTemplate =
    scoreTemplates[Math.floor(Math.random() * scoreTemplates.length)];
  const dailySkill = skills[Math.floor(Math.random() * skills.length)];

  const dailyChallenge = await prisma.challenge.create({
    data: {
      type: "SCORE_ATTACK",
      templateId: dailyTemplate.id,
      name: dailyTemplate.name,
      description: dailyTemplate.description,
      skillId: dailySkill?.id ?? null,
      config: dailyTemplate.config,
      startsAt: todayStart,
      endsAt: tomorrow,
      rewardXpFirst: dailyTemplate.rewardXpFirst,
      rewardXpTenth: dailyTemplate.rewardXpTenth,
    },
  });
  created.push(dailyChallenge.id);

  // Check if we need a weekly Score Attack (only on Mondays)
  if (now.getUTCDay() === 1) {
    const weeklyTemplate = scoreTemplates.find(
      (t) => t.id === "weekly-master"
    );
    if (weeklyTemplate) {
      const weeklyChallenge = await prisma.challenge.create({
        data: {
          type: "SCORE_ATTACK",
          templateId: weeklyTemplate.id,
          name: weeklyTemplate.name,
          description: weeklyTemplate.description,
          skillId: dailySkill?.id ?? null,
          config: weeklyTemplate.config,
          startsAt: todayStart,
          endsAt: nextWeek,
          rewardXpFirst: weeklyTemplate.rewardXpFirst,
          rewardXpTenth: weeklyTemplate.rewardXpTenth,
        },
      });
      created.push(weeklyChallenge.id);
    }
  }

  return NextResponse.json({
    deactivated: deactivated.count,
    created: created.length,
    challengeIds: created,
  });
}
