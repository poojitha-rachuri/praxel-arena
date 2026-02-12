---
status: pending
priority: p2
issue_id: "005"
tags: [code-review, data-quality, compete-mode]
dependencies: []
---

# COMPETE Sprint 0-Indexed Order

## Problem Statement

COMPETE mode sprints in seed data use `sprintOrder: 0` while LEARN and PRACTICE use 1-indexed orders. This inconsistency could cause sorting bugs or off-by-one errors in the UI.

## Findings

- **Source:** data-integrity-guardian, pattern-recognition-specialist
- **Severity:** P2 - IMPORTANT
- **Evidence:** `prisma/seed-data/*/compete-1.json` files have `sprintOrder: 0`
- **Location:** `prisma/seed-data/**/compete-*.json`

## Proposed Solutions

### Solution A: Fix to 1-indexed (Recommended)
- Update all compete JSON files to use `sprintOrder: 1`
- Consistent with LEARN and PRACTICE modes
- **Effort:** Small (10 min)
- **Risk:** None

## Acceptance Criteria

- [ ] All compete JSON files use sprintOrder >= 1
- [ ] Consistent ordering across all modes

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-02-12 | Created from PR #2 review | Data-integrity flagged |

## Resources

- PR: https://github.com/poojitha-rachuri/praxel-arena/pull/2
