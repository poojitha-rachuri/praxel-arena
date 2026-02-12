---
status: pending
priority: p3
issue_id: "032"
tags: [code-review, correctness, ux]
dependencies: []
---

# Hardcoded timeTarget={15} in InteractionReview

## Problem Statement

`TimeIndicator` in `InteractionReview.tsx` uses `timeTarget={15}` for all interaction types. Actual targets vary: SpotTheSignal (10s), ForcedTradeoff (15-20s), RankAndPrioritize (15-25s), TeachAndTest (20-30s). This makes time comparisons misleading.

## Findings

- **Source:** TypeScript reviewer
- **Evidence:** `components/results/InteractionReview.tsx` — hardcoded `15` in TimeIndicator
- **Location:** `components/results/InteractionReview.tsx`

## Proposed Solutions

### Solution A: Map time targets by interaction type
```typescript
const TIME_TARGETS: Record<string, number> = {
  SPOT_THE_SIGNAL: 10,
  FORCED_TRADEOFF: 17,
  FILL_THE_GAP: 10,
  RANK_AND_PRIORITIZE: 20,
  CURVEBALL: 17,
  TEACH_AND_TEST: 25,
};
```
- **Effort:** Small (10 min)

## Acceptance Criteria

- [ ] Each interaction type uses its correct time target
- [ ] Time indicator accurately reflects fast/slow performance

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-02-12 | Created from PR #4 review | TypeScript reviewer flagged |

## Resources

- PR: https://github.com/poojitha-rachuri/praxel-arena/pull/4
