---
status: pending
priority: p2
issue_id: "025"
tags: [code-review, performance, bundle-size]
dependencies: []
---

# Lazy-Load ProgressCharts to Save ~200-300KB Bundle

## Problem Statement

`ProgressCharts` imports `recharts` (LineChart, XAxis, YAxis, Tooltip, ResponsiveContainer) which adds ~200-300KB to the client bundle. This component is only visible on the profile page when scrolled down, making it an ideal candidate for `next/dynamic` lazy loading.

**Why it matters:** Mobile users on slower connections pay the bundle cost upfront even if they never scroll to the charts section.

## Findings

- **Source:** Performance oracle
- **Severity:** P2 - IMPORTANT
- **Evidence:** `components/profile/ProgressCharts.tsx` imports 5 recharts components
- **Location:** `app/profile/ProfileClient.tsx` (import site)

## Proposed Solutions

### Solution A: next/dynamic with loading placeholder (Recommended)
```typescript
import dynamic from "next/dynamic";
const ProgressCharts = dynamic(
  () => import("@/components/profile/ProgressCharts"),
  {
    loading: () => (
      <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
        Loading progress...
      </div>
    ),
    ssr: false,
  }
);
```
- **Effort:** Small (5 min)
- **Risk:** None

## Technical Details

- **Affected files:** `app/profile/ProfileClient.tsx`

## Acceptance Criteria

- [ ] ProgressCharts loaded via `next/dynamic`
- [ ] Loading placeholder shown while chunk loads
- [ ] Bundle analyzer confirms recharts in separate chunk

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-02-12 | Created from PR #4 review | Performance oracle flagged |

## Resources

- PR: https://github.com/poojitha-rachuri/praxel-arena/pull/4
