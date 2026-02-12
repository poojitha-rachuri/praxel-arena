import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import {
  sprintFileSchema,
  topicsFileSchema,
  type SprintFile,
} from "../lib/validation/content-schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required for seeding");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const SEED_DATA_DIR = path.resolve(__dirname, "seed-data");

// ─── Static Data ────────────────────────────────────────────────────────────

interface CareerWeight {
  slug: string;
  weight: number;
}

interface SkillSeed {
  name: string;
  slug: string;
  description: string;
  icon: string;
  careers: CareerWeight[];
}

const SKILLS: SkillSeed[] = [
  {
    name: "Guesstimation",
    slug: "guesstimation",
    description:
      "Market sizing, Fermi estimates, and quantitative reasoning under uncertainty",
    icon: "🎯",
    careers: [
      { slug: "consulting", weight: 1.0 },
      { slug: "product-management", weight: 0.3 },
      { slug: "founder", weight: 0.8 },
    ],
  },
  {
    name: "GTM Strategy",
    slug: "gtm-strategy",
    description:
      "Go-to-market planning, channel strategy, launch sequencing, and market entry",
    icon: "🚀",
    careers: [
      { slug: "marketing", weight: 1.0 },
      { slug: "founder", weight: 0.9 },
      { slug: "growth", weight: 0.7 },
      { slug: "product-management", weight: 0.6 },
      { slug: "sales-strategy", weight: 0.5 },
    ],
  },
  {
    name: "Pricing & Monetization",
    slug: "pricing-monetization",
    description:
      "Pricing models, willingness-to-pay, unit economics, and packaging strategy",
    icon: "💰",
    careers: [
      { slug: "sales-strategy", weight: 1.0 },
      { slug: "founder", weight: 0.8 },
      { slug: "consulting", weight: 0.6 },
      { slug: "product-management", weight: 0.5 },
      { slug: "growth", weight: 0.5 },
      { slug: "marketing", weight: 0.4 },
    ],
  },
  {
    name: "Data Interpretation",
    slug: "data-interpretation",
    description:
      "Reading dashboards, identifying signals in noise, drawing conclusions from metrics",
    icon: "📊",
    careers: [
      { slug: "growth", weight: 1.0 },
      { slug: "business-operations", weight: 1.0 },
      { slug: "product-management", weight: 0.8 },
      { slug: "consulting", weight: 0.8 },
      { slug: "marketing", weight: 0.5 },
      { slug: "founder", weight: 0.5 },
    ],
  },
  {
    name: "Prioritization",
    slug: "prioritization",
    description:
      "Frameworks for tradeoff decisions, resource allocation, and saying no",
    icon: "⚖️",
    careers: [
      { slug: "product-management", weight: 1.0 },
      { slug: "business-operations", weight: 0.8 },
      { slug: "consulting", weight: 0.7 },
      { slug: "founder", weight: 0.7 },
    ],
  },
  {
    name: "Stakeholder Communication",
    slug: "stakeholder-communication",
    description:
      "Structuring arguments, executive communication, persuasion, and alignment",
    icon: "🗣️",
    careers: [
      { slug: "consulting", weight: 0.8 },
      { slug: "sales-strategy", weight: 0.8 },
      { slug: "product-management", weight: 0.7 },
      { slug: "marketing", weight: 0.7 },
      { slug: "founder", weight: 0.5 },
      { slug: "business-operations", weight: 0.4 },
    ],
  },
  {
    name: "Financial Statement Analysis",
    slug: "financial-statement-analysis",
    description:
      "Reading balance sheets, income statements, cash flow; ratios, working capital, profitability analysis",
    icon: "📑",
    careers: [
      { slug: "consulting", weight: 0.7 },
      { slug: "founder", weight: 0.7 },
      { slug: "business-operations", weight: 0.6 },
      { slug: "sales-strategy", weight: 0.4 },
      { slug: "product-management", weight: 0.3 },
      { slug: "growth", weight: 0.3 },
    ],
  },
  {
    name: "Valuation",
    slug: "valuation",
    description:
      "DCF, comparable company analysis, precedent transactions, startup valuation methods",
    icon: "🏦",
    careers: [
      { slug: "consulting", weight: 0.6 },
      { slug: "founder", weight: 0.6 },
      { slug: "sales-strategy", weight: 0.3 },
      { slug: "product-management", weight: 0.2 },
    ],
  },
];

