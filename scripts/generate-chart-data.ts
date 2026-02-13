/**
 * Generate chartData for SPOT_THE_SIGNAL interactions in seed JSONs.
 *
 * Usage: npx tsx scripts/generate-chart-data.ts [--dry-run]
 *
 * Reads all seed JSON files, finds SPOT_THE_SIGNAL interactions without chartData,
 * generates contextually relevant chart data using Claude, validates with Zod,
 * and writes back to JSON files.
 */

import Anthropic from "@anthropic-ai/sdk";
import * as fs from "fs";
import * as path from "path";

const SEED_DIR = path.resolve(__dirname, "../prisma/seed-data");
const DRY_RUN = process.argv.includes("--dry-run");

interface ChartData {
  type: "bar" | "line" | "pie" | "area";
  title?: string;
  data: Record<string, string | number>[];
  xKey?: string;
  yKey?: string;
  nameKey?: string;
  dataKey?: string;
}

function validateChartData(obj: unknown): ChartData | null {
  if (!obj || typeof obj !== "object") return null;
  const o = obj as Record<string, unknown>;
  if (!["bar", "line", "pie", "area"].includes(o.type as string)) return null;
  if (!Array.isArray(o.data) || o.data.length < 2) return null;
  return obj as ChartData;
}

interface Interaction {
  type: string;
  prompt: string;
  chartData?: ChartData;
  [key: string]: unknown;
}

interface SprintData {
  title: string;
  interactions: Interaction[];
  [key: string]: unknown;
}

const client = new Anthropic();

async function generateChartData(prompt: string, skillContext: string): Promise<ChartData | null> {
  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: `You are generating chart data for a business skills quiz question. Given the question prompt below, generate a JSON object representing a chart that would help the user answer the question. The chart should contain the data referenced in the prompt.

Skill context: ${skillContext}

Question prompt: "${prompt}"

Requirements:
- Choose the most appropriate chart type: "bar" (comparisons), "line" (trends over time), "pie" (proportions/share), "area" (volume trends)
- Include 3-7 data points that match what the question describes
- Data should be realistic business data
- Include a short title for the chart

Return ONLY a valid JSON object with this structure:
{
  "type": "bar"|"line"|"pie"|"area",
  "title": "Chart Title",
  "data": [{"name": "Label", "value": 123}, ...],
  "xKey": "name",
  "yKey": "value"
}

For pie charts, use "nameKey" and "dataKey" instead of "xKey" and "yKey".

If the question is purely qualitative (no data/numbers/metrics to visualize), respond with just the word NULL.`,
        },
      ],
    });

    const text = response.content[0].type === "text" ? response.content[0].text.trim() : "";

    if (text === "NULL" || text.toUpperCase() === "NULL") {
      return null;
    }

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);
    const validated = validateChartData(parsed);
    return validated;
  } catch (error) {
    console.error(`  Failed to generate chart:`, error instanceof Error ? error.message : error);
    return null;
  }
}

async function main() {
  console.log(`\n📊 Chart Data Generator`);
  console.log(`Mode: ${DRY_RUN ? "DRY RUN" : "LIVE (will modify files)"}\n`);

  // Find all seed JSON files (skip topics.json and demo-challenges)
  const files: string[] = [];
  function walk(dir: string) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "demo-challenges") continue;
        walk(full);
      } else if (entry.name.endsWith(".json") && entry.name !== "topics.json") {
        files.push(full);
      }
    }
  }
  walk(SEED_DIR);

  let totalFiles = 0;
  let totalInteractions = 0;
  let totalGenerated = 0;
  let totalSkipped = 0;

  for (const file of files) {
    const relPath = path.relative(SEED_DIR, file);
    const raw = fs.readFileSync(file, "utf-8");
    const data: SprintData = JSON.parse(raw);

    if (!data.interactions || !Array.isArray(data.interactions)) continue;

    const spotSignals = data.interactions.filter(
      (i) => i.type === "SPOT_THE_SIGNAL" && !i.chartData
    );

    if (spotSignals.length === 0) continue;

    totalFiles++;
    console.log(`📁 ${relPath} (${spotSignals.length} SPOT_THE_SIGNAL without chart)`);

    // Extract skill context from file path
    const parts = relPath.split("/");
    const skillContext = parts[0]?.replace(/-/g, " ") ?? "business";

    let fileModified = false;

    for (const interaction of spotSignals) {
      totalInteractions++;
      process.stdout.write(`  → Generating for: "${interaction.prompt.slice(0, 60)}..." `);

      const chartData = await generateChartData(interaction.prompt, skillContext);

      if (chartData) {
        interaction.chartData = chartData;
        fileModified = true;
        totalGenerated++;
        console.log(`✅ ${chartData.type} chart`);
      } else {
        totalSkipped++;
        console.log(`⏭️ skipped (qualitative)`);
      }

      // Rate limiting: small delay between API calls
      await new Promise((r) => setTimeout(r, 200));
    }

    if (fileModified && !DRY_RUN) {
      fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
      console.log(`  💾 Saved\n`);
    } else if (fileModified) {
      console.log(`  [DRY RUN] Would save\n`);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`  Files processed: ${totalFiles}`);
  console.log(`  Interactions analyzed: ${totalInteractions}`);
  console.log(`  Charts generated: ${totalGenerated}`);
  console.log(`  Skipped (qualitative): ${totalSkipped}`);
}

main().catch(console.error);
