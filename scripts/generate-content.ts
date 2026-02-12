#!/usr/bin/env npx tsx
/**
 * AI Content Generation Pipeline for Praxel Arena
 *
 * Usage:
 *   npx tsx scripts/generate-content.ts --skill guesstimation --topic market-sizing-fundamentals --mode LEARN --sprint 1
 *   npx tsx scripts/generate-content.ts --skill guesstimation --all
 *   npx tsx scripts/generate-content.ts --all
 *   npx tsx scripts/generate-content.ts --skill guesstimation --topic market-sizing-fundamentals --mode LEARN --sprint 2 --dry-run
 *
 * Output: prisma/seed-data/<skill>/<topic>/<mode>-<N>.json
 */

import Anthropic from "@anthropic-ai/sdk";
import * as fs from "fs";
import * as path from "path";
import {
  sprintFileSchema,
  type SprintFile,
  type TopicDefinition,
} from "../lib/validation/content-schema";

// ─── Config ─────────────────────────────────────────────

const SEED_DATA_DIR = path.resolve(__dirname, "../prisma/seed-data");
const TOPICS_FILE = path.join(SEED_DATA_DIR, "topics.json");
const MAX_TOKENS = 8192;
const MODEL = "claude-opus-4-6";
const INTERACTIONS_PER_SPRINT = 8;

// ─── Skill Definitions ──────────────────────────────────

interface SkillDef {
  slug: string;
  name: string;
  description: string;
}

const SKILLS: Record<string, SkillDef> = {
  guesstimation: {
    slug: "guesstimation",
    name: "Guesstimation",
    description:
      "Fermi estimates, market sizing, unit economics, and quantitative reasoning under uncertainty",
  },
  "gtm-strategy": {
    slug: "gtm-strategy",
    name: "GTM Strategy",
    description:
      "Go-to-market planning, product launches, channel strategy, market entry, and growth planning",
  },
  prioritization: {
    slug: "prioritization",
    name: "Prioritization",
    description:
      "Prioritization frameworks, tradeoff decisions, resource allocation, and strategic saying-no",
  },
  "data-interpretation": {
    slug: "data-interpretation",
    name: "Data Interpretation",
    description:
      "Reading charts, statistical thinking, A/B testing, experimentation, and data storytelling",
  },
  "pricing-monetization": {
    slug: "pricing-monetization",
    name: "Pricing & Monetization",
    description:
      "Pricing strategy, monetization models, price optimization, and packaging/bundling",
  },
  "stakeholder-communication": {
    slug: "stakeholder-communication",
    name: "Stakeholder Communication",
    description:
      "Executive communication, cross-functional alignment, difficult conversations, and investor relations",
  },
};

// ─── Topic + Sprint Config ──────────────────────────────

interface SprintConfig {
  topicSlug: string;
  topicName: string;
  topicDescription: string;
  mode: "LEARN" | "PRACTICE";
  sprintOrder: number; // 1 or 2 for LEARN, 1 for PRACTICE
  difficulty: number;
}

/**
 * Build all sprint configs for a skill (2 LEARN + 1 PRACTICE per topic).
 * Difficulty comes from the plan's topic taxonomy tables.
 */
function buildSprintConfigs(
  skillSlug: string,
  topics: TopicDefinition[]
): SprintConfig[] {
  const skillTopics = topics.filter((t) => t.skillSlug === skillSlug);
  const configs: SprintConfig[] = [];

  for (const topic of skillTopics) {
    // LEARN sprint 1 (easier)
    configs.push({
      topicSlug: topic.slug,
      topicName: topic.name,
      topicDescription: topic.description ?? "",
      mode: "LEARN",
      sprintOrder: 1,
      difficulty: Math.max(1, topic.order), // order 1→diff 1, order 2→diff 2, etc.
    });

    // LEARN sprint 2 (harder)
    configs.push({
      topicSlug: topic.slug,
      topicName: topic.name,
      topicDescription: topic.description ?? "",
      mode: "LEARN",
      sprintOrder: 2,
      difficulty: Math.min(5, topic.order + 1),
    });

    // PRACTICE sprint 1 (harder than LEARN)
    configs.push({
      topicSlug: topic.slug,
      topicName: topic.name,
      topicDescription: topic.description ?? "",
      mode: "PRACTICE",
      sprintOrder: 1,
      difficulty: Math.min(5, topic.order + 1),
    });
  }

  return configs;
}

