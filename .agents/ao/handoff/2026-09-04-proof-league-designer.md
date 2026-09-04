# Proof League — independent product-design handoff

Status: design reset; no visual direction is approved

Owner: Abu / [Blockchain Oracle](https://github.com/Blockchain-Oracle)

Public repository: [Blockchain-Oracle/proof-league](https://github.com/Blockchain-Oracle/proof-league)

Decision date: 2026-09-04

## Copy-paste prompt for the next designer

```text
You are the senior product and interaction designer for Proof League. Your task is to understand the
entire product and creatively design how the game should work and feel. This is a design task, not an
implementation task. Do not edit production code, deploy, submit transactions, or treat an existing
screen as approved.

Start by reading this handoff completely. Then read every mandatory authority, UX, architecture,
product, operational, and research document linked below. Inspect the current repository and its Git
history. Distinguish product truth from old visual opinions, planned scope, dirty implementation, and
runtime-proven behavior.

The owner rejected the first visual interpretation of the 2026-09-04 live-event rebaseline. It was
reverted. Do not reproduce its monochrome signal chamber, oversized sparse typography, generic
apparatus, or four-item shell. Do not preserve the older black dashboard either. Both are negative
evidence. There is currently no approved visual design.

Design independently from the product model. Be imaginative about composition, color, typography,
motion, illustration, sound cues, spatial behavior, anticipation, reveal, and collectible identity.
The constraints protect product meaning and data truth; they do not prescribe an aesthetic.

Present at least three materially different creative territories before selecting a recommendation.
For each territory, show the complete real Lido Yield Signal journey on desktop and mobile:
Event discovery -> Event Stage -> choose one band -> choose free points -> auth/sign boundary ->
accepted personal Card -> meaningful wait -> proof-confirmed reveal -> score/Streak/rank consequence
-> deliberate share -> next Event. Show loading, empty, refusal, retry, confirmation-unknown, voided,
stuck, correct, incorrect, and share-failure states honestly.

Only the Player-owned artifact created after an accepted Pick is called a Card. Public discovery uses
an Event tile/poster; play uses a family-specific Event Stage; proof is progressively disclosed from
the exact Event or Card. Crowd Picks are counts of committed choices, never odds, prices,
probabilities, forecasts, or percentage-bar persuasion.

Yield signals, block draws, pool races, milestones, governance, and weekly allocations must not be
the same template with different labels. The first build candidate is the real admitted Lido Yield
Signal. Uniswap/Aave-inspired families remain concept-only until their decoder and admission truth
exist. Do not advertise them as live.

Deliver a design decision package, not code: three territories, rationale, information architecture,
full Lido flow, responsive layouts, state matrix, components, tokens, interaction specifications,
motion storyboards/GIFs, accessibility notes, asset/license provenance, and a candid list of product
questions. End with a single recommended direction and the tradeoffs. Stop for Abu's visual approval
before implementation.
```

## What happened and what is true now

The owner rejected two different visual directions:

1. The earlier dark crypto-dashboard, percentage-row, proof-ticker, generic receipt treatment.
2. The first implementation derived from the live-event rebaseline: a stark monochrome signal
   chamber with oversized sparse typography and a simplified Play/Events/League/Record shell.

The second implementation was never committed and has been removed. The working tree was returned
to the precise dirty state that existed before it. That earlier dirty work contains useful state,
composer, projection, navigation, and Card-lifecycle foundations, but its presentation is not an
approved design.

The 2026-09-04 live-event rebaseline remains product and interaction authority. It defines the
objects, hierarchy, truth boundaries, event families, and complete human loop. It is not a finished
screen design and should not be treated as one.

## Product in plain language

Proof League is a free-points prediction league where real on-chain events are the matches and
Creditcoin Attestcoin proof is the referee. A Player makes a Call before the answer exists. An
accepted Pick becomes a personal collectible Card. The same Card carries the Player through waiting,
proof-confirmed reveal, score, Streak, rank, and deliberate sharing.

Proof is essential but subordinate. It answers “why should I trust this result?” from the exact Event
or Card. It should not make the opening experience feel like an explorer, receipt viewer, or operator
console.

Money mechanics are excluded: no wallet balance as stakes, custody, odds, market prices, order book,
leverage, tradable Cards, or speculative payout language.

## Non-negotiable product semantics

- Event tile/poster: public discovery object.
- Event Stage: the family-specific place where a person understands and makes a Call.
- Pick: signed choice plus free-point commitment through the one canonical intake path.
- Card: only the Player-owned artifact created after acceptance.
- Proof receipt: exact technical evidence attached to its Event/Card and progressively disclosed.
- Crowd Picks: post-commit counts only; never probability, odds, price, or forecasting advice.
- Result, score, Streak, and rank: never optimistic; render only from canonical truth.
- Authentication: requested at the authority boundary, with the exact draft restored afterwards.
- Confirmation unknown: persistent and idempotent; never invite a duplicate write.
- Private by default: no Pick or Card is published without a deliberate Player action.

## Creative freedom

The designer owns the visual concept. Color, typography, density, navigation expression, spatial
model, illustration, sound, haptics, transitions, and the metaphor for each event family are open.
Do not default to either rejected direction. A territory must be visually and emotionally coherent,
not a collage of reference products.

References are behavior evidence, not visual templates and not a license grant:

- Yosuku: human hierarchy, action proximity, personal artifact, share intent.
- PIPS: dedicated game instrument and one dominant action.
- Flicky: waiting cadence, reveal drama, and outcome continuity.
- ZK Freighter: persistent refusal/retry/confirmation-unknown recovery.
- Masayume: honest distinction between live, planned, blocked, and unavailable modes.

Study those behaviors. Do not copy source, branding, art, UI assets, or layouts.

## First design target: the real Lido loop

The first end-to-end design must use the admitted Lido daily staking-rate Event, its real five ordered
bands, free points, canonical signing/intake, accepted Card, proof wait, reveal, score/Streak/rank,
share, and next-Event continuation. Do not fill gaps with fake values.

The design should answer, without relying on explanatory documentation:

- What am I predicting?
- What are the possible outcomes?
- Why are these bands ordered?
- When does my choice lock?
- What do free points mean?
- What exactly am I signing?
- Did Proof League accept my Pick?
- Where is my Card, and is it private or public?
- What is happening while I wait?
- What changed after the proven reveal?
- How can I inspect proof without losing the game moment?
- What should I do next?

## Required creative territories

Produce at least three genuinely different systems. Naming is up to the designer. They must differ in
interaction metaphor, density, motion language, collectible treatment, and navigation—not merely in
color.

For every territory provide:

1. One-sentence concept and emotional goal.
2. Event discovery, complete Lido Stage, accepted Card, waiting Card, revealed Card, League, Record,
   and deliberate-share surfaces.
3. Desktop 1440x1000, compact desktop/tablet 1024x768, mobile 390x844, and mobile 360x800.
4. Light/dark strategy only if both are truly part of the concept; do not force two themes as a
   checkbox if a stronger accessible single-theme art direction is recommended.
5. Keyboard, focus, reduced-motion, contrast, safe-area, loading, empty, stale, failure, and recovery
   behavior.
6. What is deliberately absent and why.
7. Asset and font provenance with commercial-use/licensing notes.

## Motion and GIF storyboard prompts

These prompts are starting briefs. Rewrite them to match the selected territory; do not let a media
model choose the product design.

### GIF 1 — discovery becomes play

```text
Create a 6–8 second seamless product-motion study for Proof League. Begin on a public Lido Event
tile/poster and transition into its full Event Stage without turning the tile into a generic card.
Preserve the exact event identity, question, lock state, and five ordered outcome bands. Make the
transition explain spatially that discovery has become play. No odds, prices, percentage bars, fake
metrics, crypto-dashboard styling, or technical proof hero. End with the Stage ready for one human
choice. Use the approved design territory's typography, color, materials, and motion language.
```

### GIF 2 — accepted Pick becomes Your Card

```text
Create an 8–10 second interaction storyboard for Proof League. Show one Lido band selected, free
points chosen, the auth/sign authority boundary, a truthful submitting state, and an accepted Pick
becoming the Player's personal Card. The Card must visibly inherit the exact Event and choice while
becoming a distinct owned artifact. Show that it is private by default. Do not show a Card before
acceptance, invent a balance, fabricate a score, imply money, or use an automatic publish action.
Include a persistent refusal or confirmation-unknown alternative frame using the same visual system.
```

### GIF 3 — wait, proven reveal, consequence, share

```text
Create a 10–12 second Proof League lifecycle study using the same personal Lido Card. Move from a
meaningful locked/awaiting-proof ritual into a proof-confirmed reveal, then show the real score,
Streak, and rank consequence and an optional deliberate share action. The Card remains the same
artifact throughout. Proof details stay one progressive-disclosure action away from the exact Card.
Avoid fake progress bars, fake timestamps, confetti without informational consequence, financial
language, and automatic publication. Include reduced-motion behavior in the annotations.
```

## Design deliverables and approval gate

The designer should return:

- a complete authority reconciliation, separating product truth from visual freedom;
- three territories and one reasoned recommendation;
- a clickable or frame-by-frame prototype of the complete Lido loop;
- responsive and state coverage, including recovery paths;
- event-family differentiation sketches for Yield Signal, Block Draw, and Pool Race, clearly marked
  real versus concept-only;
- personal Card lifecycle, private/public behavior, reveal, score/Streak/rank, and share;
- component, token, typography, motion, sound, and asset guidance;
- GIF/video storyboards and exported previews;
- implementation handoff only after Abu selects a direction.

No production UI implementation is authorized by this artifact. Abu's explicit approval of a visual
territory is the next gate.

## Mandatory reading order

Read these completely before designing:

1. [project-context.md](https://github.com/Blockchain-Oracle/proof-league/blob/main/project-context.md)
2. [LIVE-EVENT-EXPERIENCE-REBASELINE-2026-09-04.md](https://github.com/Blockchain-Oracle/proof-league/blob/main/docs/planning/ux/LIVE-EVENT-EXPERIENCE-REBASELINE-2026-09-04.md)
3. [GAME-FIRST-FIDELITY-REBASELINE-2026-09-03.md](https://github.com/Blockchain-Oracle/proof-league/blob/main/docs/planning/ux/GAME-FIRST-FIDELITY-REBASELINE-2026-09-03.md)
4. [FULL-REFERENCE-UX-INVENTORY-2026-09-03.md](https://github.com/Blockchain-Oracle/proof-league/blob/main/docs/planning/ux/FULL-REFERENCE-UX-INVENTORY-2026-09-03.md)
5. [PRODUCT-FLOWS.md](https://github.com/Blockchain-Oracle/proof-league/blob/main/docs/planning/ux/PRODUCT-FLOWS.md)
6. [REFERENCE-DESIGN.md](https://github.com/Blockchain-Oracle/proof-league/blob/main/docs/planning/ux/REFERENCE-DESIGN.md) — historical where superseded.
7. [prd.md](https://github.com/Blockchain-Oracle/proof-league/blob/main/docs/planning/prd/prd.md)
8. [fidelity-revision-2026-09-02.md](https://github.com/Blockchain-Oracle/proof-league/blob/main/docs/planning/prd/fidelity-revision-2026-09-02.md)
9. [ARCHITECTURE-SPINE.md](https://github.com/Blockchain-Oracle/proof-league/blob/main/docs/planning/architecture/ARCHITECTURE-SPINE.md)
10. [FIDELITY-ARCHITECTURE-REVISION.md](https://github.com/Blockchain-Oracle/proof-league/blob/main/docs/planning/architecture/FIDELITY-ARCHITECTURE-REVISION.md)
11. [CONVENTIONS.md](https://github.com/Blockchain-Oracle/proof-league/blob/main/docs/planning/architecture/CONVENTIONS.md)
12. [epics.md](https://github.com/Blockchain-Oracle/proof-league/blob/main/docs/planning/epics.md)
13. [AUTHORITY-AND-PARITY.md](https://github.com/Blockchain-Oracle/proof-league/blob/main/docs/research/reference-fidelity-2026-09-02/AUTHORITY-AND-PARITY.md)
14. [SOMNIA-MASAYUME-SUPPLEMENTAL-AUDIT.md](https://github.com/Blockchain-Oracle/proof-league/blob/main/docs/research/reference-fidelity-2026-09-02/SOMNIA-MASAYUME-SUPPLEMENTAL-AUDIT.md)
15. [README.md](https://github.com/Blockchain-Oracle/proof-league/blob/main/README.md), [launch-lineup.md](https://github.com/Blockchain-Oracle/proof-league/blob/main/docs/launch-lineup.md), and [verify-evidence.md](https://github.com/Blockchain-Oracle/proof-league/blob/main/docs/verify-evidence.md)

The current [AI agent prompt pack](https://github.com/Blockchain-Oracle/proof-league/blob/main/AI-AGENT-PROMPT-PACK.md)
and [implementation handoff](https://github.com/Blockchain-Oracle/proof-league/blob/main/FIDELITY-IMPLEMENTATION-HANDOFF.md)
are paused at the design gate. They remain background for completeness and implementation truth, not
permission to code before approval.

## Complete Markdown index

The repository contains more detailed research and operations material. Read all of it when making a
claim in its domain:

- [Root and planning documents](https://github.com/Blockchain-Oracle/proof-league/tree/main)
- [UX planning](https://github.com/Blockchain-Oracle/proof-league/tree/main/docs/planning/ux)
- [Architecture planning](https://github.com/Blockchain-Oracle/proof-league/tree/main/docs/planning/architecture)
- [PRD planning](https://github.com/Blockchain-Oracle/proof-league/tree/main/docs/planning/prd)
- [Research corpus](https://github.com/Blockchain-Oracle/proof-league/tree/main/docs/research)
- [Operational documentation](https://github.com/Blockchain-Oracle/proof-league/tree/main/docs)
- [Shared database documentation](https://github.com/Blockchain-Oracle/proof-league/blob/main/packages/shared/db/README.md)
- [Pick-set documentation](https://github.com/Blockchain-Oracle/proof-league/blob/main/docs/pick-sets/README.md)

## Primary external sources

- [Lido contract documentation](https://docs.lido.fi/contracts/lido/)
- [Uniswap v4 core](https://github.com/Uniswap/v4-core/)
- [Aave Governance v3](https://github.com/aave-dao/aave-governance-v3)
- [Creditcoin](https://creditcoin.org/)

Uniswap and Aave are future-family research, not current admission evidence.

## Repository and Git safety

- Public repository: https://github.com/Blockchain-Oracle/proof-league
- Owner profile: https://github.com/Blockchain-Oracle
- Default branch: `main`
- Pre-handoff implementation baseline: `1cba3ee4e4f4b5fb310d4d30f1c45d6ff48b5c89`
- The checkout contains user-owned dirty and untracked work. Never reset, clean, or overwrite it.
- Do not create `AGENT.md`, `AGENTS.md`, `CLAUDE.md`, `CLOUD.md`, or spelling/case variants.
- Do not claim a design, runtime flow, decoder, admission, or deployment exists without an evidence
  path.
