# Brainstorm: Expo Universal Mobile App

**Date:** 2026-02-14
**Status:** Decided
**Author:** Pushpak + Claude

---

## What We're Building

Migrate Praxel Arena from a Next.js 16 web app to an **Expo (React Native) universal app** that ships to iOS, Android, and web from a single codebase. The goal is full App Store / Play Store presence with native performance, push notifications, haptics, offline support, and a polished native UX — while maintaining one codebase and one team.

## Why This Approach

### Decision Context

| Factor | Answer |
|---|---|
| Primary goal | App Store presence + native capabilities + better UX |
| Timeline | 3+ months, dedicated effort |
| Code sharing | Critical — one codebase for all platforms |
| Web framework | Can change (willing to leave Next.js) |
| Migration style | Incremental / hybrid (keep web live during transition) |

### Why Expo Universal (Approach A) over alternatives

1. **vs. Capacitor (Approach B):** Capacitor wraps a WebView — animations, gestures, and overall feel have a performance ceiling. App Store reviewers also scrutinize thin WebView wrappers. Expo gives truly native rendering.

2. **vs. Monorepo split (Approach C):** Maintaining two UI codebases (Next.js + Expo) doubles feature shipping effort. With a 3+ month timeline and willingness to change the web framework, a full Expo migration avoids this ongoing tax.

3. **Expo's web target** has matured significantly. For an app-style product like Praxel Arena (not a content/SEO site), Expo web is a strong fit. SEO matters less here since content is behind auth.

## Key Decisions

### 1. Framework: Expo SDK 53+ with Expo Router v4

- File-based routing (familiar pattern from Next.js app directory)
- Layout routes, dynamic segments, typed routes
- Web support via `expo export:web` or `@expo/server` for SSR-lite
- EAS Build for App Store / Play Store submission
- OTA updates for JS-only changes (skip app review)

### 2. Animation: React Native Reanimated + Gesture Handler

Replace `motion` (framer-motion successor) with:
- `react-native-reanimated` for spring physics (can match stiffness: 300, damping: 25)
- `react-native-gesture-handler` for swipe cards, drag-to-reorder
- Runs on the UI thread (60fps guaranteed, unlike JS-driven web animations)

### 3. Auth: Clerk React Native SDK

- `@clerk/clerk-expo` — drop-in replacement for `@clerk/nextjs`
- Supports OAuth, magic links, phone OTP natively
- Token-based auth for API calls (replaces cookie-based web auth)

### 4. Backend: Keep existing API routes as standalone

- Extract API routes from Next.js into a standalone Express/Hono/Fastify server
- Or: Keep Next.js running purely as the API server during transition
- Prisma + PostgreSQL stays unchanged
- Railway deployment stays unchanged

### 5. UI Components: React Native Paper or Tamagui

Options for component library:
- **Tamagui**: Universal (web + native), Tailwind-like styling, good performance
- **React Native Paper**: Material Design 3, well-maintained
- **NativeWind v4**: Tailwind CSS for React Native (closest to current stack)
- **Recommendation**: NativeWind v4 — minimal mental model change from Tailwind v4

### 6. Charts: Victory Native or react-native-svg-charts

Replace `recharts` (HTML/SVG-based, web-only) with:
- `victory-native` — mature, similar API to recharts
- Radar chart for scoring dimensions needs custom implementation

### 7. Drag & Drop: Replace @dnd-kit

- `react-native-gesture-handler` + `react-native-reanimated` for RankAndPrioritize
- Or `react-native-draggable-flatlist` for sortable lists
- @dnd-kit is web-only

### 8. Voice (ElevenLabs): React Native SDK

- `elevenlabs-react-native` package exists
- WebSocket-based conversation works on native
- Battery/background state handling needed

### 9. Migration Strategy: Incremental / Hybrid

**Phase approach:**
1. **Scaffold Expo project** alongside existing Next.js app (monorepo)
2. **Extract shared logic** into `packages/shared` (types, scoring, API client, Zod schemas)
3. **Rebuild screens incrementally** in Expo, starting with highest-value flows
4. **Keep Next.js web live** during migration, serving existing users
5. **Switch web to Expo web** once all screens are migrated
6. **Decommission Next.js** app

**Screen migration priority (by user value):**
1. Sprint Runner (card swipe interactions) — the core experience
2. Skill selection + topic accordion
3. Profile + radar chart
4. Compete mode (duels)
5. AI Challenger (voice + chat)
6. Onboarding flow
7. Settings / secondary screens

## What We're NOT Building

- **Offline-first architecture** — Online-required is fine for v1; offline caching can come later
- **Custom native modules** — Stick to Expo-managed workflow (no bare React Native)
- **Tablet-optimized layouts** — Phone-first, tablet gets phone layout for v1
- **Web SSR/SEO** — App is behind auth; Expo's client-rendered web is sufficient

## Open Questions

1. **Backend extraction**: Should we extract API routes to a standalone server (Hono/Fastify) or keep Next.js running as the API during transition?
2. **NativeWind vs Tamagui**: NativeWind is closer to current Tailwind stack but Tamagui may perform better. Needs prototyping.
3. **Expo web quality**: Need to validate that Expo web output meets the current web app's visual quality (test with a prototype screen).
4. **App Store accounts**: Apple Developer ($99/yr) and Google Play Console ($25 one-time) — need to set up before first submission.
5. **CI/CD**: EAS Build for native, but how to handle web deployment? Expo export:web to Railway/Vercel?

## Library Migration Map

| Current (Next.js) | Replacement (Expo) |
|---|---|
| `next` (routing, SSR) | `expo-router` |
| `motion` (animations) | `react-native-reanimated` |
| `@clerk/nextjs` | `@clerk/clerk-expo` |
| `@dnd-kit/core` | `react-native-gesture-handler` + reanimated |
| `recharts` | `victory-native` |
| `next-themes` | `react-native` Appearance API + context |
| `tailwindcss` (v4 CSS) | `nativewind` v4 |
| `shadcn/ui` | Custom RN components or `gluestack-ui` |
| `@elevenlabs/react` | `elevenlabs-react-native` |
| `@ai-sdk/react` | Custom SSE client or `@ai-sdk/react-native` |
| `canvas-confetti` | `react-native-confetti-cannon` |

## Risk Assessment

| Risk | Impact | Mitigation |
|---|---|---|
| Expo web quality gap | High | Prototype one screen early; fallback to monorepo split if inadequate |
| Migration takes longer than expected | Medium | Incremental approach keeps web live; no deadline pressure |
| Library gaps (missing RN equivalents) | Medium | Identify all gaps in planning phase before committing |
| App Store rejection | Low | Expo apps are native, not WebView wrappers; follow guidelines |
| Team learning curve (React Native) | Medium | Expo abstracts most complexity; React knowledge transfers well |
