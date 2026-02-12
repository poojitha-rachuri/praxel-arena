---
status: pending
priority: p2
issue_id: "026"
tags: [code-review, performance, server-side]
dependencies: []
---

# Parallelize Profile Page Server Queries

## Problem Statement

`app/profile/page.tsx` runs two sequential database queries: first the user lookup with includes, then a separate `sprintAttempt.findMany` for recent attempts. These are independent and can run in parallel with `Promise.all`, saving one full DB round-trip.

**Why it matters:** Profile page load time is user-facing. Parallelizing saves ~50-100ms per load.

## Findings

- **Source:** Performance oracle
- **Severity:** P2 - IMPORTANT
- **Evidence:** `app/profile/page.tsx:13-44` (user query) and `app/profile/page.tsx:83-99` (attempts query) are independent
- **Location:** `app/profile/page.tsx`

## Proposed Solutions

### Solution A: Promise.all for both queries (Recommended)
```typescript
const [user, recentAttempts] = await Promise.all([
  prisma.user.findUnique({ where: { id: baseUser.id }, include: { ... } }),
  prisma.sprintAttempt.findMany({ where: { userId: baseUser.id, completedAt: { not: null } }, ... }),
]);
```
- **Effort:** Small (10 min)
- **Risk:** None — queries are independent

## Technical Details

- **Affected files:** `app/profile/page.tsx`

## Acceptance Criteria

- [ ] Both queries wrapped in `Promise.all`
- [ ] Profile page still renders correctly

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-02-12 | Created from PR #4 review | Performance oracle flagged |

## Resources

- PR: https://github.com/poojitha-rachuri/praxel-arena/pull/4
