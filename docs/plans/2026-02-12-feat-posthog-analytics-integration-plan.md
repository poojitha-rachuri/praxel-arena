---
title: "feat: PostHog Analytics Integration"
type: feat
date: 2026-02-12
---

# PostHog Analytics Integration

## Overview

Integrate PostHog Cloud analytics into Praxel Arena for full product analytics: funnel tracking, user engagement, retention, and behavioral insights. Currently **zero analytics** exist in the project. PostHog Cloud free tier (1M events/month) is the target, with both client-side (`posthog-js`) and server-side (`posthog-node`) capture.

## Problem Statement / Motivation

- No visibility into user behavior: we can't see funnels, drop-offs, or engagement patterns
- Rich server-side data exists in Prisma (SprintAttempt, XpTransaction, Duel) but no client-side behavioral tracking
- Sprint abandonment is invisible - users can exit mid-sprint with no record
- Can't measure mode popularity, feature engagement, or onboarding completion rates
- For hackathon demo: analytics dashboard provides concrete "impact" evidence (25% of judging)

## Proposed Solution

PostHog Cloud with dual-layer tracking:
- **Client-side** (`posthog-js` + `@posthog/react`): page views, UI interactions, user identification
- **Server-side** (`posthog-node`): API route events, evaluation completions, duel outcomes

## Technical Approach

### Phase 1: Core Setup (Priority)

#### 1.1 Install Dependencies

```bash
npm install posthog-js @posthog/react posthog-node
```

#### 1.2 Environment Variables

Add to `.env.example` and `.env.local`:

```bash
# PostHog Analytics (https://posthog.com)
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

Add to Railway environment variables for production.

#### 1.3 PostHog Provider (Client-Side)

Create `components/providers/PostHogProvider.tsx`:

```tsx
"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider, usePostHog } from "@posthog/react";
import { useEffect } from "react";
import { useAuth, useUser } from "@clerk/nextjs";

function PostHogIdentifier() {
  const { isSignedIn, userId } = useAuth();
  const { user } = useUser();
  const ph = usePostHog();

  useEffect(() => {
    if (isSignedIn && userId && ph) {
      ph.identify(userId, {
        email: user?.primaryEmailAddress?.emailAddress,
        name: user?.fullName,
      });
    } else if (!isSignedIn && ph) {
      ph.reset();
    }
  }, [isSignedIn, userId, user, ph]);

  return null;
}

export default function PostHogProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
        capture_pageview: true,
        capture_pageleave: true,
        person_profiles: "identified_only",
      });
    }
  }, []);

  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    return <>{children}</>;
  }

  return (
    <PHProvider client={posthog}>
      <PostHogIdentifier />
      {children}
    </PHProvider>
  );
}
```

#### 1.4 Add to Root Layout

Update `app/layout.tsx` - inject PostHogProvider inside body, wrapping ThemeProvider:

```tsx
import PostHogProvider from "@/components/providers/PostHogProvider";
// ...
<body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
  <PostHogProvider>
    <ThemeProvider>{children}</ThemeProvider>
  </PostHogProvider>
</body>
```

**Provider order**: ClerkProvider (auth) → PostHogProvider (analytics + identify) → ThemeProvider (UI)

#### 1.5 Server-Side PostHog Client

Create `lib/posthog.ts`:

```tsx
import { PostHog } from "posthog-node";

let posthogClient: PostHog | null = null;

export function getPostHogServer(): PostHog | null {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return null;

  if (!posthogClient) {
    posthogClient = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      flushAt: 1,
      flushInterval: 0,
    });
  }
  return posthogClient;
}
```

### Phase 2: Event Tracking

#### 2.1 Key Custom Events

| Event | Trigger Location | Properties |
|---|---|---|
| `sprint_started` | `SprintPageWrapper` on mount | `sprintId, skillSlug, mode, level` |
| `sprint_completed` | `SprintPageWrapper` on evaluation done | `sprintId, mode, totalScore, timeSpent` |
| `sprint_abandoned` | `SprintPageWrapper` exit dialog confirm | `sprintId, mode, progress (%)` |
| `interaction_answered` | `SprintRunner` per card | `type, timeSpent, isCorrect, cardIndex` |
| `duel_queued` | `/api/duels` POST | `skillSlug` |
| `duel_completed` | `/api/evaluate` duel path | `duelId, winnerId, eloChange` |
| `mode_selected` | `BottomNav` tap | `mode` |
| `onboarding_completed` | Onboarding page submit | `careerGoals[]` |
| `credential_earned` | `lib/gamification/credentials.ts` | `credentialType, skillSlug` |
| `challenge_attempted` | `/api/challenges/[id]/attempt` | `challengeId, score` |
| `leaderboard_viewed` | Leaderboard page mount | `filter` |
| `profile_viewed` | Profile page mount | `isOwnProfile` |

#### 2.2 Client-Side Event Helper

Create `lib/analytics.ts`:

```tsx
import posthog from "posthog-js";

