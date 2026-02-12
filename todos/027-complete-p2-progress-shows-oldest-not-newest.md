---
status: pending
priority: p2
issue_id: "027"
tags: [code-review, data-integrity, ux]
dependencies: []
---

# Progress Chart Shows Oldest 50 Attempts Instead of Newest

## Problem Statement

`/api/progress/route.ts` orders by `completedAt: "asc"` and `take: 50`. For users with more than 50 attempts, this returns the oldest 50 and silently drops all recent progress. The chart should show the most recent 50 attempts.

**Why it matters:** Power users see stale progress data with no indication that newer attempts are excluded.

## Findings

- **Source:** Data integrity guardian
- **Severity:** P2 - IMPORTANT
- **Evidence:** `app/api/progress/route.ts:27-28` — `orderBy: { completedAt: "asc" }, take: 50`
- **Location:** `app/api/progress/route.ts`

## Proposed Solutions

### Solution A: Fetch newest 50, then reverse for chart timeline (Recommended)
```typescript
const attempts = await prisma.sprintAttempt.findMany({
  where,
  orderBy: { completedAt: "desc" }, // newest first
  take: 50,
  select: { ... },
});
attempts.reverse(); // oldest-to-newest for chart x-axis
```
- **Effort:** Small (5 min)
- **Risk:** None

## Technical Details

- **Affected files:** `app/api/progress/route.ts`

## Acceptance Criteria

- [ ] Users with 50+ attempts see their most recent 50
- [ ] Chart x-axis still shows chronological order (left=oldest, right=newest)

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-02-12 | Created from PR #4 review | Data integrity guardian flagged |

## Resources

- PR: https://github.com/poojitha-rachuri/praxel-arena/pull/4
