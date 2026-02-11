import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required for seeding");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const SKILLS = [
  {
    name: "Guesstimation",
    slug: "guesstimation",
    description:
      "Market sizing, Fermi estimates, and quantitative reasoning under uncertainty",
    icon: "🎯",
    careers: ["consulting", "product-management", "founder"],
  },
  {
    name: "GTM Strategy",
    slug: "gtm-strategy",
    description:
      "Go-to-market planning, channel strategy, launch sequencing, and market entry",
    icon: "🚀",
    careers: ["marketing", "product-management", "founder", "growth"],
  },
  {
    name: "Pricing & Monetization",
    slug: "pricing-monetization",
    description:
      "Pricing models, willingness-to-pay, unit economics, and packaging strategy",
    icon: "💰",
    careers: [
      "product-management",
      "founder",
      "consulting",
      "sales-strategy",
    ],
  },
  {
    name: "Data Interpretation",
    slug: "data-interpretation",
    description:
      "Reading dashboards, identifying signals in noise, drawing conclusions from metrics",
    icon: "📊",
    careers: [
      "product-management",
      "growth",
      "consulting",
      "business-operations",
    ],
  },
  {
    name: "Prioritization",
    slug: "prioritization",
    description:
      "Frameworks for tradeoff decisions, resource allocation, and saying no",
    icon: "⚖️",
    careers: [
      "product-management",
      "consulting",
      "founder",
      "business-operations",
    ],
  },
  {
    name: "Stakeholder Communication",
    slug: "stakeholder-communication",
    description:
      "Structuring arguments, executive communication, persuasion, and alignment",
    icon: "🗣️",
    careers: [
      "product-management",
      "consulting",
      "marketing",
      "sales-strategy",
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
    description:
      "Build and scale new ventures from zero to one",
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
  for (const skill of SKILLS) {
    const { careers, ...skillData } = skill;
    const record = await prisma.skill.upsert({
      where: { slug: skillData.slug },
      update: {},
      create: skillData,
    });

    // Create skill-career mappings
    for (const careerSlug of careers) {
      const careerOutcomeId = careerMap.get(careerSlug);
      if (!careerOutcomeId) continue;

      await prisma.skillCareerMap.upsert({
        where: {
          skillId_careerOutcomeId: {
            skillId: record.id,
            careerOutcomeId,
          },
        },
        update: {},
        create: {
          skillId: record.id,
          careerOutcomeId,
          weight: 1.0,
        },
      });
    }
  }
  console.log(`  ${SKILLS.length} skills seeded with career mappings`);

  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
