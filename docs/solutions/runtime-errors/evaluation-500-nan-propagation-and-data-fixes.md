---
title: "Evaluation 500 Error: NaN Propagation, Answer Leak, Prisma Caching, NULL Ordering"
category: runtime-errors
tags:
  - next.js-16
  - prisma-7
  - api-routes
  - data-integrity
  - database-connections
  - ai-evaluation
  - security
  - postgres
  - production-incident
modules:
  - app/api/evaluate
  - app/api/sprints/generate
  - app/api/sprints
  - lib/db.ts
  - lib/scoring
  - lib/data/mode-page-data.ts
symptoms:
  - "POST /api/evaluate returns 500 'Failed to evaluate sprint'"
  - "POST /api/sprints/generate leaks correctAnswer to client"
  - "Prisma P2028 'Transaction not found' errors in production on Railway"
  - "Completed sprints appear incomplete in UI"
  - "UserSkillScore running averages poisoned by NaN values"
root_causes:
  - "AI evaluation responses contained NaN/Infinity values without validation"
  - "Sprint generation returned full interaction objects including answer fields"
  - "PrismaClient only cached in development; production created new client per request"
  - "PostgreSQL NULLS FIRST in DESC order caused null-scored attempts to shadow completed ones"
date: 2026-02-12
severity: critical
environment:
  - production (Railway)
  - development (local)
commits:
  - "6ca352f: fix: evaluation 500 + answer leak + theme toggle + skill accordion"
  - "b65747d: fix: cache Prisma client in production to prevent P2028 transaction errors"
---

# Evaluation 500 Error: Multi-Fix Session

## Problem Statement

Users reported a 500 error when completing sprints: "Failed to evaluate sprint." Investigation revealed four interconnected issues:

1. **NaN propagation** from AI evaluation responses poisoned database scores
2. **Answer leak** in sprint generation exposed `correctAnswer` to clients
3. **Prisma client not cached** in production caused P2028 transaction timeouts
4. **NULL ordering bug** in distinct query hid completed sprints from the UI

## Investigation Timeline

1. User reported 500 on `/api/evaluate` endpoint
2. Traced to NaN values entering Prisma JSON fields from AI scoring
3. During review, discovered `correctAnswer` leaking in `/api/sprints/generate`
4. Production logs showed P2028 "Transaction not found" errors
5. Traced P2028 to `lib/db.ts` only caching PrismaClient in dev mode
6. Data integrity review found `distinct` + `orderBy DESC` selecting null-scored attempts

---

## Solution 1: NaN Guard Chain

### Problem
`evaluateAttempt()` calls Claude Sonnet which returns JSON scores. If any dimension score is NaN, Infinity, or non-numeric, it gets written to the `scores` JSON column and then used in `UserSkillScore` running average calculations. A single NaN poisons all subsequent calculations permanently (`NaN * anything = NaN`).

### Root Cause
- `response.timeSpent` could be a string, undefined, or non-finite
- `interaction.timeTarget` could be 0 (causing division by zero)
- No validation between AI response parsing and database write

### Fix
Three-layer guard chain in `app/api/evaluate/route.ts` and `lib/scoring/evaluate.ts`:

**Layer 1 -- Input validation (route handler):**
```typescript
for (const r of responses) {
  if (typeof r.answer !== "string") {
    return NextResponse.json(
      { error: "Each response must have a string 'answer'" },
      { status: 400 }
    );
  }
  r.timeSpent = Number(r.timeSpent) || 0;
}
```

**Layer 2 -- Scoring function guards:**
```typescript
const timeSpent = Number(response.timeSpent) || 0;
const timeTarget = Number(interaction.timeTarget) || 10;
```

**Layer 3 -- Pre-database clamping:**
```typescript
for (const key of DIMENSION_KEYS) {
  const val = evaluation.scores[key];
  if (typeof val !== "number" || !Number.isFinite(val)) {
    evaluation.scores[key] = 0;
  }
}
evaluation.totalScore = Math.round(
  DIMENSION_KEYS.reduce((sum, key) => sum + evaluation.scores[key], 0) /
    DIMENSION_KEYS.length
);
```

**Error correlation IDs** for debugging:
```typescript
const errorId = crypto.randomUUID();
console.error(`[${errorId}] Failed to evaluate sprint:`, {
  error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
  sprintId,
  responseCount: responses?.length,
});
return NextResponse.json({ error: "Failed to evaluate sprint", errorId }, { status: 500 });
```

### Key Insight
Use `Number.isFinite()` instead of `isNaN()` -- it catches both NaN AND Infinity. The guard chain validates at entry (route), protects during computation (scoring), and clamps before persistence (database).

---

## Solution 2: Answer Leak Fix

### Problem
`POST /api/sprints/generate` returned full sprint objects including `correctAnswer` and `insightAnswer` fields. Players using browser dev tools could read answers before playing, destroying competitive integrity.

### Root Cause
Both success path (`return NextResponse.json({ sprint, generated: true })`) and fallback path used Prisma `include: { interactions }` which fetched all fields.

### Fix
Strip sensitive fields using destructuring rest pattern in `app/api/sprints/generate/route.ts`:

