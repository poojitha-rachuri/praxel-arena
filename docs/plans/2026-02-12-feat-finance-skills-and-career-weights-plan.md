---
title: "feat: Add Finance Skills & Differentiated Career Weights"
type: feat
date: 2026-02-12
brainstorm: docs/brainstorms/2026-02-12-finance-skills-and-career-weights-brainstorm.md
---

# Add Finance Skills & Differentiated Career Weights

## Overview

Add 2 new finance skills (Financial Statement Analysis, Valuation) with full AI-generated content, and fix the career-skill weighting system so that career match scores reflect real-world skill importance rather than flat 1.0 weights.

## Problem Statement

1. **Only 6 skills** — no dedicated finance content despite targeting business professionals. Balance sheet literacy and valuation are foundational to consulting, founder, and biz ops careers.
2. **All career-skill weights are 1.0** — the `SkillCareerMap.weight` field exists but is never used. A PM strong in Stakeholder Communication but weak in Prioritization shows the same career match as the reverse. This makes career match scores meaningless.

## Proposed Solution

### Phase 1: Fix Seed Infrastructure (weight support)

Restructure `prisma/seed.ts` so the SKILLS array carries per-career weights and the upsert actually updates them.

### Phase 2: Add 2 Finance Skills (content pipeline)

Create SKILL.md files, register skills, define topics, generate content via AI pipeline, and seed the database.

### Phase 3: Update SkillIcon (visual identity)

Add entries to the hardcoded `SkillIcon` component for the 2 new skills.

---

## Technical Approach

### Phase 1: Seed Infrastructure — Differentiated Weights

**File: `prisma/seed.ts`**

**1a. Restructure SKILLS array** (lines 24-93)

Change from:
```typescript
careers: ["consulting", "product-management", "founder"],
```

To:
```typescript
careers: [
  { slug: "consulting", weight: 1.0 },
  { slug: "product-management", weight: 0.3 },
  { slug: "founder", weight: 0.8 },
],
```

Apply the full weight matrix from the brainstorm:

| Skill | PM | Consulting | Marketing | Founder | Growth | Sales Strategy | Biz Ops |
|---|---|---|---|---|---|---|---|
| Guesstimation | 0.3 | **1.0** | — | 0.8 | — | — | — |
| GTM Strategy | 0.6 | — | **1.0** | **0.9** | 0.7 | 0.5 | — |
| Pricing & Monetization | 0.5 | 0.6 | 0.4 | 0.8 | 0.5 | **1.0** | — |
| Data Interpretation | 0.8 | 0.8 | 0.5 | 0.5 | **1.0** | — | **1.0** |
| Prioritization | **1.0** | 0.7 | — | 0.7 | — | — | 0.8 |
| Stakeholder Communication | 0.7 | 0.8 | 0.7 | 0.5 | — | 0.8 | 0.4 |
| Financial Statement Analysis | 0.3 | 0.7 | — | 0.7 | 0.3 | 0.4 | 0.6 |
| Valuation | 0.2 | 0.6 | — | 0.6 | — | 0.3 | — |

**1b. Fix upsert to actually update weights** (lines 390-407)

Change from:
```typescript
update: {},
create: {
  skillId: record.id,
  careerOutcomeId,
  weight: 1.0,
},
```

To:
```typescript
update: { weight },
create: {
  skillId: record.id,
  careerOutcomeId,
  weight,
},
```

Where `weight` comes from the restructured careers array.

**1c. Update TypeScript type** for the SKILLS array entries to reflect the new `careers` shape:
```typescript
type SkillSeed = {
  name: string;
  slug: string;
  description: string;
  icon: string;
  careers: { slug: string; weight: number }[];
};
```

---

### Phase 2: Add 2 Finance Skills

#### Step 2a: Create SKILL.md Files

**File: `.claude/skills/financial-statement-analysis-master/SKILL.md`**

Follow the exact template from existing SKILL.md files (e.g., `guesstimation-master/SKILL.md`). Include:
- Expert persona: "Senior Financial Analyst / CFO advisor"
- Domain expertise: Balance sheets, income statements, cash flow, ratio analysis, working capital, EBITDA
- All 6 interaction type JSON examples
- Scoring dimension weights (primary: quantitativeReasoning 0.30, analyticalThinking 0.25)
- LEARN sprint plan table (8 sprints across 4 topics)
- Quality rules emphasizing real company scenarios (e.g., use realistic financial figures)

**File: `.claude/skills/valuation-master/SKILL.md`**

