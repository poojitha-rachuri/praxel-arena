/**
 * Script to add dimensionWeights to all seed data interaction JSON files.
 * Weights are assigned based on interaction type + skill context with
 * per-question variation (not just a fixed mapping).
 *
 * Usage: npx tsx scripts/add-dimension-weights.ts
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import path from "path";

function globJsonFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      results.push(...globJsonFiles(full));
    } else if (entry.endsWith(".json")) {
      results.push(full);
    }
  }
  return results;
}

type DimensionKey =
  | "analyticalThinking"
  | "strategicReasoning"
  | "quantitativeReasoning"
  | "communicationClarity"
  | "decisionQuality"
  | "creativeProblemSolving";

type Weights = Partial<Record<DimensionKey, number>>;

// ─── Skill-specific weight profiles ───────────────────────────
// Each skill defines weight templates per interaction type.
// Templates include a primary emphasis + secondary/tertiary dimensions.
// The script adds small random variation per question to avoid uniformity.

const SKILL_WEIGHT_PROFILES: Record<
  string,
  Record<string, Weights>
> = {
  "data-interpretation": {
    SPOT_THE_SIGNAL: { quantitativeReasoning: 0.5, analyticalThinking: 0.35, decisionQuality: 0.15 },
    FORCED_TRADEOFF: { quantitativeReasoning: 0.4, analyticalThinking: 0.3, strategicReasoning: 0.2, decisionQuality: 0.1 },
    FILL_THE_GAP: { quantitativeReasoning: 0.5, analyticalThinking: 0.3, communicationClarity: 0.2 },
    RANK_AND_PRIORITIZE: { analyticalThinking: 0.4, quantitativeReasoning: 0.3, decisionQuality: 0.2, strategicReasoning: 0.1 },
    CURVEBALL: { quantitativeReasoning: 0.35, creativeProblemSolving: 0.35, analyticalThinking: 0.2, decisionQuality: 0.1 },
    TEACH_AND_TEST: { quantitativeReasoning: 0.45, analyticalThinking: 0.35, communicationClarity: 0.2 },
  },
  "financial-statement-analysis": {
    SPOT_THE_SIGNAL: { quantitativeReasoning: 0.5, analyticalThinking: 0.3, decisionQuality: 0.2 },
    FORCED_TRADEOFF: { quantitativeReasoning: 0.4, analyticalThinking: 0.3, strategicReasoning: 0.2, decisionQuality: 0.1 },
    FILL_THE_GAP: { quantitativeReasoning: 0.45, communicationClarity: 0.25, analyticalThinking: 0.3 },
    RANK_AND_PRIORITIZE: { analyticalThinking: 0.35, quantitativeReasoning: 0.35, decisionQuality: 0.2, strategicReasoning: 0.1 },
    CURVEBALL: { analyticalThinking: 0.4, quantitativeReasoning: 0.3, creativeProblemSolving: 0.2, decisionQuality: 0.1 },
    TEACH_AND_TEST: { quantitativeReasoning: 0.45, analyticalThinking: 0.35, communicationClarity: 0.2 },
  },
  "gtm-strategy": {
    SPOT_THE_SIGNAL: { strategicReasoning: 0.45, analyticalThinking: 0.3, decisionQuality: 0.15, communicationClarity: 0.1 },
    FORCED_TRADEOFF: { strategicReasoning: 0.4, decisionQuality: 0.3, analyticalThinking: 0.2, creativeProblemSolving: 0.1 },
    FILL_THE_GAP: { strategicReasoning: 0.4, communicationClarity: 0.3, analyticalThinking: 0.2, decisionQuality: 0.1 },
    RANK_AND_PRIORITIZE: { strategicReasoning: 0.4, decisionQuality: 0.3, analyticalThinking: 0.2, communicationClarity: 0.1 },
    CURVEBALL: { creativeProblemSolving: 0.35, strategicReasoning: 0.35, decisionQuality: 0.2, analyticalThinking: 0.1 },
    TEACH_AND_TEST: { strategicReasoning: 0.4, decisionQuality: 0.3, communicationClarity: 0.2, analyticalThinking: 0.1 },
  },
  "pricing-monetization": {
    SPOT_THE_SIGNAL: { quantitativeReasoning: 0.4, strategicReasoning: 0.3, analyticalThinking: 0.2, decisionQuality: 0.1 },
    FORCED_TRADEOFF: { strategicReasoning: 0.4, quantitativeReasoning: 0.3, decisionQuality: 0.2, analyticalThinking: 0.1 },
    FILL_THE_GAP: { quantitativeReasoning: 0.4, strategicReasoning: 0.3, communicationClarity: 0.2, analyticalThinking: 0.1 },
    RANK_AND_PRIORITIZE: { strategicReasoning: 0.35, decisionQuality: 0.3, quantitativeReasoning: 0.25, analyticalThinking: 0.1 },
    CURVEBALL: { creativeProblemSolving: 0.35, strategicReasoning: 0.3, quantitativeReasoning: 0.25, decisionQuality: 0.1 },
    TEACH_AND_TEST: { quantitativeReasoning: 0.4, strategicReasoning: 0.3, analyticalThinking: 0.2, communicationClarity: 0.1 },
  },
  "prioritization": {
    SPOT_THE_SIGNAL: { decisionQuality: 0.45, strategicReasoning: 0.3, analyticalThinking: 0.15, communicationClarity: 0.1 },
    FORCED_TRADEOFF: { decisionQuality: 0.4, strategicReasoning: 0.3, analyticalThinking: 0.2, creativeProblemSolving: 0.1 },
    FILL_THE_GAP: { strategicReasoning: 0.4, decisionQuality: 0.3, communicationClarity: 0.2, analyticalThinking: 0.1 },
    RANK_AND_PRIORITIZE: { decisionQuality: 0.45, strategicReasoning: 0.3, analyticalThinking: 0.15, communicationClarity: 0.1 },
    CURVEBALL: { decisionQuality: 0.35, creativeProblemSolving: 0.35, strategicReasoning: 0.2, analyticalThinking: 0.1 },
    TEACH_AND_TEST: { decisionQuality: 0.4, strategicReasoning: 0.3, analyticalThinking: 0.2, communicationClarity: 0.1 },
  },
  "stakeholder-communication": {
    SPOT_THE_SIGNAL: { communicationClarity: 0.45, analyticalThinking: 0.25, strategicReasoning: 0.2, decisionQuality: 0.1 },
    FORCED_TRADEOFF: { communicationClarity: 0.35, strategicReasoning: 0.3, decisionQuality: 0.25, analyticalThinking: 0.1 },
    FILL_THE_GAP: { communicationClarity: 0.5, strategicReasoning: 0.2, analyticalThinking: 0.2, decisionQuality: 0.1 },
    RANK_AND_PRIORITIZE: { communicationClarity: 0.4, strategicReasoning: 0.3, decisionQuality: 0.2, analyticalThinking: 0.1 },
    CURVEBALL: { communicationClarity: 0.3, creativeProblemSolving: 0.3, decisionQuality: 0.25, strategicReasoning: 0.15 },
    TEACH_AND_TEST: { communicationClarity: 0.45, analyticalThinking: 0.25, decisionQuality: 0.2, strategicReasoning: 0.1 },
  },
  "valuation": {
    SPOT_THE_SIGNAL: { quantitativeReasoning: 0.5, analyticalThinking: 0.3, strategicReasoning: 0.1, decisionQuality: 0.1 },
    FORCED_TRADEOFF: { quantitativeReasoning: 0.35, strategicReasoning: 0.3, decisionQuality: 0.25, analyticalThinking: 0.1 },
    FILL_THE_GAP: { quantitativeReasoning: 0.45, analyticalThinking: 0.3, communicationClarity: 0.15, strategicReasoning: 0.1 },
    RANK_AND_PRIORITIZE: { quantitativeReasoning: 0.35, analyticalThinking: 0.3, decisionQuality: 0.25, strategicReasoning: 0.1 },
    CURVEBALL: { creativeProblemSolving: 0.3, quantitativeReasoning: 0.3, analyticalThinking: 0.25, decisionQuality: 0.15 },
    TEACH_AND_TEST: { quantitativeReasoning: 0.45, analyticalThinking: 0.3, communicationClarity: 0.15, strategicReasoning: 0.1 },
  },
  "guesstimation": {
    SPOT_THE_SIGNAL: { quantitativeReasoning: 0.45, creativeProblemSolving: 0.25, analyticalThinking: 0.2, decisionQuality: 0.1 },
    FORCED_TRADEOFF: { quantitativeReasoning: 0.4, strategicReasoning: 0.25, decisionQuality: 0.2, analyticalThinking: 0.15 },
    FILL_THE_GAP: { quantitativeReasoning: 0.45, analyticalThinking: 0.3, communicationClarity: 0.15, creativeProblemSolving: 0.1 },
    RANK_AND_PRIORITIZE: { quantitativeReasoning: 0.35, analyticalThinking: 0.3, decisionQuality: 0.25, strategicReasoning: 0.1 },
    CURVEBALL: { creativeProblemSolving: 0.4, quantitativeReasoning: 0.3, analyticalThinking: 0.2, decisionQuality: 0.1 },
    TEACH_AND_TEST: { quantitativeReasoning: 0.45, analyticalThinking: 0.3, creativeProblemSolving: 0.15, communicationClarity: 0.1 },
  },
};

// Default fallback for skills without profiles
const DEFAULT_WEIGHTS: Record<string, Weights> = {
  SPOT_THE_SIGNAL: { analyticalThinking: 0.5, quantitativeReasoning: 0.3, decisionQuality: 0.2 },
  FORCED_TRADEOFF: { strategicReasoning: 0.45, decisionQuality: 0.3, analyticalThinking: 0.15, creativeProblemSolving: 0.1 },
  FILL_THE_GAP: { communicationClarity: 0.45, analyticalThinking: 0.3, strategicReasoning: 0.15, decisionQuality: 0.1 },
  RANK_AND_PRIORITIZE: { strategicReasoning: 0.4, decisionQuality: 0.3, analyticalThinking: 0.2, communicationClarity: 0.1 },
  CURVEBALL: { creativeProblemSolving: 0.4, decisionQuality: 0.3, analyticalThinking: 0.2, strategicReasoning: 0.1 },
  TEACH_AND_TEST: { analyticalThinking: 0.4, communicationClarity: 0.3, quantitativeReasoning: 0.2, decisionQuality: 0.1 },
};

// ─── Variation logic ──────────────────────────────────────────
// Add small per-question variation so not all questions of the same type
// in the same skill have identical weights.

function addVariation(base: Weights, questionOrder: number, seed: number): Weights {
  const entries = Object.entries(base) as [DimensionKey, number][];
  const variation = 0.05; // ±5% variation

  // Deterministic pseudo-random based on order + seed
  const hash = (questionOrder * 7 + seed * 13) % 100;
  const direction = hash % 2 === 0 ? 1 : -1;
  const magnitude = (hash % 5 + 1) / 100; // 0.01 to 0.05

  const adjusted: Weights = {};
  let total = 0;

  for (const [key, value] of entries) {
    // Alternate which dimensions get boosted vs reduced
    const idx = entries.indexOf(entries.find(([k]) => k === key)!);
    const sign = (idx + direction) % 2 === 0 ? 1 : -1;
    const newVal = Math.max(0.05, value + sign * magnitude * variation * 10);
    adjusted[key] = newVal;
    total += newVal;
  }

  // Normalize to sum to 1.0
  for (const key of Object.keys(adjusted) as DimensionKey[]) {
    adjusted[key] = Math.round((adjusted[key]! / total) * 100) / 100;
  }

  // Fix rounding: adjust largest weight to make sum exactly 1.0
  const sum = Object.values(adjusted).reduce((a, b) => a + b!, 0);
  if (sum !== 1) {
    const maxKey = Object.entries(adjusted).reduce((a, b) =>
      b[1]! > a[1]! ? b : a
    )[0] as DimensionKey;
    adjusted[maxKey] = Math.round((adjusted[maxKey]! + (1 - sum)) * 100) / 100;
  }

  return adjusted;
}

// ─── Main ─────────────────────────────────────────────────────

const seedDir = path.join(process.cwd(), "prisma/seed-data");
const allFiles = globJsonFiles(seedDir);
const files = allFiles.filter((f) => !f.includes("demo-") && !f.endsWith("topics.json"));

let totalFiles = 0;
let totalInteractions = 0;

for (const filePath of files) {
  const content = JSON.parse(readFileSync(filePath, "utf-8"));

  if (!content.interactions || !Array.isArray(content.interactions)) continue;

  const skillSlug = content.skillSlug as string;
  const profile = SKILL_WEIGHT_PROFILES[skillSlug] || {};
  const fileSeed = filePath.split("/").join("").length; // deterministic seed per file

  let modified = false;

  for (const interaction of content.interactions) {
    const type = interaction.type as string;
    const order = interaction.order as number;

    // Get base weights from skill profile or default
    const baseWeights = profile[type] || DEFAULT_WEIGHTS[type];
    if (!baseWeights) {
      console.warn(`  No weights for type ${type} in ${filePath}`);
      continue;
    }

    // Add per-question variation
    interaction.dimensionWeights = addVariation(baseWeights, order, fileSeed);
    modified = true;
    totalInteractions++;
  }

  if (modified) {
    writeFileSync(filePath, JSON.stringify(content, null, 2) + "\n");
    totalFiles++;
  }
}

console.log(`Done! Updated ${totalInteractions} interactions across ${totalFiles} files.`);
