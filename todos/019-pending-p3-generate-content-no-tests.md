---
status: pending
priority: p3
issue_id: "019"
tags: [code-review, testing]
dependencies: []
---

# No Tests for Content Generation Pipeline

## Problem Statement

`scripts/generate-content.ts` (720 lines) has zero test coverage. Schema validation, JSON extraction, and retry logic are all untested.

## Proposed Solutions

Add unit tests for extractJSON, sanitizeSprint, and Zod schema validation using seed data as fixtures.

## Acceptance Criteria

- [ ] extractJSON has tests for valid/invalid/malformed JSON
- [ ] Zod schemas tested against sample data
- [ ] sanitizeSprint tested for field removal

## Resources

- PR: https://github.com/poojitha-rachuri/praxel-arena/pull/2
