# Finance Skills & Career Weight System

**Date:** 2026-02-12
**Status:** Brainstorm
**Author:** Pushpak + Claude

---

## What We're Building

Two changes to the skill/career system:

1. **Add 2 finance skills** — Financial Statement Analysis and Valuation — with full content pipeline (SKILL.md, topics, AI-generated sprints/interactions)
2. **Fix career-skill weighting** — Replace uniform `weight: 1.0` on all `SkillCareerMap` entries with differentiated weights reflecting real-world importance

No new career outcomes. The 2 new skills map to existing careers (Consulting, Founder, Biz Ops, etc.).

---

## Why This Approach

- **Finance is a glaring gap.** The platform targets business professionals but has zero dedicated finance content. Balance sheet literacy and valuation are foundational to Consulting, Founder, and Business Operations careers.
- **Equal weights produce meaningless career match scores.** A PM with 80% in Stakeholder Communication and 20% in Prioritization currently shows the same match as the reverse — but Prioritization is far more core to PM.
- **No new careers needed.** Finance skills naturally map to existing careers (Consulting heavily, Founder moderately, Biz Ops for financial analysis). Adding careers would dilute the onboarding UX.

---

## Key Decisions

### Decision 1: Two New Skills

| Skill | Slug | Icon | Description |
|---|---|---|---|
| Financial Statement Analysis | `financial-statement-analysis` | `📑` | Reading balance sheets, income statements, cash flow; ratios, working capital, profitability analysis |
| Valuation | `valuation` | `🏦` | DCF, comparable company analysis, precedent transactions, startup valuation methods |

### Decision 2: Topics (4 per skill)

**Financial Statement Analysis:**
1. `balance-sheet-fundamentals` — Assets, liabilities, equity, working capital, liquidity
2. `income-statement-profitability` — Revenue recognition, gross/operating margins, EBITDA
3. `cash-flow-analysis` — Operating/investing/financing activities, free cash flow, burn rate
4. `financial-ratio-analysis` — Liquidity, solvency, efficiency, and profitability ratios

**Valuation:**
1. `dcf-intrinsic-valuation` — Discount rates, terminal value, WACC, sensitivity analysis
2. `comparable-company-analysis` — Trading multiples, peer selection, benchmarking
3. `precedent-transactions` — M&A comps, control premiums, transaction analysis
4. `startup-growth-valuation` — VC methods, revenue multiples, TAM-based sizing

### Decision 3: Career-Skill Weight Matrix

Weights are relative (not percentages). The existing `career-match.ts` normalizes by dividing `sum(score * weight)` by `sum(weight)`, so relative weights work correctly.

Scale: 0.0 (not mapped) to 1.0 (core to career).

| Skill | PM | Consulting | Marketing | Founder | Growth | Sales Strategy | Biz Ops |
|---|---|---|---|---|---|---|---|
| Guesstimation | 0.3 | **1.0** | — | 0.8 | — | — | — |
| GTM Strategy | 0.6 | — | **1.0** | **0.9** | 0.7 | 0.5 | — |
| Pricing & Monetization | 0.5 | 0.6 | 0.4 | 0.8 | 0.5 | **1.0** | — |
| Data Interpretation | 0.8 | 0.8 | 0.5 | 0.5 | **1.0** | — | **1.0** |
| Prioritization | **1.0** | 0.7 | — | 0.7 | — | — | 0.8 |
| Stakeholder Communication | 0.7 | 0.8 | 0.7 | 0.5 | — | 0.8 | 0.4 |
| **Financial Statement Analysis** | 0.3 | 0.7 | — | 0.7 | 0.3 | 0.4 | 0.6 |
| **Valuation** | 0.2 | 0.6 | — | 0.6 | — | 0.3 | — |

**Rationale for key weightings:**
- **Consulting + Guesstimation = 1.0**: Case interviews are literally Fermi estimates
- **PM + Prioritization = 1.0**: The defining PM skill
- **Marketing + GTM = 1.0**: Marketing IS go-to-market
- **Founder gets everything**: Founders need breadth (8 of 8 skills mapped)
- **Growth + Data = 1.0**: Growth is data-driven optimization
- **Sales Strategy + Pricing = 1.0**: Pricing is the sales strategy lever
- **Biz Ops + Data = 1.0**: Operations runs on metrics
- **Consulting gets FSA 0.7 and Valuation 0.6**: Finance is core to consulting case work
- **Founder gets FSA 0.7 and Valuation 0.6**: Founders must read financials and understand valuations

### Decision 4: Content Pipeline

Each new skill needs:
- 1 `SKILL.md` file in `.claude/skills/` (AI content generation prompt)
- 4 topics added to `prisma/seed-data/topics.json`
- 12 sprints (4 topics x 3 sprints: learn-1, learn-2, practice-1)
- 96 interactions (12 sprints x 8 interactions each)
- Generated via `scripts/generate-content.ts --skill <slug>`

### Decision 5: Scoring Dimension Emphasis

Each skill emphasizes different scoring dimensions. For the new skills:

**Financial Statement Analysis:**
- Primary: `quantitativeReasoning` (0.30), `analyticalThinking` (0.25)
- Secondary: `decisionQuality` (0.20), `communicationClarity` (0.15)
- Tertiary: `strategicReasoning` (0.05), `creativeProblemSolving` (0.05)

**Valuation:**
- Primary: `quantitativeReasoning` (0.30), `strategicReasoning` (0.25)
- Secondary: `analyticalThinking` (0.20), `decisionQuality` (0.15)
- Tertiary: `creativeProblemSolving` (0.05), `communicationClarity` (0.05)

---

## Scope Summary

### What changes:
1. `prisma/seed.ts` — Add 2 skills to SKILLS array with career mappings
2. `prisma/seed.ts` — Update ALL existing skill career mappings with differentiated weights
3. `prisma/seed-data/topics.json` — Add 8 new topics (4 per skill)
4. `.claude/skills/financial-statement-analysis-master/SKILL.md` — New
5. `.claude/skills/valuation-master/SKILL.md` — New
6. `scripts/generate-content.ts` — Run for 2 new skills (produces 24 JSON seed files)
7. `prisma/seed-data/financial-statement-analysis/` — 12 sprint JSON files (generated)
8. `prisma/seed-data/valuation/` — 12 sprint JSON files (generated)
9. `prisma db seed` — Re-seed to apply weights + new content

### What doesn't change:
- No new career outcomes
- No schema migrations (Skill, SkillCareerMap, Topic models already support this)
- No UI changes (SkillAccordion, onboarding, mode pages all auto-discover from DB)
- No changes to `career-match.ts` (already handles variable weights)
- No changes to scoring dimensions list

---

## Open Questions

1. **Existing Guesstimation overlap**: The "Valuation & Investment Cases" topic under Guesstimation overlaps with the new Valuation skill. Should we keep it (different angle — estimation vs. formal valuation) or rename/refocus it?
2. **Content generation cost**: Each skill generates ~96 interactions via Claude API. Is budget a concern for running the pipeline twice?
3. **COMPETE sprints**: Should we add pre-cached COMPETE sprints for the new finance skills, or is the existing "NovaPay" duel enough for the demo?
