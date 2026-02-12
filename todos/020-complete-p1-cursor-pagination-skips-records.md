---
status: pending
priority: p1
issue_id: "020"
tags: [code-review, data-integrity, pagination, api]
dependencies: []
---

# Cursor Pagination Skips Records on Duplicate Timestamps

## Problem Statement

The `/api/attempts` cursor pagination parses both `completedAt` and `id` from the cursor string, but the Prisma query only filters by `completedAt < cursor_date`. The `id` is never used as a tiebreaker. When multiple attempts share the same `completedAt` timestamp, records will be skipped or duplicated.

**Why it matters:** Users with rapid attempts (or batch-completed sprints) will see missing history entries — a data integrity issue visible to end users.

## Findings

- **Source:** TypeScript reviewer, Performance oracle, Data integrity guardian (3 agents independently flagged)
- **Severity:** P1 - CRITICAL
- **Evidence:** `app/api/attempts/route.ts:30-37` — `cursorId` is parsed but never referenced in the where clause
- **Location:** `app/api/attempts/route.ts`

## Proposed Solutions

### Solution A: Add compound cursor with id tiebreaker (Recommended)
- Change where clause to: `OR: [{ completedAt: { lt: cursorDate } }, { completedAt: cursorDate, id: { lt: cursorId } }]`
- Add `id: "desc"` as secondary orderBy
- **Effort:** Small (15 min)
- **Risk:** Low

### Solution B: Use offset pagination for hackathon
- Replace cursor with simple `skip/take`
- Simpler but less performant at scale
- **Effort:** Small (10 min)
- **Risk:** Low (acceptable for hackathon scale)

## Recommended Action

Solution A — compound cursor is already half-implemented, just needs the where clause fix.

## Technical Details

- **Affected files:** `app/api/attempts/route.ts`
- **Components:** AttemptHistory pagination, profile page

## Acceptance Criteria

- [ ] Cursor query uses both `completedAt` AND `id` for filtering
- [ ] Records with identical timestamps are not skipped
- [ ] Pagination returns consistent, non-overlapping pages

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-02-12 | Created from PR #4 review | 3 agents flagged independently |

## Resources

- PR: https://github.com/poojitha-rachuri/praxel-arena/pull/4
