---
status: pending
priority: p3
issue_id: "011"
tags: [code-review, typescript, mutation]
dependencies: []
---

# sanitizeSprint() Mutates Input Object

## Problem Statement

`sanitizeSprint()` in `generate-content.ts` casts to `Record<string, unknown>` and mutates the input object via `delete`. This is a side-effect-prone pattern.

## Proposed Solutions

Create a new object with only desired keys using destructuring or `pick()`.

## Acceptance Criteria

- [ ] sanitizeSprint returns new object without mutating input

## Resources

- PR: https://github.com/poojitha-rachuri/praxel-arena/pull/2
