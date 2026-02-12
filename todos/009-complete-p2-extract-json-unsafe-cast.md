---
status: pending
priority: p2
issue_id: "009"
tags: [code-review, typescript, type-safety]
dependencies: []
---

# extractJSON Unsafe Type Cast

## Problem Statement

The `extractJSON<T>` function in `generate-content.ts` uses `JSON.parse(match) as T` without runtime validation. This casts any parsed JSON to the expected type without Zod validation, defeating the purpose of having schemas.

## Findings

- **Source:** kieran-typescript-reviewer
- **Severity:** P2 - IMPORTANT
- **Evidence:** `scripts/generate-content.ts` extractJSON function
- **Location:** `scripts/generate-content.ts`

## Proposed Solutions

### Solution A: Validate with Zod After Parse (Recommended)
- Accept a Zod schema parameter: `extractJSON<T>(text: string, schema: ZodSchema<T>): T`
- Parse JSON, then validate with `schema.parse()`
- **Effort:** Small (15 min)
- **Risk:** None — improves safety

### Solution B: Keep As-Is (Hackathon Pragmatism)
- The function only runs in a CLI script, not production
- Risk is limited to development workflow
- **Effort:** None
- **Risk:** Low — CLI-only usage

## Recommended Action

Solution A if consolidating Zod schemas (pairs with todo #002). Solution B acceptable for hackathon.

## Acceptance Criteria

- [ ] extractJSON validates against Zod schema before returning
- [ ] Type safety maintained end-to-end

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-02-12 | Created from PR #2 review | TypeScript reviewer flagged |

## Resources

- PR: https://github.com/poojitha-rachuri/praxel-arena/pull/2
