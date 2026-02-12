---
status: pending
priority: p3
issue_id: "016"
tags: [code-review, reliability, ai]
dependencies: []
---

# No Retry on AI Evaluation Failures

## Problem Statement

The evaluation endpoint calls Claude AI once with no retry logic. Transient API failures result in user-facing 500 errors. The generation pipeline has retries but evaluation does not.

## Proposed Solutions

Add exponential backoff retry (2-3 attempts) matching the generation pipeline pattern.

## Acceptance Criteria

- [ ] Evaluation retries on transient failures
- [ ] Max 3 retries with exponential backoff

## Resources

- PR: https://github.com/poojitha-rachuri/praxel-arena/pull/2
