---
status: pending
priority: p1
issue_id: "002"
tags: [code-review, architecture, zod, validation]
dependencies: []
---

# Zod Schema Triple Duplication with Drift Risk

## Problem Statement

Three separate Zod validation schemas exist for the same content data structure:
1. `lib/validation/content-schema.ts` (canonical, unused)
2. `scripts/generate-content.ts` (standalone copy)
3. `prisma/seed.ts` (relaxed copy)

The schemas have already drifted — seed.ts uses weaker validation than generate-content.ts. This means invalid data can enter the database through seeding that would be rejected by generation.

**Why it matters:** Schema drift causes silent data corruption and makes the validation layer untrustworthy. The canonical schema (content-schema.ts) is dead code — nobody imports it.

## Findings

- **Source:** architecture-strategist, code-simplicity-reviewer, pattern-recognition-specialist
- **Severity:** P1 - CRITICAL (data integrity risk)
- **Evidence:**
  - `lib/validation/content-schema.ts:1-72` — canonical schemas, zero imports
  - `scripts/generate-content.ts` — duplicated schemas with different rules
  - `prisma/seed.ts` — relaxed schemas that accept data the others reject
- **Location:** Three files across lib/, scripts/, prisma/

## Proposed Solutions

### Solution A: Single Source of Truth (Recommended)
- Keep `lib/validation/content-schema.ts` as the canonical source
- Import it in both `generate-content.ts` and `seed.ts`
- Remove duplicate schema definitions
- **Effort:** Medium (30 min)
- **Risk:** Low — just consolidating existing code

### Solution B: Delete Dead Code, Keep Two
- Delete `lib/validation/content-schema.ts` (dead code)
- Align generate-content.ts and seed.ts schemas manually
- **Effort:** Small (15 min)
- **Risk:** Medium — still two sources of truth

## Recommended Action

Solution A — single source of truth prevents future drift.

## Technical Details

- **Affected files:** `lib/validation/content-schema.ts`, `scripts/generate-content.ts`, `prisma/seed.ts`
- **Components:** Content validation, AI pipeline, database seeding

## Acceptance Criteria

- [ ] Only ONE Zod schema definition exists for content types
- [ ] Both seed.ts and generate-content.ts import from the same source
- [ ] `lib/validation/content-schema.ts` has at least 2 importers
- [ ] All 72 seed JSON files pass the unified schema

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-02-12 | Created from PR #2 review | Multiple agents flagged independently |

## Resources

- PR: https://github.com/poojitha-rachuri/praxel-arena/pull/2
