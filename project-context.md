# Project Context — Proof League (implementation repository)

Proof League: a fantasy-style prediction league where real Ethereum events are the matches,
Picks are the plays, and Creditcoin's Attestcoin proof verification is the referee. Creditcoin
BUIDL 2026 Fall entry (DoraHacks). Submission Sep 6, 2026 23:59 ET (hard); judging Sep 6 to 18,
fully unattended. Product bar: product, not demo.

## Authority order

1. The planning corpus at `/Users/abu/dev/hackathon/buidl-ctc` (canonical; this repo carries
   read-only copies under `docs/planning/` and `docs/research/` for judges and offline reads).
2. `docs/planning/prd/prd.md` + `docs/planning/prd/fidelity-revision-2026-09-02.md`
   (revision wins on conflict) — FR-1..35, NFR-1..11.
3. `docs/planning/architecture/ARCHITECTURE-SPINE.md` + `FIDELITY-ARCHITECTURE-REVISION.md`
   (revision wins on conflict) — AD-1..36 — plus `CONVENTIONS.md`.
4. `docs/planning/ux/REFERENCE-DESIGN.md` + `PRODUCT-FLOWS.md` — visual/flow contract.
5. `docs/planning/epics.md` — 7 epics, 52 story slices; a requirements catalog, not a workflow.
6. Approved implementation plan: `/Users/abu/.claude/plans/temporal-fluttering-firefly.md`
   (delivery waves A..H; external gates G1..G6).

## Settled decisions (do not relitigate)

- Free-to-play points; no money, custody, order book, leverage or token. Cards are records,
  never tradable collectibles.
- The judge-facing protocol name is **Attestcoin Protocol**; tooling/imports stay `usc-*`.
- References (Yosuku, ZK Freighter, Masayume) are behavior/design baselines with **no license
  grant** — study only, no copied code or assets.
- Repo: public from day 1, MIT, conventional commits daily (NFR-7). Pick-set mirrors will
  commit to a dedicated data branch (AD-12).
- Stack pins re-verified 2026-09-02 (plan §7): Next 16.3.4, Tailwind 4.3.x, Privy 3.39.x
  (`verifyAccessToken` via `@privy-io/node`), viem 2.56.x, Drizzle 0.45.x exact (never the v1
  RC), Supabase new-format keys, AI SDK v7 (`Output.object`), OZ 5.1.0 exact, usc-contracts
  0.2.0 / usc-sdk 0.18.0, solc 0.8.28. Foundry confirmed at kickoff as the locally installed
  1.7.1 (supersedes the stale 1.2.3 planning pin; solc exactness is what matters and foundry.toml
  pins it).

## Current state

- Wave A in progress: Story 1.1 scaffold (this commit history), Story 1.2 day-1 spike.
- Worker accounts: generated locally, funded by Abu via faucet; escrow key offline.
- Hosting (Vercel/Fly/Supabase/Privy) available via local CLIs but deliberately deferred until
  a slice needs it (owner decision 2026-09-02).
