---
status: pending
priority: p2
issue_id: "004"
tags: [code-review, cleanup, dead-code]
dependencies: []
---

# Dead Components (197 LOC)

## Problem Statement

Two components are no longer imported anywhere after the SkillAccordion refactor:
- `components/layout/SkillSprintBrowser.tsx`
- `components/layout/SprintList.tsx`

Combined ~197 lines of dead code that increases bundle size and confuses developers.

## Findings

- **Source:** code-simplicity-reviewer, architecture-strategist
- **Severity:** P2 - IMPORTANT
- **Evidence:** Zero imports found via grep across entire codebase
- **Location:** `components/layout/SkillSprintBrowser.tsx`, `components/layout/SprintList.tsx`

## Proposed Solutions

### Solution A: Delete Both Files (Recommended)
- `rm components/layout/SkillSprintBrowser.tsx components/layout/SprintList.tsx`
- **Effort:** Small (5 min)
- **Risk:** None — git preserves history

## Acceptance Criteria

- [ ] Both files deleted
- [ ] No broken imports
- [ ] Build succeeds

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-02-12 | Created from PR #2 review | Simplicity reviewer flagged |

## Resources

- PR: https://github.com/poojitha-rachuri/praxel-arena/pull/2
