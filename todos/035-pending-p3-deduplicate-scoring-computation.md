---
status: pending
priority: p3
issue_id: "035"
tags: [code-review, performance, duplication]
dependencies: []
---

# Scoring Computed 4x — Deduplicate distributeToDimensions

## Problem Statement

In `lib/scoring/evaluate.ts`, `distributeToDimensions` is called in both the main scoring path and again inside `buildDeterministicHighlights`. The same dimension scores are computed multiple times instead of being passed through.

## Findings

- **Source:** Performance oracle, Code simplicity reviewer
- **Evidence:** `lib/scoring/evaluate.ts` — `distributeToDimensions` called in scoring AND in `buildDeterministicHighlights`
- **Location:** `lib/scoring/evaluate.ts`

## Proposed Solutions

### Solution A: Pass computed scores to buildDeterministicHighlights
- Compute once, pass as parameter
- **Effort:** Small (10 min)

## Acceptance Criteria

- [ ] `distributeToDimensions` called once per evaluation
- [ ] Highlights function receives pre-computed scores

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-02-12 | Created from PR #4 review | Performance + Simplicity agents |

## Resources

- PR: https://github.com/poojitha-rachuri/praxel-arena/pull/4
