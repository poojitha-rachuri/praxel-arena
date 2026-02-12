---
status: pending
priority: p2
issue_id: "008"
tags: [code-review, security, rate-limiting, api]
dependencies: []
---

# Missing Rate Limiting on /api/evaluate

## Problem Statement

The `/api/sprints/[sprintId]/evaluate` endpoint calls Claude AI for every request but has no rate limiting. A malicious user could make thousands of requests, incurring significant API costs.

Sprint generation has a 5/user/hour limit, but evaluation has none.

## Findings

- **Source:** security-sentinel, performance-oracle
- **Severity:** P2 - IMPORTANT
- **Location:** `app/api/sprints/[sprintId]/evaluate/route.ts`

## Proposed Solutions

### Solution A: Add Rate Limiting (Recommended)
- Add rate limiting matching sprint generation (e.g., 20/user/hour for evals)
- Use existing rate limit pattern from sprint generation
- **Effort:** Small (15 min)
- **Risk:** None

## Acceptance Criteria

- [ ] Evaluate endpoint has rate limiting
- [ ] Returns 429 when limit exceeded
- [ ] Rate limit is per-user

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-02-12 | Created from PR #2 review | Security + Performance agents flagged |

## Resources

- PR: https://github.com/poojitha-rachuri/praxel-arena/pull/2
