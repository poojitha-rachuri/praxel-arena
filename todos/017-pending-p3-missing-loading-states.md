---
status: pending
priority: p3
issue_id: "017"
tags: [code-review, ux, loading]
dependencies: []
---

# Missing Loading/Error States on Mode Pages

## Problem Statement

Learn and Practice pages use Server Components with no loading.tsx or error.tsx boundaries. Slow queries result in blank pages with no feedback.

## Proposed Solutions

Add `loading.tsx` with skeleton UI and `error.tsx` with retry button for each mode page.

## Acceptance Criteria

- [ ] loading.tsx exists for learn and practice routes
- [ ] error.tsx exists with retry functionality

## Resources

- PR: https://github.com/poojitha-rachuri/praxel-arena/pull/2
