---
status: pending
priority: p3
issue_id: "031"
tags: [code-review, yagni, dead-code]
dependencies: []
---

# Dead Fields in Progress API Response

## Problem Statement

`/api/progress` computes and returns `firstAttemptScore`, `latestAttemptScore` (in summary), and `scores` (DimensionScores per data point), but `ProgressCharts.tsx` never reads any of them. This is unnecessary computation and data transfer.

## Findings

- **Source:** Code simplicity reviewer
- **Evidence:** `app/api/progress/route.ts:62,72-73,86-87` compute/return fields; `components/profile/ProgressCharts.tsx` only uses `totalScore`, `sprintTitle`, `skillName`, `completedAt`
- **Location:** `app/api/progress/route.ts`

## Proposed Solutions

### Solution A: Remove dead fields (Recommended)
- Remove `scores` from dataPoints mapping
- Remove `firstAttemptScore`/`latestAttemptScore` from summary
- **Effort:** Small (5 min)

## Acceptance Criteria

- [ ] API response only includes consumed fields
- [ ] No unnecessary Prisma `select` for `scores` column

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-02-12 | Created from PR #4 review | Simplicity reviewer flagged |

## Resources

- PR: https://github.com/poojitha-rachuri/praxel-arena/pull/4
