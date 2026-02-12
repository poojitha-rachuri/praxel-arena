---
status: pending
priority: p3
issue_id: "034"
tags: [code-review, typescript, type-safety]
dependencies: []
---

# interactionType Uses string Instead of Prisma Enum

## Problem Statement

`EnrichedResponse.interactionType` is typed as `string` in `types/index.ts`, and `TYPE_LABELS` is `Record<string, string>`. Both should use the Prisma-generated `InteractionType` enum for compile-time safety.

## Findings

- **Source:** TypeScript reviewer
- **Evidence:** `types/index.ts` — `interactionType: string`, `components/results/InteractionReview.tsx` — `Record<string, string>` for TYPE_LABELS
- **Location:** `types/index.ts`, `components/results/InteractionReview.tsx`

## Proposed Solutions

### Solution A: Use Prisma InteractionType enum
```typescript
import { InteractionType } from "@/app/generated/prisma/client";
// In types/index.ts:
interactionType: InteractionType;
// In InteractionReview.tsx:
const TYPE_LABELS: Record<InteractionType, string> = { ... };
```
- **Effort:** Small (10 min)

## Acceptance Criteria

- [ ] All `interactionType` fields use Prisma enum
- [ ] TYPE_LABELS is exhaustive Record over InteractionType

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-02-12 | Created from PR #4 review | TypeScript reviewer flagged |

## Resources

- PR: https://github.com/poojitha-rachuri/praxel-arena/pull/4
