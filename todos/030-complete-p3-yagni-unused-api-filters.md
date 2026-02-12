---
status: pending
priority: p3
issue_id: "030"
tags: [code-review, yagni, simplicity]
dependencies: []
---

# YAGNI: Unused skill/mode Filters on Attempts API

## Problem Statement

`/api/attempts` accepts `skill` and `mode` query params, but no UI code sends them. The `AttemptHistory` component only calls `/api/attempts?cursor=...` without filters.

## Findings

- **Source:** Code simplicity reviewer
- **Evidence:** `app/api/attempts/route.ts:14-20` — params parsed but never sent by client
- **Location:** `app/api/attempts/route.ts`

## Proposed Solutions

### Solution A: Remove unused params (Recommended)
- Delete `skill`/`mode` parsing and related where clause additions
- **Effort:** Small (5 min)

## Acceptance Criteria

- [ ] API only accepts `cursor` and `limit` params
- [ ] Unused filter code removed

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-02-12 | Created from PR #4 review | Simplicity reviewer flagged |

## Resources

- PR: https://github.com/poojitha-rachuri/praxel-arena/pull/4
