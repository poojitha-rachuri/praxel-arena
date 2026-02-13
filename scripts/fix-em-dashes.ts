/**
 * One-time script to replace em dashes (—) and en dashes (–) with spaced hyphens ( - )
 * across all seed data JSON files.
 *
 * Usage: npx tsx scripts/fix-em-dashes.ts
 */

import fs from "fs";
import path from "path";

const SEED_DIR = path.resolve(__dirname, "../prisma/seed-data");

function findJsonFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findJsonFiles(fullPath));
    } else if (entry.name.endsWith(".json")) {
      results.push(fullPath);
    }
  }
  return results;
}

let totalReplacements = 0;
let filesModified = 0;

const jsonFiles = findJsonFiles(SEED_DIR);
console.log(`Found ${jsonFiles.length} JSON files in ${SEED_DIR}`);

for (const filePath of jsonFiles) {
  const content = fs.readFileSync(filePath, "utf-8");
  const cleaned = content.replace(/—/g, " - ").replace(/–/g, " - ");

  if (cleaned !== content) {
    const emCount = (content.match(/—/g) || []).length;
    const enCount = (content.match(/–/g) || []).length;
    totalReplacements += emCount + enCount;
    filesModified++;
    fs.writeFileSync(filePath, cleaned, "utf-8");
    console.log(
      `  Fixed ${filePath.replace(SEED_DIR + "/", "")}: ${emCount} em + ${enCount} en dashes`
    );
  }
}

console.log(
  `\nDone. Replaced ${totalReplacements} dashes across ${filesModified} files.`
);