- Expert persona: "Investment Banking / PE / VC valuation specialist"
- Domain expertise: DCF, WACC, terminal value, trading comps, M&A precedents, startup valuation
- Scoring dimension weights (primary: quantitativeReasoning 0.30, strategicReasoning 0.25)
- Quality rules emphasizing real valuation scenarios with actual market multiples

#### Step 2b: Register Skills in Content Pipeline

**File: `scripts/generate-content.ts`** (lines 39-76)

Add 2 entries to the `SKILLS` record:

```typescript
"financial-statement-analysis": {
  slug: "financial-statement-analysis",
  name: "Financial Statement Analysis",
  description: "Reading balance sheets, income statements, cash flow; ratios, working capital, profitability analysis",
},
valuation: {
  slug: "valuation",
  name: "Valuation",
  description: "DCF, comparable company analysis, precedent transactions, startup valuation methods",
},
```

#### Step 2c: Add Topics to topics.json

**File: `prisma/seed-data/topics.json`**

Add 8 entries (4 per skill):

```json
{ "skillSlug": "financial-statement-analysis", "slug": "balance-sheet-fundamentals", "name": "Balance Sheet Fundamentals", "description": "Assets, liabilities, equity, working capital, liquidity analysis", "order": 1, "icon": "📊" },
{ "skillSlug": "financial-statement-analysis", "slug": "income-statement-profitability", "name": "Income Statement & Profitability", "description": "Revenue recognition, gross/operating margins, EBITDA, earnings quality", "order": 2, "icon": "📈" },
{ "skillSlug": "financial-statement-analysis", "slug": "cash-flow-analysis", "name": "Cash Flow Analysis", "description": "Operating/investing/financing activities, free cash flow, burn rate analysis", "order": 3, "icon": "💸" },
{ "skillSlug": "financial-statement-analysis", "slug": "financial-ratio-analysis", "name": "Financial Ratio Analysis", "description": "Liquidity, solvency, efficiency, and profitability ratios for decision-making", "order": 4, "icon": "🔢" },
{ "skillSlug": "valuation", "slug": "dcf-intrinsic-valuation", "name": "DCF & Intrinsic Valuation", "description": "Discount rates, terminal value, WACC, sensitivity analysis", "order": 1, "icon": "🧮" },
{ "skillSlug": "valuation", "slug": "comparable-company-analysis", "name": "Comparable Company Analysis", "description": "Trading multiples, peer selection, benchmarking, relative valuation", "order": 2, "icon": "⚖️" },
{ "skillSlug": "valuation", "slug": "precedent-transactions", "name": "Precedent Transactions", "description": "M&A comps, control premiums, synergy analysis, transaction multiples", "order": 3, "icon": "🤝" },
{ "skillSlug": "valuation", "slug": "startup-growth-valuation", "name": "Startup & Growth Valuation", "description": "VC methods, revenue multiples, TAM-based sizing, pre/post-money mechanics", "order": 4, "icon": "🚀" }
```

#### Step 2d: Add Skills to seed.ts SKILLS Array

**File: `prisma/seed.ts`**

```typescript
{
  name: "Financial Statement Analysis",
  slug: "financial-statement-analysis",
  description: "Reading balance sheets, income statements, cash flow; ratios, working capital, profitability analysis",
  icon: "📑",
  careers: [
    { slug: "product-management", weight: 0.3 },
    { slug: "consulting", weight: 0.7 },
    { slug: "founder", weight: 0.7 },
    { slug: "growth", weight: 0.3 },
    { slug: "sales-strategy", weight: 0.4 },
    { slug: "business-operations", weight: 0.6 },
  ],
},
{
  name: "Valuation",
  slug: "valuation",
  description: "DCF, comparable company analysis, precedent transactions, startup valuation methods",
  icon: "🏦",
  careers: [
    { slug: "product-management", weight: 0.2 },
    { slug: "consulting", weight: 0.6 },
    { slug: "founder", weight: 0.6 },
    { slug: "sales-strategy", weight: 0.3 },
  ],
},
```

#### Step 2e: Generate Content

```bash
# Dry run first to validate topic slug matching
npx tsx scripts/generate-content.ts --skill financial-statement-analysis --all --dry-run
npx tsx scripts/generate-content.ts --skill valuation --all --dry-run

# Generate content (24 API calls total, ~$5-15 cost)
npx tsx scripts/generate-content.ts --skill financial-statement-analysis --all
npx tsx scripts/generate-content.ts --skill valuation --all
```

Output: 24 JSON files in `prisma/seed-data/financial-statement-analysis/` and `prisma/seed-data/valuation/`.

