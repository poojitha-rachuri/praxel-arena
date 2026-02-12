---
status: pending
priority: p2
issue_id: "028"
tags: [code-review, typescript, type-safety]
dependencies: []
---

# Fragile Duck-Type Check for Enriched Responses

## Problem Statement

`app/results/[attemptId]/page.tsx` detects enriched responses by checking if the first element of a JSON array has certain properties via 3 layers of `as` casts. This is fragile — if the JSON shape changes or the array is empty, it silently falls through to the non-enriched path with no error.

**Why it matters:** Silent type coercion hides bugs. A schema change to `enrichedResponses` would break detection without any compile-time warning.

## Findings

- **Source:** TypeScript reviewer
- **Severity:** P2 - IMPORTANT
- **Evidence:** `app/results/[attemptId]/page.tsx` — triple `as` cast with duck-type property check
- **Location:** `app/results/[attemptId]/page.tsx`

## Proposed Solutions

### Solution A: Use Zod schema validation (Recommended)
```typescript
import { z } from "zod";
const EnrichedResponseSchema = z.array(z.object({
  interactionId: z.string(),
  interactionType: z.string(),
  // ... other required fields
}));
const parsed = EnrichedResponseSchema.safeParse(attempt.enrichedResponses);
const enrichedResponses = parsed.success ? parsed.data : null;
```
- **Effort:** Medium (20 min)
- **Risk:** Low

### Solution B: Type guard function
```typescript
function isEnrichedResponses(val: unknown): val is EnrichedResponse[] {
  return Array.isArray(val) && val.length > 0 && "interactionId" in val[0];
}
```
- **Effort:** Small (10 min)
- **Risk:** Low

## Technical Details

- **Affected files:** `app/results/[attemptId]/page.tsx`

## Acceptance Criteria

- [ ] Enriched response detection uses type guard or Zod parse
- [ ] No triple `as` cast chain

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-02-12 | Created from PR #4 review | TypeScript reviewer flagged |

## Resources

- PR: https://github.com/poojitha-rachuri/praxel-arena/pull/4
