---
title: "PR #2 Content Architecture: insightAnswer Display, Sprint Duplication & Pipeline Fixes"
category: logic-errors
tags:
  - prisma
  - react
  - ai-pipeline
  - content-generation
  - database-constraints
  - zod-validation
  - rate-limiting
  - dead-code
module:
  - components/interactions/SprintRunner.tsx
  - prisma/schema.prisma
  - prisma/seed.ts
  - scripts/generate-content.ts
  - lib/validation/content-schema.ts
  - app/api/evaluate/route.ts
symptom: |
  1. After completing a sprint question, insight feedback displayed raw option IDs ("a", "b") instead of readable text.
  2. Running `prisma db seed` multiple times created duplicate sprint records.
  3. COMPETE mode interactions indexed 0-7 while LEARN/PRACTICE indexed 1-8.
  4. Zod schemas duplicated across 3 files with drift risk.
  5. /api/evaluate endpoint had no rate limiting on expensive Claude AI calls.
  6. Replaced components never deleted (197 lines dead code).
root_cause: |
  1. AI pipeline generated `insightAnswer` as option IDs referencing the options array. SprintRunner.tsx rendered these raw without resolving to text.
  2. Sprint model lacked `@@unique([skillId, title, mode])` constraint. Seed used `findFirst+create` which always created new records.
  3. COMPETE seed loop used `order: idx` (0-based) while LEARN/PRACTICE used `order: idx + 1` (1-based).
  4. Schemas copy-pasted into seed.ts, generate-content.ts, and content-schema.ts with no single source of truth.
  5. evaluate route had no rate limit check — unlike sprint generation which had 5/hour.
  6. SkillSprintBrowser.tsx and SprintList.tsx replaced by SkillAccordion but not deleted.
date_resolved: "2026-02-12"
commit_sha: "cb3809d1"
pr_number: 2
severity: P1
---

# PR #2 Content Architecture Logic Fixes

## Problem Statement

During code review of PR #2 (Structured Content Architecture with Topic hierarchy & AI pipeline), 19 findings were identified across 7 parallel review agents. Six critical issues were fixed before merge, spanning the content generation pipeline, database schema, UI display, and API security.

The dominant theme: logic errors in the content architecture caused cascading failures across database operations, UI display, and API safety.

## Solution

### 1. insightAnswer UX Bug — Raw Option IDs Displayed Instead of Text (P1)

**Symptom:** After answering a sprint question, the insight/feedback showed raw option IDs like "a" or "b,c" instead of readable text like "Focus on retention metrics".

**Root Cause:** The AI content pipeline (`scripts/generate-content.ts`) generated `insightAnswer` values as option IDs (e.g., "a") referencing the interaction's options array. `SprintRunner.tsx` displayed these raw without resolution.

**Fix in `components/interactions/SprintRunner.tsx`:**

```typescript
const resolvedInsight = useMemo(() => {
  const raw = currentInteraction.insightAnswer;
  if (!raw) return null;
  // Single option ID like "a" for multiple choice
  if (/^[a-d]$/.test(raw)) {
    const match = options.find((o) => o.id === raw);
    return match ? match.text : raw;
  }
  // Comma-separated IDs like "a,b,c" for RANK_AND_PRIORITIZE
  if (/^[a-d](,[a-d]){1,}$/.test(raw)) {
    return raw.split(",").map((id) => {
      const match = options.find((o) => o.id === id.trim());
      return match ? match.text : id;
    }).join(" → ");
  }
  // Free-text insights pass through unchanged
  return raw;
}, [currentInteraction.insightAnswer, options]);
```

### 2. Duplicate Sprint Creation on Re-seed (P1)

**Symptom:** Running `prisma db seed` multiple times created duplicate sprints, polluting the database.

**Root Cause:** No uniqueness constraint on Sprint model. Seed used `findFirst + create` which always created new records.

**Fix — three changes:**

1. Added `@@unique([skillId, title, mode])` to Sprint model in `prisma/schema.prisma`
2. Created migration `20260212140000_add_sprint_unique_constraint`:
   ```sql
   CREATE UNIQUE INDEX "Sprint_skillId_title_mode_key" ON "Sprint"("skillId", "title", "mode");
   ```
3. Changed seed.ts from `findFirst+create` to `upsert`:
   ```typescript
   const sprint = await prisma.sprint.upsert({
     where: { skillId_title_mode: { skillId, title: sprintData.title, mode: sprintData.mode } },
     update: { topicId, description, difficulty, order },
     create: { ...sprintPayload, interactions: { create: interactions } },
   });
   ```

**Gotcha:** `prisma migrate dev` failed in non-interactive Railway environment. Had to manually create the migration SQL file in `prisma/migrations/`.

### 3. COMPETE Sprint 0-Indexed Ordering

**Symptom:** COMPETE interactions ordered 0-7 while LEARN/PRACTICE were 1-8, causing UI inconsistency.

**Fix in `prisma/seed.ts`:** Changed `order: idx` to `order: idx + 1` in the COMPETE sprint seeding loop.

### 4. Zod Schema Duplication

**Symptom:** Same Zod schemas (~110 lines total) copy-pasted across 3 files. Changes wouldn't propagate.