#### Step 2f: Re-seed Database

```bash
npx prisma db seed
```

This seeds: 2 new skills, 8 new topics, 24 new sprints, 192 new interactions, AND updates all existing `SkillCareerMap` weights.

---

### Phase 3: Update SkillIcon

**File: `components/ui/SkillIcon.tsx`** (lines 12-18)

The `SKILL_ICON_MAP` is hardcoded for 6 skills. Add 2 entries:

```typescript
"financial-statement-analysis": { icon: FileSpreadsheet, color: "text-teal-500", bg: "bg-teal-500/10" },
"valuation": { icon: Landmark, color: "text-indigo-500", bg: "bg-indigo-500/10" },
```

Import `FileSpreadsheet` and `Landmark` from `lucide-react`.

---

## Decisions & Known Limitations

### Guesstimation/Valuation Topic Overlap

The existing "Valuation & Investment Cases" topic under Guesstimation overlaps with the new Valuation skill. **Decision: Leave as-is for now.** The Guesstimation version is an estimation/Fermi angle ("how big is this company worth?"), while the new Valuation skill teaches formal methodology (DCF, comps, precedents). Different pedagogical purpose. Can rename later if user confusion arises.

### No COMPETE Fallback for Finance Skills

No pre-cached COMPETE sprints for the 2 new skills. If Claude API fails during a Compete match on a finance skill, the user gets an error. **For the hackathon demo, only demo COMPETE with Guesstimation** (which has a pre-cached duel). Document as known limitation.

### Career Match Score Shift

Existing users will see their career match scores change when weights go from 1.0 to differentiated values. **This is accepted** — the old flat-weighted scores were inaccurate. No user notification needed.

---

## Acceptance Criteria

- [x] `prisma/seed.ts` — SKILLS array uses `{ slug, weight }` career objects (not bare strings)
- [x] `prisma/seed.ts` — Upsert updates weight on existing `SkillCareerMap` records
- [x] `prisma/seed.ts` — All 8 skills have correct career mappings per weight matrix
- [x] `prisma/seed-data/topics.json` — 32 topics total (24 existing + 8 new)
- [x] `.claude/skills/financial-statement-analysis-master/SKILL.md` — Created, follows template
- [x] `.claude/skills/valuation-master/SKILL.md` — Created, follows template
- [x] `scripts/generate-content.ts` — 2 new SKILLS entries registered
- [x] `prisma/seed-data/financial-statement-analysis/` — 12 JSON files (4 topics x 3 sprints)
- [x] `prisma/seed-data/valuation/` — 12 JSON files (4 topics x 3 sprints)
- [x] `components/ui/SkillIcon.tsx` — 2 new icon entries render correctly
- [x] `npx prisma db seed` runs without errors
- [ ] Learn mode shows 8 skills with topics and sprints
- [ ] Practice mode shows 8 skills with sprints
- [ ] Onboarding shows correct skills per career (Founder now has 8)
- [ ] Profile career match scores use differentiated weights
- [x] Content validates against Zod schema in `lib/validation/content-schema.ts`

## File Change Summary

| File | Action | Lines Changed (est.) |
|---|---|---|
| `prisma/seed.ts` | Edit SKILLS array + upsert logic | ~80 |
| `prisma/seed-data/topics.json` | Add 8 topic entries | ~40 |
| `scripts/generate-content.ts` | Add 2 SKILLS entries | ~12 |
| `.claude/skills/financial-statement-analysis-master/SKILL.md` | New file | ~250 |
| `.claude/skills/valuation-master/SKILL.md` | New file | ~250 |
| `components/ui/SkillIcon.tsx` | Add 2 icon entries + imports | ~4 |
| `prisma/seed-data/financial-statement-analysis/**/*.json` | 12 new files (AI-generated) | ~12 files |
| `prisma/seed-data/valuation/**/*.json` | 12 new files (AI-generated) | ~12 files |

## References

- Brainstorm: `docs/brainstorms/2026-02-12-finance-skills-and-career-weights-brainstorm.md`
- Content schema: `lib/validation/content-schema.ts`
- Career match utility: `lib/scoring/career-match.ts`
- Content pipeline: `scripts/generate-content.ts`
- Existing SKILL.md template: `.claude/skills/guesstimation-master/SKILL.md`
- Topic slug gotcha: `docs/solutions/logic-errors/pr2-content-architecture-logic-fixes.md`
- NaN guard patterns: `docs/solutions/runtime-errors/evaluation-500-nan-propagation-and-data-fixes.md`
