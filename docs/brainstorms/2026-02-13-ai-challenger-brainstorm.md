# AI Challenger - Brainstorm

**Date**: 2026-02-13
**Status**: Draft
**Author**: Pushpak + Claude

## What We're Building

**AI Challenger** - a real-time conversational AI layer that pushes back on your thinking, turning passive quiz-taking into active skill-building.

### The Problem

The current flow (answer questions, get graded) works but is fundamentally pre-AI. Users never *feel* the AI. It generates content and evaluates behind the scenes, but the experience could theoretically run on static question banks. There's no "aha" moment where AI does something impossible without it.

### The Solution

A unified conversational component where AI directly engages users in real-time adaptive dialogue. It cross-examines weak answers, challenges assumptions, and builds business judgment muscle - not just knowledge recall.

**Two trigger points:**

1. **Post-Sprint Debrief** (60-90 seconds, skippable)
   - Fires after completing any sprint (Learn/Practice/Compete)
   - AI picks the user's weakest 1-2 answers
   - Quick, focused cross-examination: "You chose to cut marketing. But your competitor just launched. Now what?"
   - 3-4 text exchanges max
   - Always optional - user can skip to see score

2. **Standalone Challenge Mode** (up to 2 minutes)
   - A 4th mode alongside Learn/Practice/Compete
   - User picks a skill and challenge type
   - Deeper, richer AI conversation
   - Three challenge types (see below)

### Challenge Types (Standalone Mode)

| Type | Vibe | Example | Best For |
|---|---|---|---|
| **Mock Interview** | AI plays interviewer | "Walk me through how you'd price this SaaS product for enterprise." | Career prep, structured thinking |
| **Scenario Drill** | Pressure-cooker with escalating twists | "You're the PM. Launch moved up 2 weeks. Now the designer quit. Now what?" | Decision-making under pressure |
| **Socratic Coaching** | Probing questions to deepen thinking | "Why that approach? What assumptions are you making? What if X changed?" | Deep learning, self-awareness |

All three types work across all 8 skills. The AI's persona and challenge style adapt per skill domain:

- **GTM / Product Strategy** - Strategic debate, market dynamics
- **Data Interpretation / Pricing** - Quantitative reasoning, estimation
- **Stakeholder Communication** - Explaining under pressure, persuasion
- **Finance skills** - Financial modeling assumptions, risk analysis

### Input Modes

- **Text chat (default)**: Real-time streaming text. Fast, reliable, works everywhere.
- **ElevenLabs Voice Agent (optional toggle)**: Full conversational voice via ElevenLabs Conversational AI SDK. User speaks naturally, AI responds with voice. Strict time limit enforced. Not DIY STT+TTS - uses ElevenLabs' integrated voice agent pipeline.

Voice is a toggle, not a separate experience. Same AI context, same challenge logic, different I/O layer.

## Why This Approach

1. **Unified component**: One `<AIChallenger>` adapts to all contexts (post-sprint, standalone), all challenge types, all skills. DRY, maintainable, consistent UX.

2. **Text-first, voice-optional**: Text is the reliable backbone for demo and daily use. Voice is the "wow" layer that showcases AI depth without risking demo reliability.

3. **Impossible without AI**: Real-time adaptive cross-examination that references your specific answers and pushes back with domain-relevant counterarguments. This cannot exist without a powerful language model.

4. **Builds muscle, not memory**: Static questions test recall. AI Challenger builds judgment by forcing you to defend, adapt, and think on your feet under time pressure.

5. **Hackathon alignment**: Maximizes "Opus 4.6 Use" (25% of judging) by making AI visible and central. The AI isn't behind the scenes - it's in your face, challenging you.

## Key Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Architecture | Unified component | DRY, one streaming pattern, consistent UX across triggers |
| Default input | Text chat | Reliable, fast, no external API dependency for core experience |
| Voice option | ElevenLabs Voice Agent | Integrated pipeline (not DIY STT+TTS), low integration complexity |
| Post-sprint depth | Weakest 1-2 answers only | Focused, fast, respects user's time |
| Post-sprint obligation | Always skippable | Don't force it - some users just want scores |
| Standalone types | All 3 (interview, drill, socratic) | Different skills and users benefit from different challenge styles |
| Time limits | 60-90s post-sprint, 2min standalone | Quick micro-interactions aligned with platform philosophy |
| Cross-skill | AI persona adapts per skill | Same component, different AI behavior based on skill domain |
| Scoring | Same 6-dimension system | Consistency with existing platform, but also captures reasoning quality |

## Open Questions

1. **ElevenLabs Voice Agent setup**: What agent configuration is needed? Custom LLM (Claude) as brain vs. ElevenLabs' built-in LLM? Need to research their Conversational AI SDK.

2. **Streaming architecture**: Use SSE from Next.js API route? Or direct Claude streaming SDK on the client? Need to decide server-side vs client-side streaming.

3. **Post-sprint flow**: Does the debrief panel appear on the results page, or is it a separate screen? How does "skip" work visually?

4. **Challenge mode navigation**: Is it a top-level tab in the bottom nav? Or nested under each skill?

5. **Scoring integration**: Should AI Challenger responses feed into the 6-dimension score? Or is it a separate "reasoning quality" metric?

6. **Demo strategy**: Should we pre-cache some challenger conversations for demo safety? Or is streaming reliable enough?

7. **Rate limiting**: How many AI Challenger sessions per hour? This uses more tokens than static evaluation.

## Hackathon Impact Assessment

| Judging Criteria | Weight | Impact |
|---|---|---|
| **Demo** | 30% | HIGH - Live AI conversation is the most compelling demo moment |
| **Impact** | 25% | HIGH - Transforms passive testing into active skill building |
| **Opus 4.6 Use** | 25% | VERY HIGH - AI is visible, central, and impossible without it |
| **Depth** | 20% | HIGH - Three challenge types + voice + cross-skill adaptation |

**Estimated combined boost**: This feature alone could be the difference between "nice quiz app" and "this is the future of skill assessment."