// ─── Prompt Building ────────────────────────────────────

const SCORING_DIMENSIONS = [
  { key: "analyticalThinking", label: "Analytical Thinking", description: "Breaking down complex problems into components" },
  { key: "strategicReasoning", label: "Strategic Reasoning", description: "Evaluating long-term implications and tradeoffs" },
  { key: "quantitativeReasoning", label: "Quantitative Reasoning", description: "Working with numbers, estimates, and data" },
  { key: "communicationClarity", label: "Communication Clarity", description: "Expressing ideas clearly and persuasively" },
  { key: "decisionQuality", label: "Decision Quality", description: "Making sound decisions under uncertainty" },
  { key: "creativeProblemSolving", label: "Creative Problem Solving", description: "Finding novel approaches to challenges" },
];

function buildPrompt(
  skill: SkillDef,
  config: SprintConfig,
  existingSprints: string[]
): { system: string; user: string } {
  const dimensionList = SCORING_DIMENSIONS.map(
    (d) => `- ${d.label}: ${d.description}`
  ).join("\n");

  const existingContext =
    existingSprints.length > 0
      ? `\n\nALREADY GENERATED SPRINTS FOR THIS TOPIC (avoid duplicating concepts):\n${existingSprints.map((t, i) => `${i + 1}. ${t}`).join("\n")}`
      : "";

  const isLearn = config.mode === "LEARN";

  const interactionSequence = isLearn
    ? `RECOMMENDED SEQUENCE:
1. TEACH_AND_TEST -- Introduce core concept (timeTarget: 25)
2. SPOT_THE_SIGNAL -- Apply concept to data (timeTarget: 10)
3. TEACH_AND_TEST -- Deepen with second concept (timeTarget: 25)
4. FILL_THE_GAP -- Quick knowledge check (timeTarget: 10)
5. FORCED_TRADEOFF -- Apply concepts to real decision (timeTarget: 15)
6. TEACH_AND_TEST -- Advanced concept (timeTarget: 25)
7. RANK_AND_PRIORITIZE -- Synthesize learning (timeTarget: 20)
8. CURVEBALL -- Test adaptability with a twist (timeTarget: 15)`
    : `PRACTICE MODE SEQUENCE (NO TEACH_AND_TEST):
Use a mix of these 5 types (no TEACH_AND_TEST in PRACTICE mode):
- SPOT_THE_SIGNAL (timeTarget: 10)
- FORCED_TRADEOFF (timeTarget: 15)
- FILL_THE_GAP (timeTarget: 10)
- RANK_AND_PRIORITIZE (timeTarget: 20)
- CURVEBALL (timeTarget: 15)

Recommended: 2x SPOT_THE_SIGNAL, 2x FORCED_TRADEOFF, 1x FILL_THE_GAP, 2x RANK_AND_PRIORITIZE, 1x CURVEBALL`;

  const system = `You are Praxel, an expert business educator who creates micro-learning and practice modules for business professionals. Your content is practical, data-driven, and uses real-world business scenarios.

You are generating content for the skill "${skill.name}" (${skill.description}).

TOPIC: ${config.topicName}
TOPIC DESCRIPTION: ${config.topicDescription}
MODE: ${config.mode}
DIFFICULTY: ${config.difficulty}/5 (${config.difficulty <= 2 ? "beginner-friendly" : config.difficulty <= 3 ? "intermediate" : "advanced"})
SPRINT ORDER: ${config.sprintOrder} within this topic

SCORING DIMENSIONS (what skills are being developed):
${dimensionList}

INTERACTION TYPES:

1. TEACH_AND_TEST (${isLearn ? "LEARN mode only" : "NOT ALLOWED in PRACTICE"}):
   - teachingPreamble: 2-3 sentences teaching a concept with a real-world example
   - prompt: Test question (max 2 sentences)
   - 4 options (a,b,c,d), each max 15 words
   - correctAnswer: "a"/"b"/"c"/"d"
   - insightAnswer: same as correctAnswer
   - priorContext: null
   - timeTarget: 25

2. SPOT_THE_SIGNAL (10s): Show data/metrics, pick key insight
   - prompt: Present data requiring interpretation (max 3 sentences)
   - teachingPreamble: null, priorContext: null
   - timeTarget: 10

3. FILL_THE_GAP (10s): Fill-in-the-blank
   - prompt: Statement with ____ blank
   - teachingPreamble: null, priorContext: null
   - timeTarget: 10

4. FORCED_TRADEOFF (15s): Choose between strategic options
   - prompt: Genuine dilemma (max 3 sentences)
   - teachingPreamble: null, priorContext: null
   - timeTarget: 15

5. RANK_AND_PRIORITIZE (20s): Rank 4 items
   - prompt: Scenario requiring prioritization
   - correctAnswer: comma-separated like "b,d,a,c"
   - teachingPreamble: null, priorContext: null
   - timeTarget: 20

6. CURVEBALL (15s): Context changes
   - prompt: New scenario changing assumptions
   - priorContext: REQUIRED string describing what changed
   - teachingPreamble: null
   - timeTarget: 15

${interactionSequence}
${existingContext}

OUTPUT: Return ONLY a JSON object. No markdown, no commentary.`;

  const user = `Generate a ${config.mode} sprint for "${skill.name}" on the topic "${config.topicName}" (${config.topicDescription}).

This is sprint ${config.sprintOrder} within this topic at difficulty ${config.difficulty}/5.

Return JSON in this exact format:
{
  "skillSlug": "${skill.slug}",
  "topicSlug": "${config.topicSlug}",
  "mode": "${config.mode}",
  "title": "Descriptive 3-8 word title",
  "description": "One sentence describing what the learner will master",
  "difficulty": ${config.difficulty},
  "sprintOrder": ${config.sprintOrder},
  "interactions": [
    {
      "type": "...",
      "order": 1,
      "prompt": "...",
      "options": [
        { "id": "a", "text": "..." },
        { "id": "b", "text": "..." },
        { "id": "c", "text": "..." },
        { "id": "d", "text": "..." }
      ],
      "correctAnswer": "...",
      "insightAnswer": "...",
      "teachingPreamble": null,
      "priorContext": null,
      "timeTarget": 15
    }
  ]
}

CRITICAL:
- Exactly ${INTERACTIONS_PER_SPRINT} interactions
- ${isLearn ? "TEACH_AND_TEST interactions MUST have teachingPreamble" : "NO TEACH_AND_TEST type in PRACTICE mode"}
- CURVEBALL MUST have priorContext (string), all others priorContext: null
- RANK_AND_PRIORITIZE correctAnswer: "b,d,a,c" format
- Each option text max 15 words
- Use real/realistic company names and metrics
- insightAnswer = correctAnswer (the option ID)
- Progressive difficulty across the 8 interactions`;

  return { system, user };
}

