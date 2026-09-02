# Addendum — Proof League PRD

Depth for downstream phases. The brief's addendum (`briefs/brief-buidl-ctc-2026-08-23/addendum.md`) already holds the settlement specifics (market-by-market event signatures, Snapshot Keeper design rules, pinned dependencies, day-1 spike detail, rejected alternatives). This file adds only what the PRD created.

## Scoring model — rationale and math

**Chosen:** Payout is **gross**: a correct Pick returns `stake × N` in total (N = number of Outcome Options), so the net gain is `stake × (N−1)`; an incorrect Pick returns zero. EV check: a Player picking at random has expected return `N options × (1/N chance) × (stake × N payout) = stake` — exactly break-even on every Market shape, so no Market is secretly better to farm and skill is the only edge. Legible in one sentence; no odds-making, no liquidity.
**Considered and parked:** pari-mutuel points — Players who picked correctly split the stakes of those who did not; better game theory at scale, but the redistribution framing edges toward "positions against Players" and complicates the contract. Difficulty-weighted payouts (more for unpopular-but-correct options) — same revisit window, post-hackathon. Note: option count now doubles as the Payout multiplier, so Market design (bucket count) and scoring are coupled — PRD §11.2 handles them together.

## Pick commitment design (for architecture)

FR-9 commits Picks in batch at Lock Time. Default: merkle root over EIP-712 Player-signed Pick messages, full set of Picks published for verification (cheapest; provably not operator-invented). Alternative (costlier, maximally transparent): per-Pick on-chain records. Either satisfies FR-9's consequences.

## Settlement architecture notes (from review reconciliation)

- **Verify/decode and scoring are separate transactions** (PRD §4.4): the decode transaction respects the protocol's ~70%-of-block-gas decode ceiling; scoring runs in bounded batches sized from the day-1 gas-headroom measurement (FR-15). This avoids the unbounded-loop DoS class open in the vendor's example contracts.
- **Check 7 (prover-trust)** exists because the examples' `CreditScore.sol` accepts an arbitrary caller-supplied prover contract (USC-Builder-Examples issue #32); check 5 (replay) mirrors issue #33's queryId gap. Naming these two closures in the Integration Summary is deliberate.
- **Key on event signatures, never function ABIs** — the AccountingOracle selector changed in Lido V3 while `TokenRebased` did not (event-catalog research).
- **Recency floor:** the protocol skips very fresh source blocks; the Worker's submit-time budget in FR-12 already absorbs it, but don't schedule proofs at event-time + 0.
- **Source-chain seam:** Market config carries `chain` as data even though v1 is Ethereum-only — the "every new chain = new matches" vision (PRD §9) then needs no schema change.

## Market configuration data (per launch Market)

Each Market needs: question + plain-words explainer; Outcome Options + boundaries; Lock Time policy (incl. determinism horizon, FR-6.3); Source Event spec (chain, contract, event signature, subject filter, answer field or derivation); Payout N; void window; admission checklist file (FR-6). Source Event specs live in the brief addendum's catalog; Lido bucket boundaries and race-window calibration come from the pre-launch re-sample (PRD §11.2).

## Judging-window fallback narrative (NFR-4)

If live settlement misbehaves during evaluation: the transparency log + genuinely settled Markets with working proof links + the demo video are the fallback — **never seeded or fabricated data** (an earlier draft's "seeded demo data" was cut as contradicting NFR-1's honesty posture; rehearsal-period *real* play is what populates the league surfaces). The Hosted Round can be re-run end-to-end on demand within ~30 minutes (FR-21). The honest failure state is itself a trust demonstration.

## Deferred design notes

- **Creator surface (post-v1):** keep FR-21's Round-creation path data-driven so "operator creates a Round" can become "creator registers a settlement-event-compatible contract."
- **Nouns revival hook (post-v1):** if Nouns governance lowers the 2.8 ETH reserve and bidding returns, "the day bidding came back to Nouns" is a ready-made flagship market and story; leave the auction-settlement decoder in the catalog.
- **Card difficulty context:** FR-10 shows the Pick distribution at lock on the Card face — the cheap, honest proxy for "how hard was this call" (forged-idea's difficulty field) without a difficulty model.
- **Sybil options (post-v1, PRD §11.8):** proof-of-personhood gates, stake-to-enter seasons, pick-pattern anomaly detection.
- **Notifications:** out for v1; the noon ritual is the habit hypothesis. Revisit with real usage data.
