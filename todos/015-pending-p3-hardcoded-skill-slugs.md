---
status: pending
priority: p3
issue_id: "015"
tags: [code-review, maintainability]
dependencies: []
---

# Hardcoded Skill Slugs in Multiple Files

## Problem Statement

Skill slugs like "product-strategy", "data-interpretation" appear as string literals across multiple files. Adding a new skill requires updating multiple locations.

## Proposed Solutions

Create a `SKILLS` constant object or derive from database at build time.

## Acceptance Criteria

- [ ] Skill slugs defined in one place
- [ ] Adding a new skill requires updating only one file

## Resources

- PR: https://github.com/poojitha-rachuri/praxel-arena/pull/2
