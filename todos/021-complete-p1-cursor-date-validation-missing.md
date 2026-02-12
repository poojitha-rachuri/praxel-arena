---
status: pending
priority: p1
issue_id: "021"
tags: [code-review, security, validation, api]
dependencies: []
---

# Missing Cursor Date Validation Crashes Prisma

## Problem Statement

The `/api/attempts` route parses the cursor's date portion with `new Date(cursorDateStr)` but never validates the result. If a malformed cursor is sent, `new Date("garbage")` produces `Invalid Date`, which is passed directly to Prisma's `lt` filter — causing a 500 error.

**Why it matters:** Any malformed cursor (user tampering, URL corruption) crashes the API instead of returning a graceful error.

## Findings

- **Source:** TypeScript reviewer
- **Severity:** P1 - CRITICAL
- **Evidence:** `app/api/attempts/route.ts:30` — `new Date(cursorDateStr)` with no `isNaN` check
- **Location:** `app/api/attempts/route.ts`

## Proposed Solutions

### Solution A: Validate Date and return 400 (Recommended)
```typescript
const cursorDate = new Date(cursorDateStr);
if (isNaN(cursorDate.getTime())) {
  return NextResponse.json({ error: "Invalid cursor" }, { status: 400 });
}
```
- **Effort:** Small (5 min)
- **Risk:** None

### Solution B: Wrap in try-catch
- Catch any Prisma error from invalid date and return 400
- **Effort:** Small (5 min)
- **Risk:** Low (masks other errors)

## Recommended Action

Solution A — explicit validation is clearer and prevents the bad data from reaching Prisma at all.

## Technical Details

- **Affected files:** `app/api/attempts/route.ts`

## Acceptance Criteria

- [ ] Malformed cursor returns 400 with descriptive error
- [ ] `new Date()` result is validated before use in query

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-02-12 | Created from PR #4 review | TypeScript reviewer flagged |

## Resources

- PR: https://github.com/poojitha-rachuri/praxel-arena/pull/4