// ─── AI Generation ──────────────────────────────────────

function extractJSON<T>(text: string): T {
  const cleaned = text
    .replace(/^```(?:json)?\s*\n?/m, "")
    .replace(/\n?```\s*$/m, "");

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]) as T;
    }
    throw new Error(`Invalid JSON: ${text.slice(0, 200)}`);
  }
}

async function generateSprint(
  client: Anthropic,
  skill: SkillDef,
  config: SprintConfig,
  existingSprints: string[],
  dryRun: boolean
): Promise<SprintFile | null> {
  const { system, user } = buildPrompt(skill, config, existingSprints);
  const outDir = path.join(SEED_DATA_DIR, skill.slug, config.topicSlug);
  const outFile = path.join(
    outDir,
    `${config.mode.toLowerCase()}-${config.sprintOrder}.json`
  );

  // Skip if already exists (unless force regenerate)
  if (fs.existsSync(outFile)) {
    console.log(`  SKIP ${outFile} (already exists)`);
    return null;
  }

  if (dryRun) {
    console.log(`  DRY-RUN: Would generate ${outFile}`);
    console.log(`    Skill: ${skill.name}, Topic: ${config.topicName}`);
    console.log(
      `    Mode: ${config.mode}, Sprint: ${config.sprintOrder}, Difficulty: ${config.difficulty}`
    );
    return null;
  }

  console.log(
    `  Generating ${config.mode} sprint ${config.sprintOrder} for ${config.topicName}...`
  );

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system,
    messages: [{ role: "user", content: user }],
  });

  const text = message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");

  let sprint: SprintFile;
  try {
    sprint = extractJSON<SprintFile>(text);
  } catch (err) {
    console.error(`    PARSE ERROR: ${(err as Error).message}`);
    return null;
  }

  // Sanitize
  sprint = sanitizeSprint(sprint, skill.slug, config);

  // Validate
  const result = sprintFileSchema.safeParse(sprint);
  if (!result.success) {
    console.error(`    VALIDATION FAILED:`);
    for (const issue of result.error.issues) {
      console.error(`      ${issue.path.join(".")}: ${issue.message}`);
    }

    // Retry once
    console.log(`    Retrying...`);
    const retryMsg = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system,
      messages: [
        { role: "user", content: user },
        { role: "assistant", content: text },
        {
          role: "user",
          content: `Your response had validation errors:\n${result.error.issues.map((i) => `- ${i.path.join(".")}: ${i.message}`).join("\n")}\n\nPlease fix these and return the corrected JSON only.`,
        },
      ],
    });

    const retryText = retryMsg.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("");

    try {
      sprint = extractJSON<SprintFile>(retryText);
      sprint = sanitizeSprint(sprint, skill.slug, config);
      const retryResult = sprintFileSchema.safeParse(sprint);
      if (!retryResult.success) {
        console.error(`    RETRY FAILED. Skipping.`);
        for (const issue of retryResult.error.issues) {
          console.error(`      ${issue.path.join(".")}: ${issue.message}`);
        }
        return null;
      }
      sprint = retryResult.data;
    } catch (err) {
      console.error(`    RETRY PARSE ERROR: ${(err as Error).message}`);
      return null;
    }
  } else {
    sprint = result.data;
  }

  // Write output
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(sprint, null, 2) + "\n");

  const types = sprint.interactions.map((i) => i.type).join(", ");
  console.log(`    OK: "${sprint.title}" [${types}]`);
  console.log(`    -> ${outFile}`);

  return sprint;
}

