---
status: pending
priority: p1
issue_id: "022"
tags: [code-review, typescript, type-safety]
dependencies: []
---

# Record<string, unknown> Used Instead of Prisma WhereInput Types

## Problem Statement

Both `/api/attempts/route.ts` and `/api/progress/route.ts` build Prisma `where` clauses using `Record<string, unknown>` instead of the generated `Prisma.SprintAttemptWhereInput` type. This defeats TypeScript's ability to catch typos, invalid fields, or wrong value types at compile time.

**Why it matters:** Type-unsafe queries can silently produce wrong results or runtime errors that TypeScript should prevent.

## Findings

- **Source:** TypeScript reviewer, Architecture strategist
- **Severity:** P1 - CRITICAL (type safety gap)
- **Evidence:** `app/api/attempts/route.ts:15`, `app/api/progress/route.ts:15`
- **Location:** Both new API route files

## Proposed Solutions

### Solution A: Use Prisma generated types (Recommended)
```typescript
import { Prisma } from "@/app/generated/prisma/client";
const where: Prisma.SprintAttemptWhereInput = {
  userId: user.id,
  completedAt: { not: null },
};
if (skill) {
  where.sprint = { skill: { slug: skill } };
}
```
- **Effort:** Small (10 min)
- **Risk:** None

## Recommended Action

Solution A — direct replacement, no behavior change.

## Technical Details

- **Affected files:** `app/api/attempts/route.ts`, `app/api/progress/route.ts`

## Acceptance Criteria

- [ ] Both where clauses use `Prisma.SprintAttemptWhereInput`
- [ ] No `Record<string, unknown>` for Prisma queries

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-02-12 | Created from PR #4 review | TypeScript + Architecture agents |

## Resources

- PR: https://github.com/poojitha-rachuri/praxel-arena/pull/4
