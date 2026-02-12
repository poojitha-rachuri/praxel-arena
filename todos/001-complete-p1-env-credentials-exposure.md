---
status: pending
priority: p1
issue_id: "001"
tags: [code-review, security, credentials]
dependencies: []
---

# Hardcoded Credentials in .env Files

## Problem Statement

The `.env` and `.env.local` files contain real production credentials (Clerk keys, database URLs, webhook secrets). If these files were ever committed to git, credentials would be permanently exposed in history.

**Why it matters:** Credential exposure is a critical security vulnerability. Even if removed later, git history preserves them permanently.

## Findings

- **Source:** security-sentinel agent
- **Severity:** P1 - CRITICAL
- **Evidence:** `.env` contains `CLERK_SECRET_KEY`, `DATABASE_URL`, `CLERK_WEBHOOK_SECRET` values
- **Location:** `.env`, `.env.local` at repo root

## Proposed Solutions

### Solution A: Verify .gitignore + Rotate (Recommended)
- Verify `.env` and `.env.local` are in `.gitignore`
- Check git history: `git log --all --full-history -- .env .env.local`
- If ever committed: rotate ALL credentials immediately
- **Effort:** Small (5 min)
- **Risk:** Low

### Solution B: Use environment variable injection
- Remove .env files entirely
- Use Railway/Vercel environment variable injection
- **Effort:** Medium (30 min)
- **Risk:** Low

## Recommended Action

Solution A first (5 min verification), then Solution B for production.

## Technical Details

- **Affected files:** `.env`, `.env.local`
- **Components:** All services using these credentials

## Acceptance Criteria

- [ ] `.env` and `.env.local` are in `.gitignore`
- [ ] `git log --all -- .env` shows no commits
- [ ] Credentials rotated if ever committed

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-02-12 | Created from PR #2 review | Security-sentinel flagged |

## Resources

- PR: https://github.com/poojitha-rachuri/praxel-arena/pull/2