**Fix:** Created canonical `lib/validation/content-schema.ts` with exported schemas. Replaced inline schemas in:
- `prisma/seed.ts` — removed ~45 lines, replaced with import
- `scripts/generate-content.ts` — removed ~65 lines, replaced with import

```typescript
import {
  sprintFileSchema,
  topicsFileSchema,
  type SprintFile,
} from "../lib/validation/content-schema";
```

### 5. Missing Rate Limiting on Evaluate Endpoint

**Symptom:** `/api/evaluate` had no rate limiting despite calling expensive Claude Sonnet AI for evaluation.

**Fix in `app/api/evaluate/route.ts`:**

```typescript
const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
const recentEvals = await prisma.sprintAttempt.count({
  where: { userId: user.id, completedAt: { gte: oneHourAgo } },
});
if (recentEvals >= EVALUATION_RATE_LIMIT) {
  return NextResponse.json(
    { error: "Rate limit exceeded. Please try again later.", retryAfter: 3600 },
    { status: 429 }
  );
}
```

Added `EVALUATION_RATE_LIMIT = 30` to `lib/utils/constants.ts`.

### 6. Dead Code Removal

**Symptom:** `SkillSprintBrowser.tsx` (108 lines) and `SprintList.tsx` (89 lines) replaced by SkillAccordion but never deleted.

**Fix:** Verified no imports reference them, then deleted both files. Net removal: 197 lines.

## Files Modified

| File | Change |
|------|--------|
| `components/interactions/SprintRunner.tsx` | Added `resolvedInsight` useMemo |
| `prisma/schema.prisma` | Added `@@unique([skillId, title, mode])` |
| `prisma/migrations/20260212140000_.../migration.sql` | Unique index SQL |
| `prisma/seed.ts` | Upsert pattern, 1-indexed COMPETE, import canonical schemas |
| `scripts/generate-content.ts` | Import canonical schemas, remove inline |
| `lib/validation/content-schema.ts` | Created as canonical schema source |
| `app/api/evaluate/route.ts` | Added rate limiting |
| `lib/utils/constants.ts` | Added `EVALUATION_RATE_LIMIT` |
| `components/layout/SkillSprintBrowser.tsx` | Deleted |
| `components/layout/SprintList.tsx` | Deleted |

**Net change:** +87 / -360 lines (273 lines removed)

## Prevention Strategies

### AI-Generated Content Validation

The insightAnswer bug reveals that AI output needs both structural validation (Zod) and semantic validation:

- **Schema-level:** Add Zod refinement to reject single-character insightAnswer values:
  ```typescript
  insightAnswer: z.string().min(20).refine(
    (val) => !/^[a-d]$/.test(val.trim()),
    "insightAnswer must be explanatory text, not an option ID"
  )
  ```
- **Prompt-level:** Add explicit instruction to AI: "insightAnswer should be a 2-3 sentence explanation, NOT an option letter."
- **Runtime:** The `resolvedInsight` useMemo handles legacy data gracefully — regex detects ID patterns and maps to text.

### Constraints-First Database Design

The duplicate sprint bug shows that uniqueness should be enforced at the database level before relying on application logic:

- Define `@@unique` constraints in Prisma schema BEFORE writing seed/migration code
- Always use `upsert()` for seed scripts to make them idempotent
- Test idempotency: `seed() && seed()` should produce identical results

### Consistent Indexing Convention

All sprint interactions across all modes should use 1-indexed ordering. Document this in CLAUDE.md.

### Single Source of Truth for Schemas

When validation schemas are needed in multiple files, create one canonical export and import it everywhere. The canonical location for Praxel Arena content schemas is `lib/validation/content-schema.ts`.

### Rate Limiting Expensive Endpoints

Any endpoint that calls external AI APIs should have rate limiting. Pattern: count recent operations per user, return 429 with `retryAfter` if exceeded. Constants in `lib/utils/constants.ts`.

## Related Documentation

### Existing Solutions
- `docs/solutions/2026-02-12-build-review-omnibus-fixes.md` — PR #1 omnibus (10 fixes)
- `docs/solutions/runtime-errors/evaluation-500-nan-propagation-and-data-fixes.md` — NaN propagation in evaluation scoring
- `docs/solutions/security-issues/pr1-answer-leak-and-race-conditions.md` — PR #1 answer leak and race conditions

### Plans
- `docs/plans/2026-02-12-feat-structured-content-architecture-plan.md` — The plan this PR implemented
- `docs/plans/2026-02-12-fix-evaluation-500-and-ux-overhaul-plan.md` — Evaluation 500 fix plan

### Todos
- `todos/002-pending-p1-zod-schema-triple-duplication.md` — Schema dedup (resolved by this fix)
- `todos/003-pending-p2-insight-answer-semantic-mismatch.md` — insightAnswer UX (resolved by this fix)
- `todos/005-pending-p2-compete-sprint-zero-indexed.md` — COMPETE ordering (resolved by this fix)
- `todos/008-pending-p2-missing-rate-limit-evaluate.md` — Rate limiting (resolved by this fix)

### GitHub
- PR: https://github.com/poojitha-rachuri/praxel-arena/pull/2
- Commit: https://github.com/poojitha-rachuri/praxel-arena/commit/cb3809d1