const CAREER_OUTCOMES = [
  {
    name: "Product Management",
    slug: "product-management",
    description: "Lead product strategy, roadmap, and cross-functional teams",
    icon: "📦",
  },
  {
    name: "Consulting",
    slug: "consulting",
    description:
      "Advise organizations on strategy, operations, and transformation",
    icon: "🏛️",
  },
  {
    name: "Marketing",
    slug: "marketing",
    description:
      "Drive brand, demand generation, and go-to-market execution",
    icon: "📣",
  },
  {
    name: "Founder / Entrepreneurship",
    slug: "founder",
    description: "Build and scale new ventures from zero to one",
    icon: "⚡",
  },
  {
    name: "Growth",
    slug: "growth",
    description:
      "Optimize user acquisition, activation, retention, and revenue",
    icon: "📈",
  },
  {
    name: "Sales Strategy",
    slug: "sales-strategy",
    description:
      "Design sales processes, pricing strategies, and deal structures",
    icon: "🤝",
  },
  {
    name: "Business Operations",
    slug: "business-operations",
    description:
      "Streamline processes, manage resources, and drive operational excellence",
    icon: "⚙️",
  },
];

// ─── COMPETE Sprint Data (Pre-cached for demo safety) ─────────────────────────

interface CompeteSprintSeed {
  title: string;
  description: string;
  skillSlug: string;
  difficulty: number;
  interactions: {
    type: string;
    order: number;
    prompt: string;
    options: { id: string; text: string }[];
    correctAnswer: string;
    insightAnswer: string;
    priorContext?: string;
    timeTarget: number;
  }[];
}

