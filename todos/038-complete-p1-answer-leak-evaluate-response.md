---
status: pending
priority: p1
issue_id: "038"
tags: [code-review, security, answer-leak]
dependencies: []
---

# Answer Leak: /api/evaluate Returns correctAnswer to Client

## Problem Statement

The `/api/evaluate` endpoint returns the full `evaluation` object including `enrichedResponses`, which contains `correctAnswer` and `insightAnswer` for every interaction. A user can inspect the network response in DevTools after submitting any sprint and extract the answer key. For COMPETE mode, this leaks answers to a duel opponent who hasn't submitted yet.

**Why it matters:** Undermines credentialing integrity. Users can extract and share correct answers for pre-seeded content.

## Findings

- **Source:** security-sentinel
- **Severity:** P1 - CRITICAL (credential integrity)
- **Evidence:** `app/api/evaluate/route.ts:251` — `return NextResponse.json({ attempt, evaluation })` sends full enrichedResponses
- **Location:** `app/api/evaluate/route.ts`

## Proposed Solutions

### Solution A: Strip sensitive fields from API response (Recommended)
```typescript
const sanitizedEvaluation = {
  ...evaluation,
  enrichedResponses: evaluation.enrichedResponses?.map(
    ({ correctAnswer, insightAnswer, ...rest }) => rest
  ),
};
return NextResponse.json({ attempt, evaluation: sanitizedEvaluation });
```
The results page already reads enriched data server-side from the database, so the client response doesn't need these fields.
- **Effort:** Small (5 min)
- **Risk:** None — results page uses server-side data

### Solution B: Don't return enrichedResponses at all
- Only return `totalScore`, `scores`, `feedback`, `highlights`, `improvements`
- **Effort:** Small (5 min)
- **Risk:** Low — verify ResultsReveal doesn't read from the response

## Recommended Action

Solution A — minimal change, preserves other enriched data the client may use.

## Technical Details

- **Affected files:** `app/api/evaluate/route.ts`

## Acceptance Criteria

- [ ] `/api/evaluate` response does NOT contain `correctAnswer` or `insightAnswer`
- [ ] Results page still displays per-interaction review correctly (reads from DB)
- [ ] DevTools network inspection confirms sensitive fields are stripped

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-02-12 | Created from PR #4 review | Security sentinel flagged |

## Resources

- PR: https://github.com/poojitha-rachuri/praxel-arena/pull/4
