---
status: pending
priority: p3
issue_id: "033"
tags: [code-review, bug, edge-case]
dependencies: []
---

# RankingComparison Crashes on Empty correctAnswer String

## Problem Statement

`RankingComparison` in `InteractionReview.tsx` calls `correctAnswer.split(",")` which returns `[""]` for an empty string, producing a ghost ranking item. The component should guard against empty/null correctAnswer.

## Findings

- **Source:** TypeScript reviewer
- **Evidence:** `components/results/InteractionReview.tsx` — `.split(",")` on potentially empty string
- **Location:** `components/results/InteractionReview.tsx`

## Proposed Solutions

### Solution A: Guard with filter
```typescript
const correctOrder = correctAnswer ? correctAnswer.split(",").filter(Boolean) : [];
```
- **Effort:** Small (2 min)

## Acceptance Criteria

- [ ] Empty correctAnswer doesn't produce ghost items
- [ ] Component renders gracefully with missing data

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-02-12 | Created from PR #4 review | TypeScript reviewer flagged |

## Resources

- PR: https://github.com/poojitha-rachuri/praxel-arena/pull/4