const COMPETE_SPRINTS: CompeteSprintSeed[] = [
  {
    title: "Valuing NovaPay: FinTech Sizing Sprint",
    description: "Evaluate a $500M Series D investment in a B2B payments startup facing competitive pressure",
    skillSlug: "guesstimation",
    difficulty: 3,
    interactions: [
      {
        type: "SPOT_THE_SIGNAL",
        order: 1,
        prompt: "NovaPay processes $2B in annual payment volume at a 2.1% take rate. Revenue $42M, gross margin 68%, YoY growth 110%, but Q4 growth decelerated to 80% annualized. What is the key signal?",
        options: [
          { id: "a", text: "Revenue growth deceleration from 110% to 80%" },
          { id: "b", text: "Healthy 68% gross margin validates the model" },
          { id: "c", text: "$42M revenue is impressive for B2B payments" },
          { id: "d", text: "2.1% take rate is competitive in payments" },
        ],
        correctAnswer: "a",
        insightAnswer: "Growth deceleration is the single most important signal for growth-stage valuation. A 30-point drop in one quarter compounds — if the trend continues, the company's forward revenue multiple collapses.",
        timeTarget: 10,
      },
      {
        type: "SPOT_THE_SIGNAL",
        order: 2,
        prompt: "NovaPay's cohort data: 2022 cohort retains 95% of payment volume, 2023 retains 88%, 2024 retains only 72% after 6 months. New customer acquisition is 3x higher than 2022. What does the data really say?",
        options: [
          { id: "a", text: "Customer quality is declining as they scale acquisition" },
          { id: "b", text: "2024 cohort needs more time to ramp up" },
          { id: "c", text: "Net revenue retention is still strong overall" },
          { id: "d", text: "Normal — newer cohorts always start lower" },
        ],
        correctAnswer: "a",
        insightAnswer: "Declining cohort retention + aggressive acquisition = classic 'growth masking churn.' They're acquiring faster to offset worsening retention. This is unsustainable.",
        timeTarget: 10,
      },
      {
        type: "FILL_THE_GAP",
        order: 3,
        prompt: "In payments, ___ measures total dollar value of transactions processed and is the standard top-line metric before applying take rate.",
        options: [
          { id: "a", text: "GMV (Gross Merchandise Value)" },
          { id: "b", text: "TPV (Total Payment Volume)" },
          { id: "c", text: "ARR (Annual Recurring Revenue)" },
          { id: "d", text: "ATV (Average Transaction Value)" },
        ],
        correctAnswer: "b",
        insightAnswer: "TPV is the payments industry standard. GMV is used for marketplaces. Revenue = TPV × take rate. Understanding this conversion is critical for payments valuation.",
        timeTarget: 10,
      },
      {
        type: "FORCED_TRADEOFF",
        order: 4,
        prompt: "Two valuation approaches: (A) Revenue multiple — comparable payment cos trade at 15x, giving $630M at $42M revenue. (B) TPV multiple — 0.3x TPV gives $600M on $2B volume. Which is more reliable at this stage?",
        options: [
          { id: "a", text: "Revenue multiple — standard for growth-stage" },
          { id: "b", text: "TPV multiple — captures true economic activity" },
          { id: "c", text: "Revenue multiple but discount 20% for growth deceleration" },
          { id: "d", text: "Use both and take the midpoint for triangulation" },
        ],
        correctAnswer: "c",
        insightAnswer: "Revenue multiples are standard but must be adjusted for growth trajectory. A company decelerating from 110% to 80% doesn't deserve the same multiple as one accelerating. The 20% discount reflects this.",
        timeTarget: 20,
      },
      {
        type: "RANK_AND_PRIORITIZE",
        order: 5,
        prompt: "Rank NovaPay's growth levers by expected 12-month revenue impact (highest first):",
        options: [
          { id: "a", text: "Expand internationally into 10 new markets" },
          { id: "b", text: "Increase take rate from 2.1% to 2.5% on existing volume" },
          { id: "c", text: "Cross-sell lending products to merchant base" },
          { id: "d", text: "Reduce 2024 cohort churn from 28% to 15%" },
        ],
        correctAnswer: "b,d,c,a",
        insightAnswer: "Take rate increase (B) is an immediate 19% revenue uplift on $2B volume. Churn fix (D) saves declining cohorts. Cross-sell (C) requires new products. International (A) has longest lead time and execution risk.",
        timeTarget: 25,
      },
      {
        type: "FILL_THE_GAP",
        order: 6,
        prompt: "A payment company's ___ is calculated as revenue divided by total payment volume, representing its monetization efficiency per dollar processed.",
        options: [
          { id: "a", text: "Gross margin" },
          { id: "b", text: "Conversion rate" },
          { id: "c", text: "Take rate" },
          { id: "d", text: "ARPU" },
        ],
        correctAnswer: "c",
        insightAnswer: "Take rate = Revenue / TPV. It measures how effectively a payment company monetizes each dollar flowing through. Stripe's is ~2.9%, PayPal's ~2.2%, wholesale processors ~0.3%.",
        timeTarget: 10,
      },
      {
        type: "CURVEBALL",
        order: 7,
        prompt: "Breaking: Stripe just announced a competing B2B product at 1.5% take rate (vs NovaPay's 2.1%). Your earlier plan to raise take rate to 2.5% is now risky. How does this change the investment thesis?",
        priorContext: "You previously ranked 'increase take rate from 2.1% to 2.5%' as the #1 growth lever, worth a 19% revenue uplift.",
        options: [
          { id: "a", text: "Too risky now — Stripe will crush them on price" },
          { id: "b", text: "Pivot thesis: retention + cross-sell become primary drivers" },
          { id: "c", text: "NovaPay should preemptively cut to 1.8% to defend share" },
          { id: "d", text: "Stripe's entry validates the market — bullish signal" },
        ],
        correctAnswer: "b",
        insightAnswer: "With Stripe competing on price, take rate expansion is off the table. The thesis must pivot to retention and cross-sell. If NovaPay's value is just processing, Stripe wins. If it's the merchant relationship, NovaPay can defend.",
        timeTarget: 20,
      },
      {
        type: "FORCED_TRADEOFF",
        order: 8,
        prompt: "Final call: given Stripe's entry, declining cohort quality, and growth deceleration, do you recommend the $500M Series D at 12x forward revenue ($504M valuation)?",
        options: [
          { id: "a", text: "Yes — fundamentals are strong, Stripe is manageable" },
          { id: "b", text: "Yes, but negotiate down to 8x ($336M) for the new risks" },
          { id: "c", text: "No — deteriorating cohorts + Stripe signal a ceiling" },
          { id: "d", text: "Pass now, revisit in 6 months after Stripe response" },
        ],
        correctAnswer: "b",
        insightAnswer: "The business has real value but the risk profile changed. Negotiating to 8x prices in the growth deceleration and competitive threat while still capturing the upside. Passing entirely might mean missing the window.",
        timeTarget: 20,
      },
    ],
  },
];

// Demo opponent's responses (gets ~5/8 correct — competitive but beatable)
const DEMO_OPPONENT_RESPONSES = [
  { interactionIndex: 0, answer: "b", timeSpent: 8 },
  { interactionIndex: 1, answer: "a", timeSpent: 7 },
  { interactionIndex: 2, answer: "b", timeSpent: 5 },
  { interactionIndex: 3, answer: "d", timeSpent: 14 },
  { interactionIndex: 4, answer: "b,d,c,a", timeSpent: 18 },
  { interactionIndex: 5, answer: "c", timeSpent: 4 },
  { interactionIndex: 6, answer: "d", timeSpent: 12 },
  { interactionIndex: 7, answer: "b", timeSpent: 15 },
];

