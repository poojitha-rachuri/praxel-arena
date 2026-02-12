---
status: pending
priority: p2
issue_id: "023"
tags: [code-review, frontend, error-handling]
dependencies: []
---

# ProgressCharts Fetch Doesn't Check res.ok

## Problem Statement

`ProgressCharts.tsx` calls `fetch(url).then(res => res.json())` without checking `res.ok`. If the API returns a 401 or 500, the response body (likely `{ error: "..." }`) is parsed as data, causing the chart to silently render garbage or crash.

**Why it matters:** Users see a broken chart with no error message instead of a helpful fallback.

## Findings

- **Source:** TypeScript reviewer
- **Severity:** P2 - IMPORTANT
- **Evidence:** `components/profile/ProgressCharts.tsx:101-103`
- **Location:** `components/profile/ProgressCharts.tsx`

## Proposed Solutions

### Solution A: Add res.ok guard (Recommended)
```typescript
fetch(url)
  .then((res) => {
    if (!res.ok) throw new Error(`Progress fetch failed: ${res.status}`);
    return res.json();
  })
```
- **Effort:** Small (5 min)
- **Risk:** None

## Technical Details

- **Affected files:** `components/profile/ProgressCharts.tsx`

## Acceptance Criteria

- [ ] Non-2xx responses throw and trigger the `.catch()` path
- [ ] Error state shows fallback message, not broken chart

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-02-12 | Created from PR #4 review | TypeScript reviewer flagged |

## Resources

- PR: https://github.com/poojitha-rachuri/praxel-arena/pull/4
