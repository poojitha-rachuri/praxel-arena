---
status: pending
priority: p2
issue_id: "037"
tags: [code-review, frontend, race-condition]
dependencies: []
---

# Double-Click "Show More" Appends Duplicate Attempts

## Problem Statement

In `AttemptHistory.tsx`, the `loadMore` callback uses `loading` state in its dependency array, but the `onClick` handler captures a stale closure where `loading` was `false`. On slow connections, double-clicking "Show More" fires two fetches with the same cursor, appending the same page of results twice. Users see duplicate attempt cards.

**Why it matters:** A user on 3G taps "Show More", nothing happens for 2s, they tap again — now they see 20 duplicate cards.

## Findings

- **Source:** julik-frontend-races-reviewer
- **Severity:** P2 - IMPORTANT
- **Evidence:** `components/profile/AttemptHistory.tsx:136-148` — `useCallback([cursor, loading])` with stale closure
- **Location:** `components/profile/AttemptHistory.tsx`

## Proposed Solutions

### Solution A: Use ref for in-flight guard + AbortController (Recommended)
```typescript
const loadingRef = useRef(false);
const abortRef = useRef<AbortController | null>(null);

const loadMore = useCallback(async () => {
  if (!cursor || loadingRef.current) return;
  loadingRef.current = true;
  setLoading(true);
  abortRef.current?.abort();
  const controller = new AbortController();
  abortRef.current = controller;
  try {
    const res = await fetch(
      `/api/attempts?limit=20&cursor=${encodeURIComponent(cursor)}`,
      { signal: controller.signal }
    );
    if (!res.ok) return;
    const data = await res.json();
    setAttempts((prev) => [...prev, ...data.attempts]);
    setCursor(data.nextCursor);
  } catch (err) {
    if ((err as Error).name === "AbortError") return;
  } finally {
    loadingRef.current = false;
    setLoading(false);
  }
}, [cursor]);
```
- **Effort:** Small (15 min)
- **Risk:** None

## Technical Details

- **Affected files:** `components/profile/AttemptHistory.tsx`

## Acceptance Criteria

- [ ] Double-clicking "Show More" does not produce duplicate cards
- [ ] AbortController cancels in-flight request on unmount
- [ ] `loading` removed from useCallback dependency array

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-02-12 | Created from PR #4 review | Frontend races reviewer flagged |

## Resources

- PR: https://github.com/poojitha-rachuri/praxel-arena/pull/4
