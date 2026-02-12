---
status: pending
priority: p2
issue_id: "036"
tags: [code-review, performance, database, index]
dependencies: []
---

# Missing Composite Index for Skill-Filtered Attempt Queries

## Problem Statement

Both `/api/attempts` and `/api/progress` filter by skill slug through a nested relation (`where.sprint = { skill: { slug } }`). This produces a join through Sprint to Skill. The existing indexes on SprintAttempt cover `[userId, completedAt]` and `[userId, mode]` but not `[userId, sprintId, completedAt]`, forcing PostgreSQL to do a nested loop join without a covering index.

**Why it matters:** At 1000+ users with 50+ attempts each, query times degrade from <50ms to 200ms+.

## Findings

- **Source:** Performance oracle
- **Severity:** P2 - IMPORTANT
- **Evidence:** `prisma/schema.prisma` SprintAttempt indexes lack `[userId, sprintId, completedAt]` composite
- **Location:** `prisma/schema.prisma`

## Proposed Solutions

### Solution A: Add composite index (Recommended)
```prisma
@@index([userId, sprintId, completedAt])
```
- **Effort:** Small (5 min + migration)
- **Risk:** None — additive index, non-blocking DDL

## Acceptance Criteria

- [ ] Index added to SprintAttempt model
- [ ] Migration created and applied
- [ ] Skill-filtered queries use index scan (verify with `EXPLAIN`)

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-02-12 | Created from PR #4 review | Performance oracle flagged |

## Resources

- PR: https://github.com/poojitha-rachuri/praxel-arena/pull/4