```typescript
const sanitizedSprint = {
  ...sprint,
  interactions: sprint.interactions.map(
    ({ correctAnswer, insightAnswer, ...rest }) => rest
  ),
};
return NextResponse.json({ sprint: sanitizedSprint, generated: true });
```

Also fixed `GET /api/sprints` by switching from `include` to `select` + `_count`:
```typescript
select: {
  id: true, title: true, description: true, difficulty: true,
  level: true, levelLabel: true, order: true,
  _count: { select: { interactions: true } },
},
```

### Key Insight
Never use Prisma `include` for client-facing responses. Always use `select` to whitelist fields, or strip with destructuring. The `select` approach is safer because it prevents accidental exposure if new fields are added to the model.

---

## Solution 3: Prisma Client Caching

### Problem
Production Railway deployment showed repeated P2028 errors: "Transaction not found. Transaction ID is invalid, refers to an old closed transaction."

### Root Cause
`lib/db.ts` had this conditional caching:
```typescript
// BROKEN: Only caches in development
if (process.env.NODE_ENV !== "production") {
  globalForPrisma._prisma = client;
}
```

Every production request created a new `PrismaClient` with a new connection pool, exhausting database connections. Transactions started on one connection would expire before they could complete because the pool was saturated.

### Fix
Remove the environment conditional -- always cache:
```typescript
globalForPrisma._prisma = client;
```

### Key Insight
The standard Next.js Prisma singleton pattern uses `globalThis` to survive Hot Module Replacement in dev. But the client should be cached in production too -- there's no HMR in production, and without caching you get connection pool exhaustion. The `globalThis` cache is needed in BOTH environments for different reasons.

---

## Solution 4: Distinct Query NULL Ordering

### Problem
Completed sprints sometimes appeared as "not completed" in the Learn/Practice UI, despite the user having a scored attempt.

### Root Cause
The query in `lib/data/mode-page-data.ts` used:
```typescript
prisma.sprintAttempt.findMany({
  where: { userId, mode },
  distinct: ["sprintId"],
  orderBy: { totalScore: "desc" },
})
```

PostgreSQL sorts NULL as the largest value in `DESC` order by default (`NULLS FIRST`). If a user had both a completed attempt (score 85) and an incomplete attempt (score null) for the same sprint, the `distinct` query selected the null-scored attempt, and the downstream `if (a.totalScore !== null)` check excluded it from the completion map.

### Fix
Filter to only completed attempts:
```typescript
where: { userId, mode, completedAt: { not: null } },
```

Also added `import "server-only"` guard to prevent accidental client-side import of the data layer module.

### Key Insight
PostgreSQL `NULLS FIRST` is the default for `DESC` ordering. When using Prisma `distinct` with `orderBy`, always filter out rows with null values in the ordering column, or add explicit `completedAt: { not: null }` constraints.

---

## Prevention Strategies

### 1. AI Response Sanitization
- **Pattern**: Always sanitize AI-generated numeric values immediately after parsing using `Number.isFinite()`
- **Detection**: Log all score corrections to identify AI response patterns
- **Test**: Verify NaN inputs produce 0 scores and don't poison running averages

### 2. Sensitive Data Leakage
- **Pattern**: Use Prisma `select` (whitelist) instead of `include` (blacklist) for all client-facing queries
- **Detection**: Automated scan of API responses for forbidden fields (`correctAnswer`, `insightAnswer`)
- **Test**: Assert each mode's response omits answer fields

### 3. Prisma Client Caching
- **Pattern**: Always cache PrismaClient on `globalThis` regardless of `NODE_ENV`
- **Detection**: Monitor active database connections; alert if connection count spikes
- **Test**: Verify `getClient()` returns the same instance across multiple calls

### 4. NULL Ordering with DISTINCT
- **Pattern**: Add `completedAt: { not: null }` (or equivalent) to all queries using `distinct` + `orderBy DESC`
- **Detection**: Audit queries for `distinct` without null filters
- **Test**: Create test data with both null and non-null scores; verify the non-null row wins

---

## Related Documentation

- **Plan**: `docs/plans/2026-02-12-fix-evaluation-500-and-ux-overhaul-plan.md`
- **Prior fix**: `docs/solutions/security-issues/pr1-answer-leak-and-race-conditions.md` (answer sanitization in duels)
- **Commit**: `6ca352f` (main fix batch), `b65747d` (Prisma caching)
- **PR**: #1 (Fix API 404s + UI overhaul with celebrations)

## Files Modified

| File | Change |
|------|--------|
| `app/api/evaluate/route.ts` | NaN guards, input validation, correlation IDs |
| `app/api/sprints/generate/route.ts` | Strip correctAnswer/insightAnswer from response |
| `app/api/sprints/route.ts` | Switch to select+_count, level grouping |
| `lib/scoring/evaluate.ts` | NaN guards in scoring functions, division-by-zero fix |
| `lib/db.ts` | Cache PrismaClient in all environments |
| `lib/data/mode-page-data.ts` | completedAt filter, server-only import |
| `prisma/schema.prisma` | Sprint level/levelLabel/order fields, composite index |
