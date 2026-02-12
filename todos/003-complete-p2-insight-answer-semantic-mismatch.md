---
status: pending
priority: p2
issue_id: "003"
tags: [code-review, ux, data-quality]
dependencies: []
---

# insightAnswer Semantic Mismatch (UX Bug)

## Problem Statement

The `insightAnswer` field in seed data always equals `correctAnswer` (e.g., "b" or "b,a,d,c"). The UI's ResultsReveal component shows `insightAnswer` as the explanation text. Users see a raw letter like "b" instead of an actual insight explanation.

**Why it matters:** This is a visible UX bug. After completing a sprint, users see meaningless letters instead of learning insights, undermining the platform's educational value.

## Findings

- **Source:** pattern-recognition-specialist, code-simplicity-reviewer
- **Severity:** P2 - IMPORTANT (visible UX bug)
- **Evidence:** All 72 seed JSON files have `insightAnswer` === `correctAnswer`
- **Location:** `prisma/seed-data/**/*.json`, `components/layout/ResultsReveal.tsx`

## Proposed Solutions

### Solution A: AI-Generate Insight Text (Recommended)
- Update generate-content.ts prompts to produce actual insight explanations
- Re-generate all seed data with proper insightAnswer text
- **Effort:** Large (1-2 hours with AI regeneration)
- **Risk:** Low

### Solution B: Hide insightAnswer in UI
- Don't display insightAnswer until data is fixed
- Show correctAnswer option text instead
- **Effort:** Small (10 min)
- **Risk:** Low — quick fix, defers proper solution

## Recommended Action

Solution B for hackathon speed, Solution A post-hackathon.

## Technical Details

- **Affected files:** `prisma/seed-data/**/*.json` (72 files), `components/layout/ResultsReveal.tsx`
- **Components:** Results display, content pipeline

## Acceptance Criteria

- [ ] Users see meaningful insight text, not raw option letters
- [ ] Either insightAnswer contains explanation OR UI shows option text

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-02-12 | Created from PR #2 review | Pattern-recognition flagged |

## Resources

- PR: https://github.com/poojitha-rachuri/praxel-arena/pull/2