function sanitizeSprint(
  sprint: SprintFile,
  skillSlug: string,
  config: SprintConfig
): SprintFile {
  // Ensure correct metadata
  sprint.skillSlug = skillSlug;
  sprint.topicSlug = config.topicSlug;
  sprint.mode = config.mode;
  sprint.sprintOrder = config.sprintOrder;
  sprint.difficulty = config.difficulty;

  if (!sprint.interactions) return sprint;

  for (let i = 0; i < sprint.interactions.length; i++) {
    const interaction = sprint.interactions[i] as Record<string, unknown>;

    // Fix order
    interaction.order = i + 1;

    // Normalize correctAnswer
    if (typeof interaction.correctAnswer === "string") {
      interaction.correctAnswer = (interaction.correctAnswer as string)
        .trim()
        .toLowerCase();
    }

    // Ensure null for optional fields
    if (!interaction.teachingPreamble) interaction.teachingPreamble = null;
    if (!interaction.priorContext) interaction.priorContext = null;
    if (!interaction.insightAnswer) {
      interaction.insightAnswer = interaction.correctAnswer ?? null;
    }

    // Clamp timeTarget
    const tt = interaction.timeTarget as number;
    if (!tt || tt < 5) interaction.timeTarget = 15;
    else if (tt > 60) interaction.timeTarget = 30;
  }

  return sprint;
}

// ─── CLI ────────────────────────────────────────────────

function parseArgs(): {
  skill?: string;
  topic?: string;
  mode?: "LEARN" | "PRACTICE";
  sprint?: number;
  all: boolean;
  dryRun: boolean;
} {
  const args = process.argv.slice(2);
  const result: ReturnType<typeof parseArgs> = { all: false, dryRun: false };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--skill":
        result.skill = args[++i];
        break;
      case "--topic":
        result.topic = args[++i];
        break;
      case "--mode":
        result.mode = args[++i]?.toUpperCase() as "LEARN" | "PRACTICE";
        break;
      case "--sprint":
        result.sprint = parseInt(args[++i], 10);
        break;
      case "--all":
        result.all = true;
        break;
      case "--dry-run":
        result.dryRun = true;
        break;
      default:
        console.error(`Unknown arg: ${args[i]}`);
        process.exit(1);
    }
  }

  return result;
}