export function trackEvent(event: string, properties?: Record<string, unknown>) {
  if (typeof window !== "undefined" && posthog.__loaded) {
    posthog.capture(event, properties);
  }
}
```

#### 2.3 Server-Side Event Capture

Add to key API routes (evaluate, duels, challenges):

```tsx
import { getPostHogServer } from "@/lib/posthog";

// Inside route handler, after successful operation:
const ph = getPostHogServer();
ph?.capture({
  distinctId: user.clerkId,
  event: "sprint_completed",
  properties: { sprintId, mode, totalScore },
});
```

### Phase 3: Integration Points

#### 3.1 Sprint Lifecycle (Highest Value)

**File**: `components/layout/SprintPageWrapper.tsx`
- `sprint_started`: fire on component mount
- `sprint_abandoned`: fire in exit dialog confirmation (line ~43-46)
- `sprint_completed`: fire when evaluation succeeds

**File**: `components/interactions/SprintRunner.tsx`
- `interaction_answered`: fire per card submission with type, timing, correctness

#### 3.2 Navigation & Engagement

**File**: `components/layout/BottomNav.tsx`
- `mode_selected`: fire on nav tap with destination mode

**File**: `app/onboarding/page.tsx`
- `onboarding_completed`: fire on career goal submission

#### 3.3 Server-Side Critical Events

**File**: `app/api/evaluate/route.ts`
- `sprint_evaluated`: after scoring completes (captures server-side score + AI model used)
- `duel_completed`: in the duel update block (~line 249)

**File**: `lib/gamification/credentials.ts`
- `credential_earned`: after credential grant

## Acceptance Criteria

### Functional Requirements

- [x] PostHog provider initializes on app load (no errors in console)
- [x] Page views auto-captured for all 17 routes
- [x] Authenticated users identified with Clerk userId
- [x] `sprint_started`, `sprint_completed`, `sprint_abandoned` events fire correctly
- [x] `interaction_answered` fires per card with timing data
- [x] Server-side events captured for evaluate + duel completion
- [x] No analytics errors when `NEXT_PUBLIC_POSTHOG_KEY` is unset (graceful no-op)
- [x] `.env.example` updated with PostHog variables

### Non-Functional Requirements

- [x] Analytics init does not block page render (useEffect, not sync)
- [x] No PII beyond email in PostHog events (no passwords, no raw answers)
- [x] Bundle size impact < 30KB gzipped (posthog-js is ~25KB)

## Dependencies & Risks

| Risk | Mitigation |
|---|---|
| PostHog Cloud rate limit (1M events/month free) | `person_profiles: "identified_only"` reduces anonymous event volume; `interaction_answered` is the highest-volume event - consider sampling if needed |
| React 19 compatibility | PostHog React SDK uses standard hooks, should work fine. Verify on install. |
| Turbopack bundling issues | posthog-js is a standard npm package, no known Turbopack issues |
| Analytics blocking page render | All init in `useEffect`, PostHogProvider returns children immediately |
| Missing env vars in Railway | Add to Railway dashboard; graceful no-op when unset |

## Files to Create/Modify

| File | Action | Description |
|---|---|---|
| `components/providers/PostHogProvider.tsx` | **Create** | Client-side PostHog init + Clerk user identification |
| `lib/posthog.ts` | **Create** | Server-side PostHog client singleton |
| `lib/analytics.ts` | **Create** | Client-side event tracking helper |
| `app/layout.tsx` | **Modify** | Add PostHogProvider to provider chain |
| `.env.example` | **Modify** | Add PostHog env vars |
| `components/layout/SprintPageWrapper.tsx` | **Modify** | Add sprint lifecycle events |
| `components/interactions/SprintRunner.tsx` | **Modify** | Add per-interaction event |
| `components/layout/BottomNav.tsx` | **Modify** | Add mode_selected event |
| `app/api/evaluate/route.ts` | **Modify** | Add server-side sprint_evaluated event |
| `lib/gamification/credentials.ts` | **Modify** | Add credential_earned event |
| `app/onboarding/page.tsx` | **Modify** | Add onboarding_completed event |

## Success Metrics

Once live, verify in PostHog dashboard:
- Page view events appearing for all routes
- User identification linking to Clerk userIds
- Sprint funnel visible: started → completed (vs abandoned)
- Custom events appearing with correct properties

## References

- [PostHog Next.js App Router Docs](https://posthog.com/docs/libraries/next-js)
- [PostHog Node SDK](https://posthog.com/docs/libraries/node)
- Provider pattern: `components/providers/ThemeProvider.tsx` (existing)
- Auth pattern: `lib/auth/ensure-user.ts` (Clerk userId extraction)
- Sprint lifecycle: `components/layout/SprintPageWrapper.tsx`
- Evaluation: `app/api/evaluate/route.ts`
