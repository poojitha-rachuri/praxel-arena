---
title: "Phase 1e: Pages & Flows"
type: feat
date: 2026-02-11
depends_on: [00-foundation]
blocks: [06-integration]
owner: PAGES-FLOWS agent
estimated_time: 6-8 hours
hackathon_priority: CRITICAL (Demo 30% - the user journey)
---

# Phase 1e: Pages & Flows

**This agent wires everything together. The user journey IS the demo.**

## Files to Create/Edit

```
app/layout.tsx                              # Root: ClerkProvider + dark theme
app/page.tsx                                # Landing page
app/globals.css                             # Tailwind v4 config
app/(auth)/sign-in/[[...sign-in]]/page.tsx  # Clerk SignIn
app/(auth)/sign-up/[[...sign-up]]/page.tsx  # Clerk SignUp
app/onboarding/page.tsx                     # Career goals + skill intro
app/learn/page.tsx                          # Skill selection for LEARN
app/learn/[skillSlug]/[sprintId]/page.tsx   # Sprint runner (LEARN)
app/practice/page.tsx                       # Skill selection for PRACTICE
app/practice/[skillSlug]/[sprintId]/page.tsx # Sprint runner (PRACTICE)
app/compete/page.tsx                        # Duel lobby
app/compete/[duelId]/page.tsx               # Duel sprint runner
app/results/[attemptId]/page.tsx            # Score reveal + debrief
components/layout/
  Navbar.tsx                                # Top bar: logo + UserButton
  BottomNav.tsx                             # Mobile bottom tabs
  ModeSelector.tsx                          # Learn/Practice/Compete tabs
  SkillPicker.tsx                           # Skill selection grid
components/onboarding/
  CareerSelector.tsx                        # Pick 1-3 career goals
proxy.ts (or middleware.ts)                 # Clerk auth
```

## Page Specs

### Landing Page (app/page.tsx)
- Hero: "Where Business Skills Become Visible"
- 3-column feature grid: Learn / Practice / Compete
- CTA: "Get Started Free" -> sign-up
- If already signed in: redirect to /learn

### Onboarding (app/onboarding/page.tsx)
- Step 1: "Choose your career path" -> CareerSelector (pick 1-3)
- Step 2: "Here are your recommended skills" -> show mapped skills
- Step 3: "Let's start with [top skill]" -> CTA to first LEARN sprint
- Save career goals to DB via API
- Set `onboardingComplete: true`

### Learn Page (app/learn/page.tsx)
- SkillPicker grid showing all skills
- Each skill card shows: icon, name, # sprints available, progress
- Tap skill -> see available LEARN sprints -> tap to start

### Sprint Runner Page (app/learn/[skillSlug]/[sprintId]/page.tsx)
```tsx
// IMPORTANT: Next.js 16 async params
export default async function LearnSprintPage({
  params,
}: {
  params: Promise<{ skillSlug: string; sprintId: string }>;
}) {
  const { skillSlug, sprintId } = await params;
  // Fetch sprint from API
  // Render SprintRunner client component
}
```
- Fetches sprint from `/api/sprints`
- Passes to SprintRunner (from Interaction Engine)
- On complete: POST to `/api/evaluate`, redirect to results

### Results Page (app/results/[attemptId]/page.tsx)
- Animated score reveal (counting up 0 -> actual)
- RadarChart showing 6 dimensions
- AI debrief text (mentorship feedback)
- "Highlights" and "Improvements" lists
- CTA: "Try another sprint" or "View Profile"

### Compete Page (app/compete/page.tsx)
- "Create Duel" button for each skill
- List of open duels user can join
- Active duels showing status
- Completed duels showing results

### Duel Page (app/compete/[duelId]/page.tsx)
- If waiting for opponent: show waiting state
- If in progress: show SprintRunner
- If evaluating: show loading with "AI analyzing..."
- If complete: show MatchResult

### Layout
- BottomNav: 4 tabs with icons (Learn, Practice, Compete, Profile)
- Navbar: logo left, UserButton right
- Mobile: bottom nav, no sidebar
- Desktop: keep bottom nav or sidebar (mobile-first, desktop acceptable)

## Routing Protection
- proxy.ts/middleware.ts protects all routes except:
  - `/` (landing)
  - `/sign-in`, `/sign-up`
  - `/profile/[userId]` (public profiles)
  - `/leaderboard`
  - `/api/webhooks/*`
- Redirect to `/onboarding` if `onboardingComplete` is false

## Done When
- [ ] Landing page renders with CTA
- [ ] Sign up/sign in flow works via Clerk
- [ ] Onboarding saves career goals and redirects to first sprint
- [ ] Learn flow: skill select -> sprint -> results (end to end)
- [ ] Practice flow: same but with practice pool
- [ ] Compete flow: create duel -> wait -> complete -> results
- [ ] Results page shows animated scores + AI debrief
- [ ] BottomNav navigates between all sections
- [ ] Incomplete onboarding users redirected
