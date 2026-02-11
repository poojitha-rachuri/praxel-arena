# Praxel Arena - Build Plans

## Master Plan
- [`2026-02-11-feat-praxel-arena-full-build-plan.md`](./2026-02-11-feat-praxel-arena-full-build-plan.md) - The Bible. Full architecture, data model, stack corrections, all specs.

## Sub-Plans (Execute Independently)

Read the **Hackathon Strategy** first, then execute in order:

| # | Plan | Owner | Depends On | Est. Time | Priority |
|---|---|---|---|---|---|
| 00 | [Hackathon Strategy](./sub-plans/00-hackathon-strategy.md) | READ FIRST | - | - | Strategy |
| 00 | [Foundation Setup](./sub-plans/00-foundation-setup.md) | YOU (manual) | Nothing | 3-4h | TONIGHT |
| 01 | [Interaction Engine](./sub-plans/01-interaction-engine.md) | Agent | Phase 0 | 6-8h | CRITICAL |
| 02 | [AI Engine](./sub-plans/02-ai-engine.md) | Agent | Phase 0 | 4-6h | CRITICAL |
| 03 | [Data Backend](./sub-plans/03-data-backend.md) | Agent | Phase 0 | 4-6h | HIGH |
| 04 | [Skill Graph & Profile](./sub-plans/04-skillgraph-profile.md) | Agent | Phase 0 | 4-5h | HIGH |
| 05 | [Pages & Flows](./sub-plans/05-pages-flows.md) | Agent | Phase 0 | 6-8h | CRITICAL |
| 06 | [Integration](./sub-plans/06-integration.md) | All + YOU | 01-05 | 8-12h | CRITICAL |
| 07 | [Compete Mode + Polish](./sub-plans/07-compete-mode.md) | All + YOU | 06 | 12-16h | CRITICAL |
| 08 | [Demo & Submission](./sub-plans/08-demo-submission.md) | YOU | 07 | 4-6h | CRITICAL |

## Domain Expert Skills (Content Generation)

| Skill | Purpose | Commands |
|---|---|---|
| `/guesstimation-master` | Expert in Fermi estimates, market sizing, unit economics | `learn <theme>`, `practice`, `learn-all` |
| `/gtm-strategy-master` | Expert in product launches, channels, market entry | `learn <theme>`, `practice`, `learn-all` |
| `/prioritization-master` | Expert in RICE/ICE, tradeoffs, resource allocation | `learn <theme>`, `practice`, `learn-all` |

## Timeline

```
Feb 11 (Tonight):  Phase 0 + Content Generation
Feb 12:            Phases 01-05 in parallel (Agent Army)
Feb 13:            Phase 06 (Integration) -- Learn mode E2E by EOD
Feb 14:            Phase 07a (Compete Mode)
Feb 15:            Phase 07b (Polish) + Demo Prep
Feb 16:            Phase 08 (Demo + Submit) -- Deadline 3:00 PM EST
```

## Dependency Graph

```
Phase 0 (Foundation)
    |
    +---> Phase 01 (Interaction Engine) --+
    +---> Phase 02 (AI Engine) ----------+
    +---> Phase 03 (Data Backend) -------+--> Phase 06 (Integration)
    +---> Phase 04 (Skill Graph) --------+       |
    +---> Phase 05 (Pages & Flows) ------+       v
                                           Phase 07 (Compete + Polish)
                                                 |
                                                 v
                                           Phase 08 (Demo + Submit)
```