// Zod schemas imported from lib/validation/content-schema.ts (single source of truth)

// ─── File System Helpers ────────────────────────────────────────────────────

function loadTopics() {
  const topicsPath = path.join(SEED_DATA_DIR, "topics.json");
  if (!fs.existsSync(topicsPath)) {
    console.warn("  No topics.json found, skipping topic creation");
    return [];
  }
  const raw = JSON.parse(fs.readFileSync(topicsPath, "utf-8"));
  const result = topicsFileSchema.safeParse(raw);
  if (!result.success) {
    console.error("  topics.json validation failed:", result.error.issues);
    return [];
  }
  return result.data;
}

function loadSprintFiles(): SprintFile[] {
  const sprints: SprintFile[] = [];

  if (!fs.existsSync(SEED_DATA_DIR)) return sprints;

  // Walk seed-data/<skill>/<topic>/*.json
  for (const skillEntry of fs.readdirSync(SEED_DATA_DIR, {
    withFileTypes: true,
  })) {
    if (!skillEntry.isDirectory()) continue;
    const skillDir = path.join(SEED_DATA_DIR, skillEntry.name);

    for (const topicEntry of fs.readdirSync(skillDir, {
      withFileTypes: true,
    })) {
      if (!topicEntry.isDirectory()) continue;
      const topicDir = path.join(skillDir, topicEntry.name);

      for (const file of fs.readdirSync(topicDir)) {
        if (!file.endsWith(".json")) continue;
        const filePath = path.join(topicDir, file);

        try {
          const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
          const result = sprintFileSchema.safeParse(raw);
          if (!result.success) {
            console.warn(
              `  SKIP ${filePath}: validation failed -`,
              result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")
            );
            continue;
          }
          sprints.push(result.data);
        } catch (err) {
          console.warn(`  SKIP ${filePath}: ${(err as Error).message}`);
        }
      }
    }
  }

  return sprints;
}

// ─── Main Seed Function ─────────────────────────────────────────────────────

