---
status: pending
priority: p2
issue_id: "006"
tags: [code-review, database, prisma, data-integrity]
dependencies: []
---

# Missing @@unique Constraint on Sprint

## Problem Statement

The Sprint model lacks a `@@unique([skillId, title, mode])` constraint. The seed script uses `findFirst` + `create` instead of `upsert` for sprints, meaning re-running seed could create duplicates.

## Findings

- **Source:** data-integrity-guardian
- **Severity:** P2 - IMPORTANT
- **Evidence:** `prisma/schema.prisma` Sprint model has no @@unique beyond default id
- **Location:** `prisma/schema.prisma`, `prisma/seed.ts`

## Proposed Solutions

### Solution A: Add @@unique + Use Upsert (Recommended)
- Add `@@unique([skillId, topicId, title, mode])` to Sprint model
- Change seed.ts to use `upsert` with this composite key
- Create migration
- **Effort:** Medium (15 min)
- **Risk:** Low — need to verify no existing duplicates

### Solution B: Add Application-Level Check
- Keep findFirst+create but add explicit duplicate check
- **Effort:** Small (5 min)
- **Risk:** Medium — no database-level guarantee

## Recommended Action

Solution A — database constraints are the correct layer for uniqueness.

## Acceptance Criteria

- [ ] @@unique constraint added to Sprint model
- [ ] Seed script uses upsert for sprints
- [ ] Migration created and applied
- [ ] Re-running seed doesn't create duplicates

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-02-12 | Created from PR #2 review | Data-integrity flagged |

## Resources

- PR: https://github.com/poojitha-rachuri/praxel-arena/pull/2
