---
status: pending
priority: p2
issue_id: "007"
tags: [code-review, security, webhook]
dependencies: []
---

# Placeholder Webhook Secret

## Problem Statement

The Clerk webhook route checks `CLERK_WEBHOOK_SECRET` but falls back silently if missing. In development, this may result in unverified webhook payloads being processed.

## Findings

- **Source:** security-sentinel
- **Severity:** P2 - IMPORTANT
- **Location:** `app/api/webhooks/clerk/route.ts`

## Proposed Solutions

### Solution A: Fail Fast on Missing Secret (Recommended)
- Throw at startup if `CLERK_WEBHOOK_SECRET` is not set
- Never process unverified webhooks
- **Effort:** Small (5 min)
- **Risk:** None

## Acceptance Criteria

- [ ] Webhook route throws if CLERK_WEBHOOK_SECRET missing
- [ ] No unverified payloads processed

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-02-12 | Created from PR #2 review | Security-sentinel flagged |

## Resources

- PR: https://github.com/poojitha-rachuri/praxel-arena/pull/2
