---
status: pending
priority: p3
issue_id: "014"
tags: [code-review, error-handling, performance]
dependencies: []
---

# Promise.all Without Error Isolation

## Problem Statement

`mode-page-data.ts` uses `Promise.all` for 5 parallel queries. If any single query fails, all results are lost. `Promise.allSettled` would allow partial rendering.

## Proposed Solutions

Switch to `Promise.allSettled` and handle partial failures gracefully.

## Acceptance Criteria

- [ ] Page renders even if one query fails
- [ ] Failed queries show appropriate fallback

## Resources

- PR: https://github.com/poojitha-rachuri/praxel-arena/pull/2
