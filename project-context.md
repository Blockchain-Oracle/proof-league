# Project Context — Proof League (implementation repository)

Proof League: a living on-chain prediction league where real events are the matches, Calls are the
plays, accepted Picks become personal collectible Cards, and Creditcoin's Attestcoin proof
verification is the referee. Creditcoin
BUIDL 2026 Fall entry (DoraHacks). Submission Sep 6, 2026 23:59 ET (hard); judging Sep 6 to 18,
fully unattended. Product bar: product, not demo.

## Current design gate — 2026-09-04

The first visual implementation of the live-event rebaseline was rejected by the owner and reverted.
It is negative evidence, not a starting design. The older dashboard treatment is still rejected too.
There is currently **no approved visual direction**.

The next authorized phase is independent product/interaction design, governed by
`.agents/ao/handoff/2026-09-04-proof-league-designer.md`. The designer must understand the complete
product, present materially different creative territories and stop for Abu's selection before any
production UI implementation. The live-event rebaseline remains authority for product objects,
interaction meaning, truth boundaries and completeness; it does not prescribe a finished screen.

## Authority order

1. Abu's 2026-09-04 live-event experience decision, recorded in
   `docs/planning/ux/LIVE-EVENT-EXPERIENCE-REBASELINE-2026-09-04.md`. It wins on product objects,
   information hierarchy, event-family interaction, Cards, visual direction, navigation, reveal,
   Streak visibility and proof disclosure. It explicitly rejects the current generic dark
   dashboard, probability-looking rows and palette constraints.
2. `docs/planning/ux/GAME-FIRST-FIDELITY-REBASELINE-2026-09-03.md` remains authority for compatible
   integrity and complete-flow requirements, but is superseded where it defines a public “Market
   Card,” preserves the previous palette or treats event families as one generic composition.
3. `docs/planning/ux/FULL-REFERENCE-UX-INVENTORY-2026-09-03.md` is the authoritative companion
   for complete flows, header/mobile navigation, onboarding, overlays, AI, Games, Cards, social,
   Settings, recovery, responsive behavior and micro-interactions. Reclassify its Market Card rows
   as Event tile/Stage behavior under the 2026-09-04 ontology.
4. The planning corpus at `/Users/abu/dev/hackathon/buidl-ctc` (canonical for requirements not
   changed by the two rebaselines; this repo carries read-only copies under
   `docs/planning/` and `docs/research/` for judges and offline reads).
5. `docs/planning/prd/prd.md` + `docs/planning/prd/fidelity-revision-2026-09-02.md`
   (revision wins on conflict) — FR-1..35, NFR-1..11.
6. `docs/planning/architecture/ARCHITECTURE-SPINE.md` + `FIDELITY-ARCHITECTURE-REVISION.md`
   (revision wins on conflict) — AD-1..36 — plus `CONVENTIONS.md`.
7. `docs/planning/ux/REFERENCE-DESIGN.md` + `PRODUCT-FLOWS.md` — flow detail only where the two
   newer rebaselines do not change hierarchy, navigation, interaction or visuals.
8. `docs/planning/epics.md` — 7 epics, 52 story slices; a requirements catalog, not a workflow.
9. Historical implementation plan: `/Users/abu/.claude/plans/temporal-fluttering-firefly.md`
   (delivery waves A..H; external gates G1..G6).

## Settled decisions (do not relitigate)

- Free-to-play points; no money, custody, order book, leverage or token. Cards are records,
  never tradable collectibles.
- The product is a living on-chain prediction league. Each admitted event becomes a family-specific
  stage: signal, draw, race, milestone, governance chamber, weekly allocation or network pulse. The
  human loop leads; Attestcoin is the referee beneath it.
- There is one user-facing Card: **Your Card**, created only after an accepted Pick and evolved
  through waiting, reveal, score and Streak. Public discovery objects are Event tiles/posters and
  Event Stages, never “Market Cards.”
- The existing black/cream/vermilion palette, generic percentage rows, proof ticker and universal
  card-shaped composition may be discarded. No old visual token is protected by fidelity.
- Pick distribution is crowd behavior, not odds, probability or price. It is secondary and should
  normally be revealed after commitment. Price charts are not the default for non-price events.
- Ways to play reuse admitted proof-settleable Markets. They do not create a second truth plane or
  imply that unsupported event families are live.
- Practice may replay already-settled admitted Markets without affecting the canonical record.
  Duel and non-event arcade remain explicit product/authority blockers; do not ship or silently
  erase them before their named decisions are made.
- The judge-facing protocol name is **Attestcoin Protocol**; tooling/imports stay `usc-*`.
- References (Yosuku, PIPS, Flicky, ZK Freighter and Masayume) are behavior/design baselines with
  **no license grant** — study only, no copied code or assets.
- Repo: public from day 1, MIT, conventional commits daily (NFR-7). Pick-set mirrors will
  commit to a dedicated data branch (AD-12).
- Stack pins re-verified 2026-09-02 (plan §7): Next 16.3.4, Tailwind 4.3.x, Privy 3.39.x
  (`verifyAccessToken` via `@privy-io/node`), viem 2.56.x, Drizzle 0.45.x exact (never the v1
  RC), Supabase new-format keys, AI SDK v7 (`Output.object`), OZ 5.1.0 exact, usc-contracts
  0.2.0 / usc-sdk 0.18.0, solc 0.8.28. Foundry confirmed at kickoff as the locally installed
  1.7.1 (supersedes the stale 1.2.3 planning pin; solc exactness is what matters and foundry.toml
  pins it).

## Current state

- Snapshot reviewed for the 2026-09-04 correction: `main` at
  `1cba3ee4e4f4b5fb310d4d30f1c45d6ff48b5c89` before the documentation change.
- The current dirty implementation contains useful domain/composer/navigation/Card-lifecycle work,
  but its visible product direction is rejected. Generic Event rows, probability-looking Pick
  distribution, proof-led hierarchy, universal dark containers and generic 4:5 receipts must not be
  treated as approved fidelity.
- Before further UI expansion, classify dirty work as salvageable infrastructure, reshaping work or
  discarded presentation. Preserve user work; never reset the checkout to this dated snapshot.
- Current registered recurring lineup contains one Lido daily rate-ratio APR Series sourced from
  Ethereum mainnet. Sepolia remains the Hosted Round source; Creditcoin CC3 is the proof/scoring
  chain. Do not describe this as a broad multi-chain catalogue.
- The next-agent handoff is `.agents/ao/handoff/2026-09-04-proof-league-designer.md`. It requires an
  independent design phase and owner approval before implementation.
- `FIDELITY-IMPLEMENTATION-HANDOFF.md` and the implementation prompts in
  `AI-AGENT-PROMPT-PACK.md` are paused at that design gate. They remain completeness and technical
  background; they are not current permission to write UI.
- Worker accounts: generated locally, funded by Abu via faucet; escrow key offline.
- Hosting (Vercel/Fly/Supabase/Privy) is available via local CLIs but live provisioning,
  deployment, transactions, publishing and submission still require explicit owner authority.
