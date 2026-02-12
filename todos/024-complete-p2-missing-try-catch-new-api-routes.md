---
status: pending
priority: p2
issue_id: "024"
tags: [code-review, api, error-handling, pattern-consistency]
dependencies: []
---

# New API Routes Lack try-catch Error Handling

## Problem Statement

The new `/api/attempts` and `/api/progress` routes lack try-catch blocks, unlike existing routes (`/api/sprints`, `/api/skills`, `/api/evaluate`) which wrap their logic in try-catch and return structured error responses. An unexpected Prisma error or runtime exception will produce an unhandled 500 with no correlation ID or logging.

**Why it matters:** Pattern inconsistency makes debugging harder and produces unhelpful error responses for clients.

## Findings

- **Source:** Pattern recognition specialist, Architecture strategist
- **Severity:** P2 - IMPORTANT
- **Evidence:** Existing routes use try-catch; new routes in `app/api/attempts/route.ts` and `app/api/progress/route.ts` do not
- **Location:** `app/api/attempts/route.ts`, `app/api/progress/route.ts`

## Proposed Solutions

### Solution A: Add try-catch with correlation ID pattern (Recommended)
```typescript
try {
  // ... existing logic
} catch (error) {
  const correlationId = crypto.randomUUID();
  console.error(`[${correlationId}] GET /api/attempts error:`, error);
  return NextResponse.json(
    { error: "Internal server error", correlationId },
    { status: 500 }
  );
}
```
- **Effort:** Small (10 min for both routes)
- **Risk:** None

## Technical Details

- **Affected files:** `app/api/attempts/route.ts`, `app/api/progress/route.ts`

## Acceptance Criteria

- [ ] Both routes wrapped in try-catch
- [ ] Error responses include correlation ID
- [ ] Pattern matches existing `/api/evaluate` route

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-02-12 | Created from PR #4 review | Pattern + Architecture agents |

## Resources

- PR: https://github.com/poojitha-rachuri/praxel-arena/pull/4
