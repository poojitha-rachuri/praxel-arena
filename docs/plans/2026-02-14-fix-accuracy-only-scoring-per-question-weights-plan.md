---
title: "fix: Accuracy-only scoring with per-question dimension weights"
type: fix
date: 2026-02-14
---

# fix: Accuracy-only scoring with per-question dimension weights

## Overview

Three changes:
1. **Remove time-based scoring** -- score purely on accuracy (correct/incorrect + partial credit)
2. **Per-question dimension weights** -- each interaction defines its own dimension weight distribution (e.g., 80% analytical + 20% strategic) instead of a fixed 70/30 split
3. **Update ScoringExplainer** -- reflect the new accuracy-only model and variable weights in the UI

## Problem Statement

- Scoring currently awards +8-15 time bonus and -10 time penalty in COMPETE mode. User wants accuracy-only.
- The 70/30 primary/secondary dimension split is hardcoded. User wants each question to independently define how much it impacts each dimension.
- The ScoringExplainer card shows time bonus/penalty rules that will no longer apply.
- Per-skill dimension overrides exist (9 skills) but are limited to choosing which 2 dimensions -- not how much weight each gets.

## Proposed Solution

### Phase 1: Remove time-based scoring

**Files:** `lib/scoring/evaluate.ts`, `components/results/ScoringExplainer.tsx`

#### `lib/scoring/evaluate.ts`

- [ ] `scoreInteractionDeterministic()` (lines 156-203): Remove the `isTimedMode` logic (lines 188-197). Correct answer = 100 points. Incorrect = 0 (or partial credit for CURVEBALL/FORCED_TRADEOFF/RANK_AND_PRIORITIZE).
- [ ] `scoreRanking()` (lines 209-252): Remove time bonus (lines 242-243). Perfect ranking = 100, partial = proportional. Remove `isTimedMode` param.
- [ ] `buildDeterministicFeedback()` (lines 311-348): Remove `timeEfficiency` references from feedback strings. Keep accuracy-only messaging.
- [ ] Remove `mode` parameter from `scoreInteractionDeterministic()` since time bonus was the only mode-dependent behavior.
- [ ] Remove `isTimedMode` variable and all references.

New scoring table:

| Outcome | Score |
|---------|-------|
| Correct answer | 100 |
| Correct ranking (all positions) | 100 |
| Partial ranking (proportional) | `(correctPositions / total) * 100` |
| Incorrect CURVEBALL or FORCED_TRADEOFF | 15 (partial credit) |
| Incorrect other types | 0 |

#### `components/results/ScoringExplainer.tsx`

- [ ] Remove the "+8-15 time bonus" row (lines 172-176)
- [ ] Remove the "-10 time penalty" row (lines 177-182)
- [ ] Update the "+75 base score" to "+100 correct answer" (line 168-170)
- [ ] Keep partial credit row (+15 for Curveball/Forced Tradeoff)
- [ ] Keep ranking proportional credit row
- [ ] Update COMPETE mode section to remove time-based language

---

### Phase 2: Per-question dimension weights

**Files:** `prisma/schema.prisma`, `lib/scoring/evaluate.ts`, `prisma/seed-data/**/*.json`, content generation skills

#### Schema change: `prisma/schema.prisma`

- [ ] Add `dimensionWeights` field to Interaction model:

```prisma
model Interaction {
  // ... existing fields ...
  dimensionWeights Json?  // e.g., { "analyticalThinking": 0.8, "strategicReasoning": 0.2 }
}
```

This is a `Json?` field (nullable) so existing interactions without weights fall back to the current type-based mapping. The JSON object maps dimension keys to float weights that sum to 1.0.

#### Scoring logic: `lib/scoring/evaluate.ts`

- [ ] Update `distributeToDimensions()` (lines 258-306) to check for `interaction.dimensionWeights` first:

```typescript
for (const interaction of interactions) {
  const response = responses.find(r => r.interactionId === interaction.id);
  const { score } = scoreInteractionDeterministic(interaction, response);

  if (interaction.dimensionWeights) {
    // Per-question weights: distribute score across all specified dimensions
    const weights = interaction.dimensionWeights as Record<DimensionKey, number>;
    for (const [dim, weight] of Object.entries(weights)) {
      dimensionTotals[dim as DimensionKey] += score * weight;
      dimensionCounts[dim as DimensionKey] += weight;
    }
  } else {
    // Fallback: use type-based mapping with skill overrides (existing logic)
    const mapping = getDimensionMapping(interaction.type, skillSlug);
    dimensionTotals[mapping.primary] += score * 0.7;
    dimensionCounts[mapping.primary] += 0.7;
    dimensionTotals[mapping.secondary] += score * 0.3;
    dimensionCounts[mapping.secondary] += 0.3;
  }
}
```

- [ ] Keep `SKILL_DIMENSION_OVERRIDES` and `getDimensionMapping()` as fallback for interactions without `dimensionWeights`
- [ ] Add Zod validation for `dimensionWeights` shape (keys must be valid DimensionKeys, values must sum to ~1.0)

#### Seed data: `prisma/seed-data/**/*.json`

- [ ] Add `dimensionWeights` to each interaction in all 72 sprint JSON files (576 interactions total)
- [ ] Weights should be contextually appropriate per question content, not just per type
- [ ] Example for a data-interpretation SPOT_THE_SIGNAL question about revenue trends:
  ```json
  {
    "dimensionWeights": {
      "quantitativeReasoning": 0.6,
      "analyticalThinking": 0.3,
      "decisionQuality": 0.1
    }
  }
  ```
- [ ] Weights can span more than 2 dimensions (e.g., a complex curveball could touch 3-4 dimensions)
- [ ] All weights must sum to 1.0

#### Content generation skills: `.claude/skills/`

- [ ] Update the 6 SKILL.md content generation skill files to include `dimensionWeights` in their output schema
- [ ] Add guidance for weight assignment based on question content

---

### Phase 3: Update ScoringExplainer for variable weights

**File:** `components/results/ScoringExplainer.tsx`

- [ ] Replace the fixed "Primary (70%) / Secondary (30%)" table with updated copy explaining that each question has its own dimension weight distribution
- [ ] Keep the 6 dimension definitions section (unchanged)
- [ ] Update the "Question Type Mapping" section to say something like: "Each question contributes to multiple skill dimensions with custom weights based on what the question tests. The weights vary per question."
- [ ] Optionally: remove the static mapping table entirely since it's no longer accurate with per-question weights

---

## Migration

- [ ] Create Prisma migration: `npx prisma migrate dev --name add-interaction-dimension-weights`
- [ ] The field is nullable, so no data migration needed -- existing interactions work via fallback
- [ ] Re-seed database: `npx prisma db seed`

## Acceptance Criteria

- [ ] No time bonus or penalty in any mode (LEARN, PRACTICE, COMPETE)
- [ ] Correct answers score 100, incorrect score 0 (with partial credit exceptions)
- [ ] Each interaction in seed data has `dimensionWeights` field
- [ ] `distributeToDimensions()` uses per-question weights when available
- [ ] ScoringExplainer shows accuracy-only rules (no time references)
- [ ] ScoringExplainer explains variable dimension weights
- [ ] Existing behavior preserved for interactions without `dimensionWeights` (fallback to type-based mapping)
- [ ] `npm run build` passes with no errors

## Effort Estimate

- Phase 1 (remove time scoring + update explainer): Small (~30 min)
- Phase 2 (schema + scoring logic + seed data): Medium (~1-2 hrs, bulk is seed data updates)
- Phase 3 (explainer UI for variable weights): Small (~15 min)

## References

- Scoring engine: `lib/scoring/evaluate.ts`
- Scoring explainer: `components/results/ScoringExplainer.tsx`
- Dimensions: `lib/scoring/dimensions.ts`
- Evaluate API: `app/api/evaluate/route.ts`
- Schema: `prisma/schema.prisma` (Interaction model, lines 178-198)
- Seed data: `prisma/seed-data/` (72 JSON files)
- Content skills: `.claude/skills/`