async function main() {
  console.log("Seeding database...");

  // Upsert career outcomes
  const careerMap = new Map<string, string>();
  for (const career of CAREER_OUTCOMES) {
    const record = await prisma.careerOutcome.upsert({
      where: { slug: career.slug },
      update: {},
      create: career,
    });
    careerMap.set(career.slug, record.id);
  }
  console.log(`  ${CAREER_OUTCOMES.length} career outcomes seeded`);

  // Upsert skills and create career mappings
  const skillMap = new Map<string, string>();
  for (const skill of SKILLS) {
    const { careers, ...skillData } = skill;
    const record = await prisma.skill.upsert({
      where: { slug: skillData.slug },
      update: {},
      create: skillData,
    });
    skillMap.set(skill.slug, record.id);

    for (const { slug: careerSlug, weight } of careers) {
      const careerOutcomeId = careerMap.get(careerSlug);
      if (!careerOutcomeId) continue;

      await prisma.skillCareerMap.upsert({
        where: {
          skillId_careerOutcomeId: {
            skillId: record.id,
            careerOutcomeId,
          },
        },
        update: { weight },
        create: {
          skillId: record.id,
          careerOutcomeId,
          weight,
        },
      });
    }
  }
  console.log(`  ${SKILLS.length} skills seeded with career mappings`);

  // ─── Create Topics ──────────────────────────────────────────────────────────

  const topicDefs = loadTopics();
  const topicMap = new Map<string, string>(); // "skillSlug/topicSlug" -> topicId

  for (const topic of topicDefs) {
    const skillId = skillMap.get(topic.skillSlug);
    if (!skillId) {
      console.warn(`  Skill not found for topic: ${topic.slug} (skill: ${topic.skillSlug})`);
      continue;
    }

    const record = await prisma.topic.upsert({
      where: { skillId_slug: { skillId, slug: topic.slug } },
      update: {
        name: topic.name,
        description: topic.description ?? null,
        order: topic.order,
        icon: topic.icon ?? null,
      },
      create: {
        skillId,
        name: topic.name,
        slug: topic.slug,
        description: topic.description ?? null,
        order: topic.order,
        icon: topic.icon ?? null,
      },
    });
    topicMap.set(`${topic.skillSlug}/${topic.slug}`, record.id);
  }
  console.log(`  ${topicDefs.length} topics seeded`);

  // ─── Seed LEARN + PRACTICE Sprints from JSON Files ──────────────────────────

  const sprintFiles = loadSprintFiles();
  let sprintCount = 0;
  let interactionCount = 0;

  for (const sprintData of sprintFiles) {
    const skillId = skillMap.get(sprintData.skillSlug);
    if (!skillId) {
      console.warn(`  Skill not found: ${sprintData.skillSlug}, skipping`);
      continue;
    }

    const topicKey = `${sprintData.skillSlug}/${sprintData.topicSlug}`;
    const topicId = topicMap.get(topicKey) ?? null;

    const sprintWhere = {
      skillId_title_mode: { skillId, title: sprintData.title, mode: sprintData.mode },
    };
    const sprintPayload = {
      skillId,
      topicId,
      mode: sprintData.mode,
      title: sprintData.title,
      description: sprintData.description ?? null,
      isGenerated: false,
      difficulty: sprintData.difficulty,
      order: sprintData.sprintOrder,
    };

    const sprint = await prisma.sprint.upsert({
      where: sprintWhere,
      update: { topicId, description: sprintPayload.description, difficulty: sprintPayload.difficulty, order: sprintPayload.order },
      create: {
        ...sprintPayload,
        interactions: {
          create: sprintData.interactions.map((interaction) => ({
            skillId,
            type: interaction.type as "TEACH_AND_TEST" | "SPOT_THE_SIGNAL" | "FORCED_TRADEOFF" | "FILL_THE_GAP" | "RANK_AND_PRIORITIZE" | "CURVEBALL",
            order: interaction.order,
            prompt: interaction.prompt,
            options: interaction.options,
            correctAnswer: interaction.correctAnswer,
            insightAnswer: interaction.insightAnswer ?? null,
            teachingPreamble: interaction.teachingPreamble ?? null,
            priorContext: interaction.priorContext ?? null,
            timeTarget: interaction.timeTarget,
          })),
        },
      },
    });
    sprintCount++;
    interactionCount += sprintData.interactions.length;
  }
  console.log(
    `  ${sprintCount} LEARN/PRACTICE sprints seeded (${interactionCount} interactions)`
  );

  // ─── Seed COMPETE Sprints (Pre-cached for demo) ─────────────────────────────

  let competeCount = 0;
  const competeSprintIds = new Map<string, string>();

  for (const sprintData of COMPETE_SPRINTS) {
    const skillId = skillMap.get(sprintData.skillSlug);
    if (!skillId) continue;

    const sprint = await prisma.sprint.upsert({
      where: {
        skillId_title_mode: { skillId, title: sprintData.title, mode: "COMPETE" },
      },
      update: { description: sprintData.description, difficulty: sprintData.difficulty },
      create: {
        skillId,
        mode: "COMPETE",
        title: sprintData.title,
        description: sprintData.description,
        isGenerated: false,
        difficulty: sprintData.difficulty,
        interactions: {
          create: sprintData.interactions.map((interaction) => ({
            skillId,
            type: interaction.type as "SPOT_THE_SIGNAL" | "FORCED_TRADEOFF" | "FILL_THE_GAP" | "RANK_AND_PRIORITIZE" | "CURVEBALL",
            order: interaction.order,
            prompt: interaction.prompt,
            options: interaction.options,
            correctAnswer: interaction.correctAnswer,
            insightAnswer: interaction.insightAnswer,
            priorContext: interaction.priorContext ?? null,
            timeTarget: interaction.timeTarget,
          })),
        },
      },
    });
    competeSprintIds.set(sprintData.skillSlug, sprint.id);
    competeCount++;
  }
  console.log(`  ${competeCount} COMPETE sprints seeded`);

  // ─── Demo Opponent Setup ─────────────────────────────────────────────────

  const DEMO_CLERK_ID = "demo_opponent_001";
  const DEMO_EMAIL = "alex.chen@praxel-arena.demo";

  let demoUser = await prisma.user.findUnique({ where: { clerkId: DEMO_CLERK_ID } });
  if (!demoUser) {
    demoUser = await prisma.user.create({
      data: {
        clerkId: DEMO_CLERK_ID,
        email: DEMO_EMAIL,
        name: "Alex Chen",
        imageUrl: null,
        onboardingComplete: true,
      },
    });
    console.log("  Demo opponent user created: Alex Chen");
  } else {
    console.log("  Demo opponent user already exists");
  }

  const guesstimationSkillId = skillMap.get("guesstimation");
  if (guesstimationSkillId) {
    await prisma.userEloRating.upsert({
      where: {
        userId_skillId: { userId: demoUser.id, skillId: guesstimationSkillId },
      },
      update: {},
      create: {
        userId: demoUser.id,
        skillId: guesstimationSkillId,
        rating: 1250,
        matchCount: 7,
      },
    });

    await prisma.userSkillScore.upsert({
      where: {
        userId_skillId: { userId: demoUser.id, skillId: guesstimationSkillId },
      },
      update: {},
      create: {
        userId: demoUser.id,
        skillId: guesstimationSkillId,
        analyticalThinking: 72,
        strategicReasoning: 68,
        quantitativeReasoning: 75,
        communicationClarity: 65,
        decisionQuality: 70,
        creativeProblemSolving: 63,
        overallScore: 68.8,
        sprintCount: 7,
      },
    });

    const competeSprintId = competeSprintIds.get("guesstimation");
    if (competeSprintId) {
      const existingDuel = await prisma.duel.findFirst({
        where: {
          player1Id: demoUser.id,
          skillId: guesstimationSkillId,
          status: "WAITING",
        },
      });

      if (!existingDuel) {
        const sprintWithInteractions = await prisma.sprint.findUnique({
          where: { id: competeSprintId },
          include: { interactions: { orderBy: { order: "asc" } } },
        });

        if (sprintWithInteractions) {
          const demoResponses = sprintWithInteractions.interactions.map(
            (interaction, idx) => ({
              interactionId: interaction.id,
              answer: DEMO_OPPONENT_RESPONSES[idx]?.answer ?? "a",
              timeSpent: DEMO_OPPONENT_RESPONSES[idx]?.timeSpent ?? 10,
            })
          );

          const demoAttempt = await prisma.sprintAttempt.create({
            data: {
              userId: demoUser.id,
              sprintId: competeSprintId,
              mode: "COMPETE",
              responses: demoResponses,
              scores: {
                analyticalThinking: 70,
                strategicReasoning: 65,
                quantitativeReasoning: 72,
                communicationClarity: 62,
                decisionQuality: 68,
                creativeProblemSolving: 60,
              },
              totalScore: 66.2,
              completedAt: new Date(),
            },
          });

          await prisma.duel.create({
            data: {
              skillId: guesstimationSkillId,
              sprintId: competeSprintId,
              player1Id: demoUser.id,
              player1AttemptId: demoAttempt.id,
              status: "WAITING",
            },
          });

          console.log("  Demo duel created: WAITING with pre-completed opponent attempt");
        }
      } else {
        console.log("  Demo duel already exists, skipping");
      }
    }
  }

  // ─── Seed Challenges ────────────────────────────────────────────────────────

  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const challengeSeeds = [
    {
      templateId: "quick-fire",
      type: "SPEED_ROUND" as const,
      name: "Quick Fire",
      description: "Answer 20 interactions in 5 minutes. Speed + accuracy wins.",
      config: { interactionCount: 20, timeLimitMs: 300000, accuracyThreshold: 0.7 },
      startsAt: now,
      endsAt: tomorrow,
      rewardXpFirst: 250,
      rewardXpTenth: 50,
    },
    {
      templateId: "daily-spotlight",
      type: "SCORE_ATTACK" as const,
      name: "Daily Spotlight",
      description: "Beat the high score on today's featured sprint.",
      config: { timeLimitMs: 300000 },
      startsAt: now,
      endsAt: tomorrow,
      rewardXpFirst: 300,
      rewardXpTenth: 75,
    },
    {
      templateId: "weekly-master",
      type: "SCORE_ATTACK" as const,
      name: "Weekly Master",
      description: "Advanced difficulty, highest score wins. Resets weekly.",
      config: { timeLimitMs: 300000, difficulty: 3 },
      startsAt: now,
      endsAt: nextWeek,
      rewardXpFirst: 300,
      rewardXpTenth: 75,
    },
  ];

  let challengeCount = 0;
  // Pick a random skill for each challenge
  const skillIds = [...skillMap.values()];

  for (const seed of challengeSeeds) {
    const existing = await prisma.challenge.findFirst({
      where: { templateId: seed.templateId, isActive: true },
    });
    if (existing) continue;

    await prisma.challenge.create({
      data: {
        ...seed,
        skillId: skillIds[challengeCount % skillIds.length],
        isActive: true,
      },
    });
    challengeCount++;
  }
  console.log(`  ${challengeCount} challenges seeded`);

  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