async function main() {
  const args = parseArgs();

  // Validate API key
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("Error: ANTHROPIC_API_KEY not set");
    process.exit(1);
  }

  // Load topics
  if (!fs.existsSync(TOPICS_FILE)) {
    console.error(`Error: ${TOPICS_FILE} not found`);
    process.exit(1);
  }
  const allTopics: TopicDefinition[] = JSON.parse(
    fs.readFileSync(TOPICS_FILE, "utf-8")
  );

  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    timeout: 120_000,
    maxRetries: 2,
  });

  // Determine which skills to generate
  let skillSlugs: string[];
  if (args.all && !args.skill) {
    skillSlugs = Object.keys(SKILLS);
  } else if (args.skill) {
    if (!SKILLS[args.skill]) {
      console.error(`Unknown skill: ${args.skill}`);
      console.error(`Available: ${Object.keys(SKILLS).join(", ")}`);
      process.exit(1);
    }
    skillSlugs = [args.skill];
  } else {
    console.error(
      "Usage: npx tsx scripts/generate-content.ts --skill <slug> [--topic <slug>] [--mode LEARN|PRACTICE] [--sprint <N>] [--all] [--dry-run]"
    );
    process.exit(1);
  }

  let totalGenerated = 0;
  let totalSkipped = 0;
  let totalFailed = 0;

  for (const skillSlug of skillSlugs) {
    const skill = SKILLS[skillSlug];
    console.log(`\n${"=".repeat(60)}`);
    console.log(`SKILL: ${skill.name} (${skill.slug})`);
    console.log(`${"=".repeat(60)}`);

    let configs = buildSprintConfigs(skillSlug, allTopics);

    // Filter by topic if specified
    if (args.topic) {
      configs = configs.filter((c) => c.topicSlug === args.topic);
      if (configs.length === 0) {
        console.error(`No topic "${args.topic}" found for skill "${skillSlug}"`);
        continue;
      }
    }

    // Filter by mode if specified
    if (args.mode) {
      configs = configs.filter((c) => c.mode === args.mode);
    }

    // Filter by sprint number if specified
    if (args.sprint !== undefined) {
      configs = configs.filter((c) => c.sprintOrder === args.sprint);
    }

    console.log(`Generating ${configs.length} sprints...\n`);

    // Group by topic for context
    const byTopic = new Map<string, SprintConfig[]>();
    for (const c of configs) {
      if (!byTopic.has(c.topicSlug)) byTopic.set(c.topicSlug, []);
      byTopic.get(c.topicSlug)!.push(c);
    }

    for (const [topicSlug, topicConfigs] of byTopic) {
      console.log(`\nTopic: ${topicConfigs[0].topicName} (${topicSlug})`);
      const existingTitles: string[] = [];

      for (const config of topicConfigs) {
        const result = await generateSprint(
          client,
          skill,
          config,
          existingTitles,
          args.dryRun
        );

        if (result) {
          existingTitles.push(result.title);
          totalGenerated++;
        } else if (
          fs.existsSync(
            path.join(
              SEED_DATA_DIR,
              skill.slug,
              config.topicSlug,
              `${config.mode.toLowerCase()}-${config.sprintOrder}.json`
            )
          )
        ) {
          totalSkipped++;
        } else if (!args.dryRun) {
          totalFailed++;
        }
      }
    }
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`SUMMARY`);
  console.log(`${"=".repeat(60)}`);
  console.log(`Generated: ${totalGenerated}`);
  console.log(`Skipped (existing): ${totalSkipped}`);
  console.log(`Failed: ${totalFailed}`);
  console.log(
    `Total sprints in seed-data: ${countExistingFiles()} files`
  );
}

function countExistingFiles(): number {
  let count = 0;
  if (!fs.existsSync(SEED_DATA_DIR)) return 0;

  function walk(dir: string) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        walk(path.join(dir, entry.name));
      } else if (
        entry.name.endsWith(".json") &&
        entry.name !== "topics.json"
      ) {
        count++;
      }
    }
  }

  walk(SEED_DATA_DIR);
  return count;
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
