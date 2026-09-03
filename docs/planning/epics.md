---
stepsCompleted: [1, 2, 3, 4]
inputDocuments:
  - '_bmad-output/planning-artifacts/prds/prd-buidl-ctc-2026-08-23/prd.md'
  - '_bmad-output/planning-artifacts/prds/prd-buidl-ctc-2026-08-23/addendum.md'
  - '_bmad-output/planning-artifacts/architecture/architecture-buidl-ctc-2026-08-23/ARCHITECTURE-SPINE.md'
  - '_bmad-output/planning-artifacts/architecture/architecture-buidl-ctc-2026-08-23/CONVENTIONS.md'
  - '_bmad-output/planning-artifacts/ux-designs/ux-buidl-ctc-2026-08-23/DESIGN.md'
  - '_bmad-output/planning-artifacts/ux-designs/ux-buidl-ctc-2026-08-23/EXPERIENCE.md'
  - '_bmad-output/planning-artifacts/ux-designs/ux-buidl-ctc-2026-08-23/EXPERIENCE-ADDENDUM.md'
  - '_bmad-output/planning-artifacts/research/reference-fidelity-2026-09-02/AUTHORITY-AND-PARITY.md'
  - '_bmad-output/planning-artifacts/research/reference-fidelity-2026-09-02/SOMNIA-MASAYUME-SUPPLEMENTAL-AUDIT.md'
  - '_bmad-output/planning-artifacts/prds/prd-buidl-ctc-2026-08-23/fidelity-revision-2026-09-02.md'
  - '_bmad-output/planning-artifacts/architecture/architecture-buidl-ctc-2026-08-23/FIDELITY-ARCHITECTURE-REVISION.md'
  - '_bmad-output/planning-artifacts/ux-designs/ux-buidl-ctc-2026-08-23/REFERENCE-DESIGN.md'
  - '_bmad-output/planning-artifacts/ux-designs/ux-buidl-ctc-2026-08-23/PRODUCT-FLOWS.md'
processNote: 'Requirements catalog only; implementation is Plan-mode-led and repo-native, not a BMad build workflow. Original 33-story proof/referee backlog retained. Reference-fidelity correction 2026-09-02 supersedes COMMAND DECK; the Masayume micro-fidelity audit closes compatible gaps through FR35 and AD36. Tests are supporting checks, never separate deliverables. Complete backlog: 7 epics, 52 stories.'
---

# Proof League - Epic Breakdown

## Overview

This document provides the complete requirements catalog for Proof League, decomposing the canonical PRD pair (FR-1..35, NFR-1..11), architecture pair (AD-1..36 + CONVENTIONS.md), reference parity ledger and reference-led UX contract into 52 implementation slices. It is not a BMad development workflow. The Sep 6, 2026 submission slice remains a sequence marker, not permission to reduce the product backlog to a demo. Stories beyond the submission slice remain explicit product work rather than silently disappearing.

### Delivery policy — latest user decision

- Future implementation agents start in Plan mode, inspect the current repository and referenced source slice, and use repo-native execution. Do not invoke BMad build/dev/story/sprint/retrospective workflows.
- The working feature is the deliverable. Do not create a testing epic, test-only story, coverage target or broad automated UI/snapshot suite.
- “Test”, “check”, “prove” or “verify” in an acceptance criterion means the smallest targeted observation/check needed inside that implementation slice. Security-critical contract/signing/proof/grant/payout invariants still receive focused negative/fuzz/invariant checks. UI fidelity is accepted by direct browser inspection at the required real states/viewports.
- These stories preserve scope and ownership; they do not force one-at-a-time BMad story ceremonies.

## Requirements Inventory

### Functional Requirements

FR1: Product-led first run — skippable five-job primer, exact intent restoration, first Pick ≤2 min, post-primer auth/composer ≤6 interactions, no seed phrase (PRD revision FR-1)
FR2: Legible logged-out state — landing shows live Markets + a real settled Card with working proof links (PRD FR-2)
FR3: Public Player profile — Streak, Season Points, uncurated Card history (PRD FR-3)
FR4: Today view — open/locked/settled Markets, live state transitions without reload (PRD FR-4)
FR5: Market detail with plain-language source explainer + pre-lock Pick distribution (PRD FR-5)
FR6: Market admission rules — five written, structurally-enforced rules per Market (PRD FR-6)
FR7: Market lifecycle honesty states — open→locked→committed→awaiting→verified | voided | stuck; void ≠ stuck (PRD FR-7)
FR8: Stake a Pick — 10–100 points, one option per Market, editable to Lock Time, daily-allowance capped (PRD FR-8)
FR9: On-chain commitment at lock — tamper-evident, before the source window opens (PRD FR-9)
FR10: Cards as permanent receipts — front at pick time; back with outcome, Payout, proof links (PRD FR-10)
FR11: Card sharing — link-preview image + public unauthenticated Card view (PRD FR-11)
FR12: Settlement Worker pipeline — automated detect→attest→prove→submit inside the accepted window, with operator alerts (PRD FR-12)
FR13: Seven-check Settlement Contract + on-chain derivation to exactly one Outcome Option (PRD FR-13)
FR14: One Proof settles every Market on the same Source Event, consuming one budget unit (PRD FR-14)
FR15: Scoring — gross stake×N, bounded batches, per-player atomic reveal, rebuild-reproducible (PRD FR-15)
FR16: Proof view — decoded fields + derivation + seven plain-words checks + two explorer links (PRD FR-16)
FR17: Settlement transparency page — pipeline in plain words + live log with three timestamps (PRD FR-17)
FR18: Streaks — extend/pause/break semantics, provisional days for stuck Markets, all-time-best (PRD FR-18)
FR19: Leaderboard — Season Points ranking, chain-derivable tie-breaks, ≤1 s at 200 rows (PRD FR-19)
FR20: Genesis Season & Prize Pool — visible pool/split, claim-based permissionless payout Sep 17 (PRD FR-20)
FR21: Hosted Round lifecycle — operator creates; Sepolia contract settles via identical Referee path in a 30-min demo window (PRD FR-21)
FR22: Reference-led responsive shell and themes — one product, desktop full nav, mobile bottom nav, flash-free light/dark (PRD revision FR-22)
FR23: Reels discovery — one real Market at a time, canonical composer, accessible bounded feed (PRD revision FR-23)
FR24: Market Rooms — public read, eligible signed posting, off-chain disclaimer, local degradation (PRD revision FR-24)
FR25: Copy-call deep links — prefill context only; receiver reviews and signs a fresh Pick (PRD revision FR-25)
FR26: Challenge builder — presentation wrapper over an admitted Market, never new truth (PRD revision FR-26)
FR27: Activity, Settings and installability — operation history, theme/session/recovery state, PWA metadata (PRD revision FR-27)
FR28: League Guide — grounded contextual explanation/refusal and unsigned draft handoff; honest no-provider state (PRD revision FR-28)
FR29: Player Edge — complete sample-aware own-record analysis from the canonical Card/scoring projection (PRD revision FR-29)
FR30: Takes, Calls feed and lifecycle alerts — signed opinions and consented return signals isolated from truth (PRD revision FR-30)
FR31: Combo Picks — immutable admitted-Market legs, earliest-lock rule, capped deterministic return and explicit void policy (PRD revision FR-31)
FR32: Pick from X — draft-only without authority; full execution only through a bounded expiring/revocable Action Grant and receipt (PRD revision FR-32)
FR33: Strategy Playbooks and Agents — readable immutable rules, labeled simulation and grant-bound automation (PRD revision FR-33)
FR34: Proof Surface — real source/Series/pipeline coverage, distribution, latency and reliability with provenance/completeness (PRD revision FR-34)
FR35: Product identity and micro-interactions — approved BTC/ETH/Creditcoin/Attestcoin/X marks, non-demo Player/Guide identity, capped Guide teasers and one-overlay handoff law (PRD revision FR-35)

### NonFunctional Requirements

NFR1: Settlement correctness beats everything — never hand-resolved, never settled unverified (PRD NFR-1)
NFR2: Latency honesty — real elapsed/expected times from measured figures (PRD NFR-2)
NFR3: Proof budget discipline — ~9 proofs/day/account × 3 accounts, prove within the hour, pool segregated (PRD NFR-3)
NFR4: Judging-window resilience Sep 6–18 — liveness probes, no developer intervention, honest fallbacks (PRD NFR-4)
NFR5: Security posture — focused negative verification for all seven checks, no admin path to outcomes, testnet-only keys (PRD NFR-5)
NFR6: Performance floor — Today ≤3 s cold on Fast-4G, state propagation ≤10 s (PRD NFR-6)
NFR7: Build in the open — public repo day 1, incremental commits, zero-upstream-support posture (PRD NFR-7)
NFR8: Reference fidelity is observable — parity ledger + four-viewport visual evidence (PRD revision NFR-8)
NFR9: Social features cannot contaminate truth and fail locally (PRD revision NFR-9)
NFR10: Share/Room safety — explicit publication, validated structured rendering, rate limits/reporting (PRD revision NFR-10)
NFR11: Verification supports delivery — no testing deliverable/coverage target/broad UI suite; targeted safety checks and direct browser acceptance only (PRD revision NFR-11)

### Additional Requirements

- ARCH1: Monorepo per spine Structural Seed (pnpm 11 workspaces: contracts/, apps/web, apps/worker, packages/shared, packages/chain, docs/), public from day 1, MIT (AD-12)
- ARCH2: Day-1 spike gates a–f before feature code; measurements replace placeholders same-day (spine Execution Seed)
- ARCH3: Pinned stack — solc 0.8.28, Foundry 1.2.3, usc-contracts 0.2.0 (write-ability/common imports only), usc-sdk 0.18.0, OZ 5.1.0 exact (vendor-mandated), Next 16.3.x (init on/after Aug 26), Node 24, viem 2.55.x hashPick, Drizzle 0.45.x (never v1 RC)
- ARCH4: Contract invariants — commit-before-knowability (AD-14), allowance double-cap (AD-15), cursor-idempotent scoring + day aggregates (AD-16), claim-based season payout (AD-17), guarded terminal void (AD-19), no privileged path (AD-20), decoder registry (AD-3), source-key fan-out with decoded-field emission (AD-4)
- ARCH5: Worker invariants — gas+proof ledger with balance alarms, RawProofBuilder fallback, recency floor, NFR-1-over-NFR-3 precedence, live phase timestamps (AD-7); per-market cursors for restart-resume (AD-13)
- ARCH6: Projection — two declared classes, rebuild diff in CI on every push, one settlement = one DB transaction = one per-player realtime event (AD-8, AD-18)
- ARCH7: Ops — one environment, previews on scratch Supabase, RLS rules, Fly payment day 1, new-format Supabase keys, one-deployment history window ≈Sep 1–5, upstream-watch job (AD-13, AD-12)
- ARCH8: Canonical single sources — seven-checks list, payout math, EIP-712 hashPick, derived-state functions, chain config incl. explorer bases (conventions, AD-6)
- ARCH9: Server-first responsive route model, route groups and segment loading/error/not-found states; client islands only for interactivity (AD-22/23)
- ARCH10: Social Class-2 schemas, verified publication/copy/Room adapters and import/RLS isolation from truth/scoring (AD-24..29)
- ARCH11: Deterministic `ShareCardViewModel`, owned fonts/assets, no remote HTML/images; one lifecycle-stable public URL (AD-25/28)
- ARCH12: League Guide consumes allow-listed typed readings, has no writer imports, emits at most an unsigned `PickIntentDraft`, stores no personal memory by default and degrades honestly without a provider (AD-30)
- ARCH13: Player Edge/Proof Surface are worker-owned rebuildable projections with sample/window/completeness/provenance and no UI-local domain formulas (AD-31)
- ARCH14: Combo is a new audited on-chain commitment with ordered immutable legs, earliest-cutoff validation, same daily allowance, bounded multiplier/return and idempotent permissionless finalization (AD-32)
- ARCH15: X/Agent automation shares one cryptographic Action Grant boundary, deterministic intent parser, isolated single-writer executor and durable instruction→grant→Pick→tx receipt (AD-33/34)
- ARCH16: Takes and notification delivery are Class-2 distribution planes driven by canonical outbox events and current consent, with local failure isolation (AD-35)
- ARCH17: One provenance-recorded MarkRegistry and OverlayCoordinator own asset/social/protocol/Player/Guide identity, teaser cadence, focus/handoff and one-blocking-overlay behavior (AD-36)

### UX Design Requirements

UX-DR1: Reference-led editorial token system — cream/black/vermilion, equal light/dark, Sora/Inter/JetBrains Mono/Noto Serif JP; one Tailwind v4 token source (REFERENCE-DESIGN)
UX-DR2: State chip component — the single renderer of exactly 7 chips (open · locked · committed · awaiting attestation · proof verified · voided · stuck) + Pick-level `pending` (EXPERIENCE)
UX-DR3: Call/Record Card — truthful 4:5 open/settled/voided/stuck variants, same public lifecycle, ash incorrect state, no fabricated data (REFERENCE-DESIGN)
UX-DR4: Desktop full nav + mobile bottom nav expose the same five primary jobs with no phone gate (REFERENCE-DESIGN)
UX-DR5: Settlement pipeline tracker — Wait→Attested→Proven, breathing amber active node, live per-phase timestamps, honest caption (DESIGN components.pipeline)
UX-DR6: Proof Reveal choreography — ≤4 s, 7 ordered beats, verification-before-celebration, skippable, reduced-motion instant, fires on the Player's own pick scored (EXPERIENCE money shot)
UX-DR7: Voice law — plain-language microcopy tables, banned casino vocabulary, honest waiting copy with elapsed/usual times (EXPERIENCE Voice and Tone)
UX-DR8: Banned interactions — no fake progress, no optimistic settlement, no pre-verification celebration, no infinite scroll, no urgency theatrics, modal depth ≤1 (EXPERIENCE)
UX-DR9: Accessibility floor — WCAG 2.2 AA, state never color-alone, aria-live on settlement transitions, tabular numerals, reduced-motion support (EXPERIENCE)
UX-DR10: Editorial shell — fixed desktop header, compact mobile header/bottom nav, real-data live strip only, borders/whitespace hierarchy (REFERENCE-DESIGN)
UX-DR11: Time language — UTC-first with local tooltip, tilde on estimates, countdown formats, server-synced clocks (EXPERIENCE)
UX-DR12: Share artifact — OG image with call + outcome + proof link, public Card route (EXPERIENCE share sheet)
UX-DR13: Versioned skippable first-action primer, exact return-to-intent and returning-state priority (PRODUCT-FLOWS)
UX-DR14: Markets + Reels use the same Market view model/composer; Room and social failures degrade locally (PRODUCT-FLOWS)
UX-DR15: Persistent error hierarchy — known refusal, retry with draft, confirmation unknown with durable id, success in-origin (PRODUCT-FLOWS)
UX-DR16: Four-viewport responsive matrix (1440×1000, 1024×768, 390×844, 360×800) across theme/auth/lifecycle states (PRODUCT-FLOWS)
UX-DR17: Source-exact light ramp and theme semantics — `#F4EEE3/#FBF7EE/#F6F0E4/#141210`, light vermilion/UP/DOWN remaps, live-toggle chart/SVG/canvas verification (REFERENCE-DESIGN)
UX-DR18: Required shell grammar — grain, crop ticks, torii/numbered section rhythm, ticker/marquee and editorial italics; dark islands require complete theme contracts (REFERENCE-DESIGN)
UX-DR19: League Guide dock/drawer — real contextual meter, grounded/unavailable/refusal states and “Review in composer”, never direct submit (PRODUCT-FLOWS §10)
UX-DR20: Player Edge/Proof Surface — sample/completeness/provenance, evidence-linked segments and no unsupported finance analytics (PRODUCT-FLOWS §11)
UX-DR21: Takes/feed/alerts — signed opinion presentation, Market always visible, consent/quiet-hours/delivery states and local failure isolation (PRODUCT-FLOWS §12)
UX-DR22: Combo slip — ordered immutable leg review, earliest cutoff/capped return/void policy and per-leg terminal states on desktop/mobile (PRODUCT-FLOWS §13)
UX-DR23: X/Agent authority receipts — scope/caps/expiry/revoke plus instruction/grant/Pick/tx trace; simulation visually distinct from live (PRODUCT-FLOWS §14)
UX-DR24: Recognizable identity marks — approved BTC, ETH/Ethereum, Creditcoin/Attestcoin and X marks; address identicons or approved images for Players; no initial-letter logo/avatar substitutes (REFERENCE-DESIGN §10)
UX-DR25: Overlay law — tooltip, teaser, drawer/sheet/dialog and toast have separate jobs; one blocking overlay, safe handoff, focus return, intent retention and mobile clearance (PRODUCT-FLOWS §18)
UX-DR26: Guide micro-flow — real lifecycle ring, 3.5 s/4.8 s/4.5 s three-pop teaser cadence, hover/focus label, starter/follow-up chips and action cards only after a valid answer (REFERENCE-DESIGN §10)

### FR Coverage Map

FR1: Epic 3 — sign-in + first pick (3.3)
FR2: Epic 3 — logged-out landing (3.2)
FR3: Epic 4 — public profiles (4.1)
FR4: Epic 3 — Today view (3.4)
FR5: Epic 3 — Market detail (3.5)
FR6: Epic 5 — market admission + launch configs (5.1)
FR7: Epic 2 — lifecycle states on-chain/derived (2.1, 2.6); surfaced in Epic 3 (3.4)
FR8: Epic 3 — pick composer + intake (3.3); capped on-chain in Epic 2 (2.5)
FR9: Epic 2 — commitPicks + window enforcement (2.2)
FR10: Epic 3 — Cards (3.6)
FR11: Epic 4 — sharing (4.5)
FR12: Epic 2 — settlement worker (2.8)
FR13: Epic 2 — ProofGateway + decoders (2.3, 2.4)
FR14: Epic 2 — source-key fan-out (2.4)
FR15: Epic 2 — scoring + projection (2.5, 2.9); reveal trigger in Epic 3 (3.7)
FR16: Epic 3 — proof view (3.7)
FR17: Epic 3 — transparency page (3.8)
FR18: Epic 2 — day aggregates (2.5); UI in Epic 4 (4.2)
FR19: Epic 4 — leaderboard (4.3)
FR20: Epic 2 — season contract surface (2.10); Epic 4 — season UI & trigger (4.4)
FR21: Epic 2 — ContestSource (2.7); admin surface in Epic 5 (5.2)
FR22: Epic 3 — shell/theme/navigation (3.1), responsive installability (3.10)
FR23: Epic 3 — Reels discovery (3.9)
FR24: Epic 4 — Market Rooms (4.6)
FR25: Epic 4 — copy-call context (4.7)
FR26: Epic 4 — Challenge builder (4.8)
FR27: Epic 3 — responsive installability (3.10), Activity/Settings/recovery (3.11)
FR28: Epic 7 — League Guide (7.1)
FR29: Epic 7 — Player Edge (7.2)
FR30: Epic 7 — Takes/Calls feed and lifecycle alerts (7.3); creator/followed return channels also 6.5
FR31: Epic 7 — Combo contract/intake/receipt (7.4)
FR32: Epic 7 — Pick from X and Action Grant (7.5)
FR33: Epic 7 — Playbooks/Agents (7.6)
FR34: Epic 7 — Proof Surface (7.7)
FR35: Epic 3 — shared marks/overlays (3.1); Epic 7 — Guide invitation/drawer micro-flow (7.1)
AD-21 Market Engine: Epic 2 — Series + scheduler (2.11); template authoring in Epic 5 (5.1)
AD-22..29: Epic 3/4 social/shell stories, Epic 1 schema/enforcement amendments, Epic 6 creator path
AD-30..36: Epic 7 intelligence/analytics/Combo/delegation/distribution stories plus Epic 3 shared identity/overlay infrastructure, with Epic 1 boundary foundations
UX-DR1..26: Epic 3 (shell/onboarding/Markets/Reels/Record/proof/identity/overlays), Epic 4 (League/share/Rooms/copy/Challenges), Epic 5 (evidence), Epic 7 (Guide/Edge/feed/Combo/X/Agents/Surface)
NFR1..11: cross-cutting — contract/worker correctness plus social isolation, fidelity evidence and proportional verification posture

## Epic List

### Epic 1: Proven Foundations (Aug 28–29)
Abu and every agent (and later, judges reading the repo) can trust the platform is real: the repo builds in the open, and all six spike gates return measured answers that replace every assumption.
**FRs covered:** ARCH1, ARCH2, ARCH3, ARCH8 (foundations for all FRs) · **Layer A**

### Epic 2: The Referee (Aug 28–31; full contract surface deployed before the ≈Sep 1–5 history window)
A Market can be created, committed, proven, resolved and scored entirely on-chain with every integrity invariant enforced and negative-tested — the product's heart, and the hackathon's scoring core. Includes the Season contract surface and the Market Engine, so nothing later reopens contracts.
**FRs covered:** FR7, FR9, FR12, FR13, FR14, FR15 (chain half), FR18 (chain half), FR20 (contract half), FR21 (contract half); AD-21 · **Layer A**

### Epic 3: Play the Product
Kwame's complete individual journey works in the reference-led product: public evidence, first-action primer, exact return to intent, responsive Markets/Reels, canonical Pick, Open Call/Record, proof reveal, Activity and Settings.
**FRs covered:** FR1, FR2, FR4, FR5, FR8, FR10, FR15, FR16, FR17, FR22, FR23, FR27, FR35; UX-DR1..18, UX-DR24..26 · **Product baseline**

### Epic 4: The League and Social Loop
Deji's rivalry and distribution loop works: public records, Streaks, real League, open/settled sharing, Rooms, copy-call context and Challenges over admitted Markets.
**FRs covered:** FR3, FR11, FR18, FR19, FR20, FR24, FR25, FR26; UX-DR3/12/14/15 · **Product baseline**

### Epic 5: Ready for Judgment (threaded, Aug 29–Sep 6)
Ama's five minutes never fails: real markets live on real events, a judge-safe Hosted Round on demand, ops that survive two unattended weeks, and the submission bundle uploaded before the deadline.
**FRs covered:** FR6, FR21; NFR4, NFR8..10; SM-3 and fidelity evidence · **Submission slice and operations**

### Epic 6: Creator Growth Loop (post-v1 product horizon)
Creators can propose new proof-settleable Series and grow public Challenge collections without gaining outcome authority or bypassing admission.
**FRs covered:** post-v1 extension of FR21/FR26; AD-29; public creator records and return loop · **Product horizon**

### Epic 7: Intelligence, Analysis and Bounded Automation
Players can ask for grounded help, inspect their complete performance, publish Takes and alerts, compose multi-Market Picks, and eventually originate Picks from X or Playbooks without creating a second truth or signing plane.
**FRs covered:** FR28..34; AD-30..35; UX-DR17..23 · **Stories 7.1–7.3 product baseline; Stories 7.4–7.7 product horizon**

---

## Epic 1: Proven Foundations

Everything measured, nothing assumed: the monorepo skeleton building in public, and the six spike gates answered with numbers.

### Story 1.1: Repo, toolchain and CI skeleton — building in the open

As Abu (and the judges who will read this repo),
I want the public monorepo scaffolded with the pinned toolchain and CI running on every push,
So that the build starts in the open on day 1 and the execution-capability evidence accrues from the first commit.

**Acceptance Criteria:**

**Given** a clean machine
**When** the repo is cloned and `pnpm install && pnpm build && forge build` run
**Then** the workspace (contracts/, apps/web, apps/worker, packages/shared, packages/chain, docs/) builds with the exact pins (solc 0.8.28, Foundry 1.2.3, usc-contracts 0.2.0, usc-sdk 0.18.0, OZ 5.1.0, Node 24 via .nvmrc, pnpm 11 via packageManager) — ARCH1/ARCH3, AD-12
**And** the repo is public with MIT license, README stub, and `docs/` containing the four research reports and this planning set

**Given** any push to main
**When** CI runs
**Then** `pnpm check`, production builds and `forge build` execute; focused contract/EIP-712 verification is added only by the slice that needs it rather than scaffolded as a parallel testing product; **main CI is green on every push from the first commit** and daily conventional commits are visible in history — NFR7/11

**Given** the conventions contract (CONVENTIONS.md)
**When** `pnpm check` runs
**Then** the full chain executes: eslint (TypeScript max-lines 300, import zones, chainKey-literal ban, forbid-dom-props on `style`, Drizzle builders restricted to `packages/shared/db`) + raw-source 400-line cap for CSS/SQL/config + tsc + secret-scan + overclaim-scan, and the `pnpm verify:*` namespace exists with its first stub — later stories own the real scripts (2.2 commit, 2.6 void, 2.8 settlement, 2.10 payout, 5.2 hosted-round) — CONVENTIONS §1/§7/§8
**And** the review checklist installed with AGENTS.md includes the comment law: non-obvious constants and branches carry why-comments — CONVENTIONS §10 [review 2026-08-31]
**And** AGENTS.md and project-context.md are installed at repo root (AGENTS.md generated from CONVENTIONS + spine pointers at scaffold time), so every agent session starts grounded — CONVENTIONS §2, critic G7-adjacent

### Story 1.2: Day-1 spike — six gates, six measurements

As the builder,
I want all six spike gates executed and recorded before any feature code,
So that every latency, gas, and capability assumption is replaced by a measured fact (or its fallback branch fires today, not on Sep 5).

**Acceptance Criteria:**

**Given** the three worker accounts, the escrow account, Fly and Supabase
**When** gate (1) runs
**Then** on-chain CTC balances are recorded, the Fly payment method is attached, and the Supabase project uses new-format keys — ARCH7, AD-13

**Given** the hello-bridge flow against Sepolia
**When** gate (2) runs end-to-end
**Then** attestation wall-clock and the recency floor are measured and written to `docs/spike-day1.md`, and the shared time util's expected-settlement constant is set from the measurement — ARCH2, NFR2

**Given** the ChainInfo precompile on CC3 testnet
**When** gate (3) probes `getSupportedChains()` live
**Then** the Mainnet-Read Gate verdict is recorded and the market-config source-chain data for the launch lineup is chosen accordingly (mainnet or Sepolia branch) — AD-6, PRD §4.2

**Given** a real Lido `TokenRebased` receipt and a trivial contract deploy
**When** gates (4) and (6) run
**Then** decode-gas headroom sets the `scoreBatch` size constant, and the `evm_version` that verifies on creditcoin-testnet.blockscout.com is pinned in foundry.toml — AD-4, conventions

### Story 1.3: Runtime configuration and shared schema foundation

As every downstream story,
I want runtime chain configuration and one shared database contract established before parallel feature work,
So that no hardcoded network or divergent truth/social schema can emerge.

**Acceptance Criteria:**

**Given** worker boot
**When** the chain-config package initializes (pre-split `chains.ts` / `contracts.ts` / `endpoints.ts` — CONVENTIONS §1)
**Then** chainKeys come from the ChainInfo precompile, endpoints/explorer bases come from validated config, and the eslint rules (`no-restricted-syntax` chainKey literals, `no-restricted-imports` plane zones) fail the build on violations — AD-2, AD-6

**Given** the database contract (critic G3)
**When** this story completes
**Then** `packages/shared/db/` owns class-1 truth plus class-2 operational tables including pending Picks, shared Calls, Challenges/joins, Room messages/reports and user preferences; migration RLS enforces AD-13/24/27 ownership and social isolation, web imports types/builders only through allowed modules, and `pnpm rebuild` runs green against the empty schema — CONVENTIONS §4, ARCH10

**Given** the hosting targets (critic G7)
**When** Epic 1 closes
**Then** the web app is live on Vercel production, the worker deployed on Fly with `/health` green, previews wired to the scratch Supabase project, and the operator webhook receives a test alert — AD-13

### Story 1.4: Wallet-light signing proven (day 1.5)

As Kwame,
I want the embedded wallet to sign a Proof League Pick without any visible wallet ceremony,
So that the two-minute first pick is technically real before the UI is built.

**Acceptance Criteria:**

**Given** a fresh Privy account with `creditCoin3Testnet` in `supportedChains`
**When** the spike page requests an EIP-712 Pick signature via the shared `hashPick()`
**Then** the signature is produced without a visible prompt and verifies against the canonical encoding — AD-9, AD-5
**And** if the prompt is visible or signing fails, the pre-decided fallback branch (passkey-first) is activated and the transparency-copy consequence (AD-9) is logged the same day

---

## Epic 2: The Referee

The on-chain heart: contracts enforcing every invariant with focused security verification, and the worker that feeds them. The full contract surface deploys before the ≈Sep 1–5 history window.

### Story 2.1: LeagueCore market registry — immutable, on-chain, sole-minted

As the operator (and every Player trusting the boundaries),
I want Markets created on-chain with their full immutable config before they open,
So that nobody — including us — can move an option boundary, lock time or decoder after Players have staked.

**Acceptance Criteria:**

**Given** a market config (source chain+chainKey, emitter, event signature, subject filter, decoderId, ordered boundaries 2–6, Payout N, leagueDay, lockTime, sourceWindowOpen, voidDeadline)
**When** `createMarket(config)` is mined
**Then** `marketId` is minted solely by the contract, the config is immutable thereafter, and `marketsBySourceKey` gains the market — AD-3, AD-4, FR7

**Given** a config violating admission structure (an absence predicate, lockTime after the determinism horizon, or `sourceWindowOpen < lockTime + MIN_COMMIT_MARGIN` — the empty-commit-window case [review 2026-08-31])
**When** `createMarket` is called
**Then** it reverts — the schema makes FR-6 rules 3–4 and unusable commit windows unrepresentable — AD-3, AD-14, FR6

**Given** any privileged caller after creation
**When** any mutation of config, boundaries or state is attempted outside the defined transitions
**Then** no such function exists (negative test: no reachable privileged path) — AD-20, NFR5

### Story 2.2: Pick commitment — canonical, windowed, chain-enforced

As a Player,
I want my signed Picks committed as a merkle root strictly before the event window opens,
So that "nobody can add a winning pick after the answer is public" is enforced by the chain, not promised by the operator.

**Acceptance Criteria:**

**Given** the day's pick-set (EIP-712 messages with nonce, utcDay, stakedSoFarInDay; latest-nonce-wins; zero-stake tombstones)
**When** the worker calls `commitPicks(marketId, root, uri, sha)` within `[lockTime, sourceWindowOpen)`
**Then** the commitment stores and `PicksCommitted` emits; outside that window it reverts; a market missing its window can only void — AD-14, FR9

**Given** the canonical `abi.encode` leaf layout in LeagueCore and `hashPick()` in packages/shared (viem)
**When** the CI conformance fixture runs
**Then** Solidity and TS produce identical hashes for the shared test vectors, and the mutation check proves the gate works: perturbing any one field yields a hash mismatch that fails CI [review 2026-08-31] — AD-5, ARCH8

**Given** a Market that reaches lockTime with zero live Picks [review 2026-08-31]
**When** the worker commits
**Then** the canonical empty root commits, the lifecycle proceeds, and `scoreBatch` no-ops straight to `MarketFullyScored` — zero-pick markets never rot uncommitted — AD-14
**And** `verify:commit` exists: an end-to-end testnet script exercising sign → intake → commit → provably-in-set — CONVENTIONS §8

**Given** the published pick-set JSON (signatures included, sorted player-asc/nonce-asc, content-addressed filename)
**When** `pnpm rebuild` verifies it
**Then** every signature checks, the root re-derives, and the file exists at both homes (Supabase write-once path + docs/pick-sets/ on the dedicated data branch) — and publication ordering is upload-both-homes → verify-readable → **then** `commitPicks`, never commit-first [review 2026-08-31] — AD-5, AD-7, AD-18

### Story 2.3: ProofGateway — seven checks, decoder registry, negative-tested

As the Referee,
I want every proof to pass the seven checks and decode through a registered decoder,
So that a reverted, spoofed, replayed, mistimed, wrong-chain or wrong-contract event can never settle a Market.

**Acceptance Criteria:**

**Given** proofs engineered to fail each check (reverted source tx; wrong emitter; wrong event signature; wrong subject; replayed proof; pre-open source tx; spoofed prover path; wrong source chain against check 2's "right contract on the right chain")
**When** each is submitted
**Then** each is rejected on-chain with its own negative test in the suite — FR13, AD-6, AD-20, NFR5

**Given** the decoder registry
**When** the Lido decoder (rate-ratio derivation, ≥12-decimal fixed point) is registered
**Then** decoderIds are append-only, never repointed, and registering never touches LeagueCore — AD-3
**And** the decoded reference receipt reproduces the blind-verified 2.3785% figure — FR13

### Story 2.4: Resolution fan-out — one proof, every keyed market, decoded fields emitted

As the system,
I want one accepted proof to resolve every unresolved Market on its source key with per-market decoding,
So that FR-14 is structural (the worker chooses nothing) and the proof view can show real decoded values.

**Acceptance Criteria:**

**Given** two Markets keyed to the same Lido event (yield + tips-and-fees) in state Committed
**When** the proof is accepted
**Then** both resolve in one transaction, each via its own decoderId and boundaries, consuming one budget unit — FR14, AD-4

**Given** a sourceKey whose siblings include a voided or never-committed Market [review 2026-08-31]
**When** the proof is accepted
**Then** the fan-out skips non-Committed siblings and settles the rest (negative-tested — one voided sibling can never revert the verify tx), and where two valid source events could match one key in-window, first-accepted-proof-wins is the documented rule — AD-4

**Given** the resolve event surface
**When** a Market resolves
**Then** decoded fields and derivation inputs are emitted on-chain, sufficient for the proof panel and `pnpm rebuild` — AD-4, FR16

### Story 2.5: Scoring, allowance cap, and day aggregates

As a Player,
I want scoring to be exactly-once, budget-capped and day-attributed by Market data,
So that Season Points can't be double-minted, over-staking can't pay, and no rival can time a transaction to break my Streak.

**Acceptance Criteria:**

**Given** `scoreBatch(marketId, picks[], proofs[])` with the contract-held cursor
**When** batches are submitted repeatedly, interleaved, or by hostile callers
**Then** every Pick scores exactly once (below-cursor rejected; **skip-ahead batches rejected — `require(batchStartIndex == cursor)`, contiguous only** [review 2026-08-31]; fully-scored no-ops; `MarketFullyScored` once), negative-tested — AD-4/AD-16; FR15

**Given** a committed set containing an over-allowance day for one Player
**When** scoring reaches those Picks
**Then** over-budget Picks are skipped (never reverting the batch) per `dailySpent`, with the skip selection **deterministic by signed nonce order within the Player's utcDay — never by cross-market scoring order** (negative test: interleaved batches cannot change which stake skips) [review 2026-08-31] — AD-15, FR8

**Given** per-player-per-leagueDay aggregates {picksCount, correctCount, marketsPending}
**When** a day's last Market settles
**Then** the streak contribution evaluates order-independently (extend/break/pause) as a **fold over finalized days in leagueDay order, recomputed on every finalization** — a provisional day finalizing late still yields the correct streak and tie-break key (negative test: out-of-order finalization) [review 2026-08-31] — voided Picks never count, and provisional days finalize correctly — AD-16, FR18

**Given** a Player's first-ever scored Pick (critic G2 — the FR-19 tie-break must be on-chain)
**When** `scoreBatch` reveals it
**Then** LeagueCore records that Player's earliest commitment appearance (the min commit ordinal across their scored Picks' Markets), exposed for the FR-19 tie-break and `payoutSeason` challenge verification, negative-tested for the min rule under later commits — AD-16, AD-17

### Story 2.6: Void — guarded, terminal, permissionless

As a Player with stakes in a Market whose event never happened,
I want my points back through a rule no human can invoke early or block,
So that void is a clock fact and stuck stays honest.

**Acceptance Criteria:**

**Given** a Committed Market past `voidDeadline` with no accepted proof on its source key
**When** anyone calls `void(marketId)`
**Then** it voids terminally, stakes return per AD-15's day rules (keyed by the signed utcDay), and a later `resolve` permanently reverts — AD-19, FR7

**Given** a Market still in state `Created` past `voidDeadline` (its commit window was missed) [review 2026-08-31]
**When** anyone calls `void(marketId)`
**Then** it voids terminally with no stake movement — the `Created → Voided` edge exists, so a missed commit can never freeze a market forever — AD-19, AD-14

**Given** a Market before `voidDeadline`, or one an accepted proof already resolved
**When** `void` is called
**Then** it reverts — the stuck case can never be voided while its event exists. **Amended [review 2026-09-03]:** "with an accepted proof" is enforced through the terminal-state check, never a per-key `acceptedAt` read — a Committed sibling the fan-out *skipped* on a now-consumed key can never resolve again, so it stays voidable past its deadline (negative-tested both ways; see AD-19's amendment for the freeze/deadlock this prevents) — AD-19, NFR1
**And** the worker's loop submits `void()` for every eligible market itself (permissionless — anyone can, the worker does), and `verify:void` exercises the path end-to-end on testnet [review 2026-08-31] — AD-19, CONVENTIONS §8

### Story 2.7: ContestSource on Sepolia — outcomes nobody can influence

As Ama (the judge playing the Hosted Round),
I want the round's outcome fixed by a pre-committed future block,
So that neither operator nor any player can grind or choose it.

**Acceptance Criteria:**

**Given** a round created with parameters + `settleBlock` (≥ scheduled settle time) fixed before Lock Time
**When** `settle(roundId)` is called after `settleBlock` is mined
**Then** the outcome derives solely from `blockhash(settleBlock)` + fixed parameters — identical regardless of caller/timing; before `settleBlock` it reverts; a lapsed 256-block horizon voids the round — AD-11, FR21
**And** the contract is shape-parameterized so the Mainnet-Read-Gate fallback lineup needs only configs — AD-3

### Story 2.8: Settlement worker — the heartbeat

As the system,
I want the worker to watch, wait, prove, submit and project automatically with an honest ledger,
So that settlements land inside the accepted window without a human, and every failure alerts instead of pretending.

**Acceptance Criteria:**

**Given** a scheduled source event (Lido 12:00:11 UTC)
**When** the pipeline runs
**Then** phase timestamps (event/attested/proven) write to the transparency projection as each phase completes, the proof submits within the measured window (target: measured attestation + 5 min; ceiling 60 min; T+45 alert-and-prove-anyway per NFR-1 > NFR-3), respecting the recency floor — FR12, AD-7

**Given** the ledger (proof units + CTC gas across 3 accounts; escrow untouched)
**When** balances approach the three-day-traffic threshold
**Then** the operator webhook alerts; exhaustion renders affected markets `stuck` with the honest reason, never a silent skip — AD-7, NFR3

**Given** a hosted-prover outage or a worker restart mid-pipeline
**When** the run resumes
**Then** RawProofBuilder (same interface) takes over on prover failure, and per-market cursors resume without re-detection — AD-7, AD-13

**Given** a hung phase (an RPC call that never returns) [review 2026-08-31]
**When** the per-phase timeout fires
**Then** the watchdog releases the loop (the re-entrancy guard never wedges permanently), `/health` exposes last-loop-tick age for the external probe, and the failover drill is a named history-window task: block the prover one round → RawProofBuilder settles it; restart mid-pipeline → cursors resume; force the ledger below threshold → alert + `stuck` rendering; results logged in docs/ — AD-7, NFR4
**And** `verify:settlement` exists: one end-to-end testnet run of watch → attest → prove → submit → project — CONVENTIONS §8

### Story 2.9: Projection and the rebuild proof

As the trust story,
I want the two-class projection with a rebuild script that reproduces every truth number,
So that "the database is just a cache of the chain" is demonstrable, in CI, on every push.

**Acceptance Criteria:**

**Given** class-1 tables (markets, committed picks, resolutions, scores, season, streaks, payouts) and class-2 tables (pending picks, distribution, cursors, ledger, observations)
**When** `pnpm rebuild` runs in CI
**Then** class-1 reconstructs exactly from chain + published pick-sets (signatures + budget re-verified) and diffs clean; class-2 is excluded and labelled observed-not-proven where displayed — AD-8, AD-18, FR15

**Given** one settlement
**When** the projector applies it
**Then** score/streak/rank land in a single Postgres transaction and emit one realtime event per player-scored outcome — AD-8, FR15

### Story 2.10: The Season contract — escrow, params, claim-based payout, before the window

As the winners (and NFR-4's unattended window),
I want the Season surface on-chain with the rest of the contracts,
So that cutting or shipping Layer-C UI never reopens contract code (critic G1 — this surface previously lived post-window in 4.4).

**Acceptance Criteria:**

**Given** Season parameters (end Sep 17, pool from the segregated escrow account, 50/30/20 split — pool size is operator config at season start, placeholder 1,000 testnet CTC)
**When** the Season is initialized at deployment
**Then** params are immutable, the escrow is funded from the fourth account the worker ledger never touches, and the pool is readable on-chain for the Leaderboard banner — FR20, AD-17, NFR3

**Given** `payoutSeason()` after Season end
**When** anyone triggers it (permissionless)
**Then** the claim-based flow (candidate top-3, O(3) on-chain verify against Season Points + tie-break keys incl. earliest commitment appearance and the final address-asc key, `SEASON_CHALLENGE_WINDOW` [6 h shared constant], **pull-based payment** — expiry credits claimable balances, winners withdraw, one reverting recipient can never block) executes with negative tests for early trigger, wrong candidates, double-pay, **claims while any season market is non-terminal (must revert), and 0/1/2-eligible-winner splits (unfilled shares return to escrow)** [review 2026-08-31] — AD-17, AD-20, FR20

**Given** the unattended execution path [review 2026-08-31]
**When** seasonEnd passes
**Then** the worker watches candidate submissions, auto-submits the superior candidate inside the window, sends the expiry call, and webhooks on any revert; `verify:payout` proves the whole flow pre-Sep-17 by driving a minutes-long test Season on the same bytecode end-to-end; the post-seasonEnd cron asserts the payout tx exists on-chain, else alerts — AD-17, NFR4, CONVENTIONS §8
**And** escrow funding is a one-time step on the final pre-window deployment checklist — earlier deploys init pool=0 and the banner renders chain state — AD-17

### Story 2.11: The Market Engine — Series mint markets, the league feeds itself

As the league (and Abu, who must never post markets by hand),
I want recurring Markets minted automatically from on-chain Series templates,
So that creation joins settlement as fully automatic and the two unattended judging weeks run hands-off — AD-21.

**Acceptance Criteria:**

**Given** a registered Series (immutable template: source chain + emitter + event signature, decoderId, cadence, boundary formula, lock/window/void offsets, `maxInstancesPerDay` cap in-contract)
**When** `instantiateNext(seriesId)` is called by anyone once the next slot is due
**Then** the instance's `leagueDay/lockTime/sourceWindowOpen/voidDeadline` and boundaries derive from the registered formula over **chain-resident observations** (prior resolved instances' decoded fields, read over the slot's deterministic window — never call-time state, never an off-chain feed), the cap rejects over-creation, and a slot whose derived lockTime already passed is skipped, never minted (negative-tested: early call, over-cap day, tampered params, **two callers at different times must mint byte-identical params**, dead-slot skip) [review 2026-08-31] — AD-21, AD-20, FR6
**And** `pnpm rebuild` recomputes formula(on-chain observations) per instance and diffs against stored boundaries — "chosen by nobody" is machine-verifiable — AD-21, AD-8

**Given** the worker's scheduler module
**When** it runs its loop
**Then** it maintains a 48–72 h rolling buffer of pre-created Markets, records creations in the gas ledger, and a scheduler outage delays nothing already scheduled — with the judging-window policy: **only boundary-static Series (Hosted Rounds) pre-extend through Sep 18; observation-derived Series keep the rolling horizon** (boundary freshness beats pre-creation), the external liveness scheduler as backup `instantiateNext` caller, and the market-supply probe (Story 5.3) watching buffer depth [review 2026-08-31] — AD-21, AD-7, AD-12, NFR4

---

## Epic 3: Play the Product

Kwame's complete personal loop in the reference-led responsive product: discover, learn once, sign, publish, verify and return.

### Story 3.1: Reference-led shell, themes and state system

As every visitor and Player,
I want the Yosuku-led editorial system and responsive shell implemented once,
So that public marketing and the signed-in product share one faithful visual/interaction language.

**Acceptance Criteria:**

**Given** `REFERENCE-DESIGN.md`
**When** the web app builds
**Then** one Tailwind v4 token layer renders the source-exact theme ramps and semantic remaps in `REFERENCE-DESIGN.md`, Sora/Inter/JetBrains Mono/Noto Serif JP, system-first no-flash theme and a labeled persisted toggle; COMMAND DECK cyan/chamfer/glow styling and generic registry palettes are absent — FR22, UX-DR1/17
**And** desktop exposes Markets/Reels/Create/League/Record in the 64px header while mobile exposes the same five jobs in a safe-area bottom nav; no phone gate, hidden job or separate mobile app exists — AD22, UX-DR4/10
**And** grain, crop ticks, torii/numbered section heads, real ticker/marquee and editorial italics are implemented as the shared shell grammar; any intentional dark island carries a complete light/dark descendant palette — UX-DR18
**And** sourced 21st.dev/shadcn primitives record provenance and are adapted to the contract before use

**Given** a known asset, source, protocol, social action, Player or Guide identity
**When** it renders anywhere in Markets, Market detail, Ticket, Reels, Cards, filters, source/proof links, Guide, share or X surfaces
**Then** one provenance-recorded registry supplies the approved Bitcoin mark for BTC, Ethereum mark for ETH/Ethereum, Creditcoin/Attestcoin mark for proof infrastructure, X mark for X, address identicon/approved image for a Player and the owned Proof League mark for Guide; no acronym, decorative letter circle, random glyph or invented face substitutes for an available mark, and accessible names/tooltips remain — FR35, AD36, UX-DR24

**Given** tooltip, contextual teaser, onboarding, auth, Guide, share, report or composer-review UI
**When** surfaces open, close or hand off
**Then** the shared coordinator allows only one blocking overlay, preserves validated intent, returns focus, supports Escape/back where safe, clears the mobile nav/safe area and keeps critical state inline; tooltips remain supplementary and at most one toast merely echoes durable state — FR35, AD36, UX-DR25

**Given** mounted chart, SVG, canvas and third-party primitives
**When** the user toggles dark→light and light→dark without reload
**Then** every primitive updates its foreground/background/axis/tooltip contrast immediately; the manual browser pass observes both live directions because clean-load screenshots alone cannot detect a stale mounted color — AD23, UX-DR17, NFR11

**Given** the StateChip component
**When** any surface renders Market state
**Then** exactly the seven chips exist (open/locked/committed/awaiting attestation/proof verified/voided/stuck), derived via the shared pure function, with Pick-level `pending`; the single-renderer invariant is enforced by a defined check [review 2026-08-31]: grep for the multi-word chip strings outside StateChip/market-state.ts plus an eslint `no-restricted-syntax` rule on the chip-state literal union outside those two files — UX-DR2, AD-18, FR7

**Given** public/product/account/operator route groups
**When** each route is built
**Then** it has the required segment loading/error/not-found state, Server Component by default and a documented Client boundary only for auth/theme/realtime/composer/gesture/share behavior — AD23

### Story 3.2: The logged-out landing

As a visitor from a tweet,
I want to see live Markets and one real settled Card with working proof links before any signup,
So that the product proves itself in five seconds.

**Acceptance Criteria:**

**Given** an unauthenticated cold load on Fast-4G
**When** the landing renders
**Then** meaningful content appears ≤3 s (cached server components, revalidate ≤30 s), proof links resolve publicly, and skeletons match final layout — FR2, NFR6, UX-DR8

**Given** a first-time visitor reading the first viewport and teaching section
**When** the page renders
**Then** the editorial hero shows a real featured Market plus one real settled proof-backed Record; a three-step proof explanation and the essential free-points/proof vocabulary are visible without forcing a tutorial, and every link goes somewhere real — FR2, REFERENCE-DESIGN

**Given** a deployment with no settled Card yet (fresh deploy, or any pre-window redeploy) [review 2026-08-31]
**When** the landing renders
**Then** the settled-Record exhibit shows a structural empty state with the next expected real settlement — never a blank, broken or fabricated hero — PRODUCT-FLOWS §4, FR2

### Story 3.3: Sign in and strike the first Pick

As Kwame,
I want to go from landing to a confirmed Pick in under two minutes with no wallet ceremony,
So that the first-pick moment lands (UJ-1).

**Acceptance Criteria:**

**Given** a clean browser and a play intent from Landing, Market, Call, Challenge or Reels
**When** a first-time visitor sees/skips the versioned five-job primer (product, lifecycle, signing authority, public/recovery model, presentation choice), signs in with Privy and stakes 40 points via the canonical composer
**Then** Pick confirmation is reached in ≤2 min; after the primer is completed or skipped, auth plus composer/signing takes ≤6 meaningful interactions with no seed phrase or funding step; the Card front renders immediately with `pending→locked` status — FR1, FR8, FR10, AD-9
**And** the exact source route, Market, option and stake draft survive auth cancellation/success; a returning user skips the primer and resumes draft → own awaiting Pick → newest unseen result → Markets priority — UX-DR13

**Given** the first coached composer
**When** a Player signs in for the first time ever
**Then** allowance/not-money, gross-return and expected-settlement teaching render in place; the submit slot carries the real in-flight/blocked/ready state and no modal/toast becomes the only explanation — PRODUCT-FLOWS §2/§3

**Given** a failure during sign-in or Pick placement
**When** any of the ADDENDUM §5 cases occur (signature cancelled, over-allowance, lock race, intake failure, provider outage)
**Then** the canonical persistent error hierarchy renders — next action stated, "your points are untouched" where true, ref code on unmapped errors, draft retained and confirmation-unknown separated from refusal — PRODUCT-FLOWS §16

**Given** the intake API (Next route handlers → `pending_picks`, RLS: own-wallet writes before Lock Time only)
**When** Picks are created/edited/cancelled until Lock Time
**Then** edits replace via nonce (intake requires nonce > current; a duplicate `(player, marketId, nonce)` with a distinct payload is rejected — two devices can never create an ambiguous committed set [review 2026-08-31]), cancels are signed tombstones, intake closes at `lockTime − quiet period` (RLS enforces the same cutoff), and post-lock mutations return the visible "locked" response — AD-2, AD-5, AD-14, FR8

### Story 3.4: Markets — the live board

As a Player,
I want a complete Markets board with Today, Upcoming and Settled discovery,
So that the daily ritual has a home without reducing the product to one feed.

**Acceptance Criteria:**

**Given** open/locked/committed/awaiting/settled Markets
**When** states change on-chain or in the worker
**Then** Featured/Today/Upcoming/Settled filters use one canonical Market view model; rows update in place ≤10 s via Realtime Broadcast (5 s polling fallback), countdowns use `/time`, and loading/empty/stale/error/after-lock states route to a real next action — FR4, FR7, AD10/23
**And** question-first plain-language cards, real distributions and source/state/time remain fully usable at all four reference viewports

**Given** the canonical waiting/returning contract
**When** any own Pick sits in `awaiting attestation`
**Then** the wait was stated before commitment, the page carries "You can close this — your Card updates itself", Record carries the real awaiting indicator, awaiting copy publishes the update cadence, state regions transition in place with zero layout shift, and at most one full Proof Reveal plays while other unseen results render final with a quiet marker — PRODUCT-FLOWS §4/§15

### Story 3.5: Market detail — the trust pitch

As a curious Player,
I want the question, options with live distribution, and a plain-words "where the answer comes from and why nobody can fake it",
So that the explainer sells the product's core claim.

**Acceptance Criteria:**

**Given** any launch Market
**When** its page renders
**Then** every explainer term is Glossary-defined or glossed inline, distribution shows pre-lock, and the canonical points ticket includes option, allowance, return, intake cutoff and expected settlement — FR5, UX-DR7
**And** desktop uses a 7/5 content/ticket composition; mobile keeps the same primary action through an accessible sticky action/sheet above bottom nav; lifecycle, proof and Room entry remain reachable — FR22/24, REFERENCE-DESIGN

### Story 3.6: Open Call and Settled Record cards

As Kwame and Deji,
I want one truthful Card across its open and settled lifecycle,
So that a public call can travel before lock and become proof-backed evidence later.

**Acceptance Criteria:**

**Given** a Pick at creation, lock, settlement (correct/miss) and void
**When** its Card renders anywhere
**Then** the 4:5 model exhaustively renders open/settled-correct/settled-incorrect/voided/stuck from structured real data; Open shows call/points/absolute UTC expiry and no fabricated outcome path; Settled shows outcome/score/proof; incorrect uses ash and is never hidden — FR10, UX-DR3, AD28
**And** compact in-product Card and social artifact consume the same lifecycle view model without copying reference assets or code

### Story 3.7: The Proof Reveal + proof panel

As the product's soul,
I want the settlement moment choreographed and the proof legible,
So that "Ethereum decided — here's the receipt" is something a person feels and can verify (UJ-2 climax; SM-1/SM-5).

**Acceptance Criteria:**

**Given** a Player's Pick on a resolving Market
**When** their per-player scored event arrives
**Then** the ≤4 s sequence runs in order (chip flip → decoded answer + derivation line → seven checks tick ~150 ms staggered → card flip + payout count-up → streak beat on day finalization → links last), skippable, instant under reduced-motion, with `aria-live` announcement — never before on-chain confirmation — FR15, FR16, UX-DR6, UX-DR8, UX-DR9

**Given** the proof panel and pipeline tracker
**When** any settled or awaiting Market renders
**Then** decoded values + derivation show (not just hashes), the seven plain-words checks come from the canonical shared list, both explorer links resolve (with the raw-hash fallback if the explorer is down), and awaiting states show live elapsed/usual from measured figures via the pipeline component — FR16, UX-DR5, ARCH8

### Story 3.8: How settlement works — the transparency page

As Ama (and any skeptic),
I want the pipeline in plain words plus the live settlement log,
So that the product's biggest claim has a public, always-on exhibit.

**Acceptance Criteria:**

**Given** the transparency page, logged-out, one tap from the footer
**When** it renders
**Then** the seven checks appear verbatim from the canonical list, every settlement to date shows event/attested/proven timestamps (observed-not-proven labels on the first two, tx link on the third), paginated, doubling as the in-product Integration Summary face — FR17, AD-18, UX-DR7

### Story 3.9: Reels — rapid Market discovery

As a mobile-first Player,
I want to move through one real Market at a time and act without learning a second composer,
So that discovery is fast but the integrity model remains singular.

**Acceptance Criteria:**

**Given** admitted Markets returned by the canonical query
**When** Reels loads and the Player swipes, wheels or uses visible/keyboard controls
**Then** one Market occupies the usable viewport, next/previous uses a bounded cursor, and question/source/state/lock time plus detail/Room/share actions are present — FR23
**And** Reels imports the canonical `MarketViewAdapter` and points composer; an import/lint contract forbids local payout, availability, signature or submission logic — AD23, UX-DR14

**Given** reduced motion, feed exhaustion, a stale lifecycle or a returning session
**Then** transitions become instant, “You’re caught up” routes to Today/Upcoming, the active Market refreshes without cursor reset, and session cursor returns without an invented loop — PRODUCT-FLOWS §7

### Story 3.10: Responsive installable product

As a Player on any ordinary browser,
I want the same complete product at mobile, tablet and desktop sizes with optional installation,
So that device choice never removes a primary job.

**Acceptance Criteria:**

**Given** 1440×1000, 1024×768, 390×844 and 360×800 viewports
**When** every primary route is exercised signed-out and signed-in
**Then** no horizontal overflow, obscured action, inaccessible proof/Room, phone redirect or feature-reducing layout occurs; safe areas and ≥44px targets pass — FR22, NFR8

**Given** the production metadata
**Then** manifest, owned icons, display/theme colors and install eligibility are valid; the install prompt is state-aware, dismissible and never blocks use — FR27

### Story 3.11: Activity, Settings and recovery status

As a returning Player,
I want to understand every operation and manage the account states the product actually owns,
So that uncertainty does not require support or a reset.

**Acceptance Criteria:**

**Given** Pick, commitment, settlement, share and Challenge reports
**When** Activity renders
**Then** drafted/signed/received/committed/scored plus share/challenge operations show exact timestamps, durable/request/tx ids, last confirmed state and next action; confirmation-unknown remains amber and retry-safe — FR27, UX-DR15

**Given** Settings
**Then** system/light/dark, presentation preference, public handle/address, session/sign-out, installation and Privy/provider recovery capability render truthfully; before notification delivery exists there is no dead toggle, and after Story 7.3 only verified/supported channels expose real consent controls; no claim that Proof League can recover/export keys exists — FR27/30

**Given** logout then login
**Then** history rehydrates from server/chain projections, versioned local preferences reconcile without becoming truth, and the returning-state priority resumes — AD23, PRODUCT-FLOWS §9

---

## Epic 4: The League and Social Loop

Rivalry, seasons, and receipts that travel.

### Story 4.1: Public profiles

As Deji,
I want any Player's profile with Streak, Season Points and full uncurated Card history,
So that scouting a rival's provable record works (UJ-3).

**Acceptance Criteria:**

**Given** any Player linked from the Leaderboard
**When** their profile loads (logged-out included)
**Then** current + all-time-best Streak, Season Points, and complete Card history (hits and misses, proof links) render, uncurated, paginated — FR3
**And** a zero-Card profile renders a structural empty Record state, honest Streak placeholder and first-Market action — never a bare empty region — PRODUCT-FLOWS §8

### Story 4.2: Streaks in the UI

As a Player,
I want my streak to tick with day finalization and stay honest through stuck days,
So that the emotional spine never lies.

**Acceptance Criteria:**

**Given** a day whose last Market just settled
**When** finalization lands
**Then** the streak animates (one dignified beat), provisional days show their marker and are excluded from all-time-best until final, and break copy is calm per the voice law — FR18, AD-16, UX-DR7

### Story 4.3: Leaderboard

As a competitor,
I want the Season ranking with movement and honest tie-breaks,
So that standing means something.

**Acceptance Criteria:**

**Given** the Season field
**When** the Leaderboard renders
**Then** ranking uses exactly the on-chain keys (Season Points desc, current Streak desc, earliest commitment appearance asc, address asc — the contract-recorded values only, rebuild-asserted [review 2026-08-31]), daily movement shows, editorial top-rank treatment follows `REFERENCE-DESIGN.md`, and the full field renders ≤1 s at 200 rows via a timed seeded test — prize pool banner always visible — FR19, AD-16, AD-17
**And** the signed-in Player's sticky row renders always: ranked shows rank/points/movement; unranked shows the next scoring action; a thin field renders honestly with no fake rows — PRODUCT-FLOWS §8

### Story 4.4: Genesis Season in the UI — the pot that pays itself

As the winners (and NFR-4's unattended window),
I want the Season pool visible all season and the payout legible when it fires,
So that Sep 17 pays the right three people with nobody at a keyboard — and everyone can see it did. (Contract surface shipped in Story 2.10; this story is UI + trigger only — critic G1.)

**Acceptance Criteria:**

**Given** the on-chain Season params (Story 2.10)
**When** the Leaderboard renders
**Then** end date, pool size, and 50/30/20 split are always visible (FR20), read from chain, with the plain gloss "pays out by itself — a transaction anyone can send"

**Given** Season end
**When** `payoutSeason()` executes (worker-triggered with permissionless fallback)
**Then** the payout transactions link from the Leaderboard, winners' profiles show the paid state, and nothing draws from worker accounts — FR20, AD-17, NFR3/4

### Story 4.5: Open and settled sharing lifecycle

As Kwame before and after settlement,
I want one durable public Call URL and truthful share artifact,
So that a prediction can travel while open and later prove what actually happened.

**Acceptance Criteria:**

**Given** an authenticated owner of a valid pending Pick
**When** they explicitly publish an Open Call
**Then** the server verifies Privy identity, EIP-712 Pick/signature and window before storing the sanitized immutable public snapshot; private pending Picks remain private by default — FR11, AD25, NFR10

**Given** the durable public URL
**When** the Pick is open, committed, settled, voided or stuck
**Then** the route and 1200×1500/1200×630 images advance through the exhaustive `ShareCardViewModel` using canonical events only; open shows UTC expiry and no result, settled shows real outcome/score/proof, incorrect stays ash — FR10/11, AD28

**Given** the share sheet
**When** the user shares
**Then** native file share is attempted first, then PNG, copy link and popup-safe X intent; `published` and `sharedExternally` are distinct report states, cancellation never erases the durable link, and retry/error context stays in the sheet — UX-DR12/15

### Story 4.6: Market Rooms

As a Player,
I want to discuss a Market with people who made a real Pick,
So that the product has community without turning comments into settlement authority.

**Acceptance Criteria:**

**Given** any Market Room
**When** a visitor reads it
**Then** public paginated messages, loading/empty/error states and “Discussion is off-chain. It cannot change the result.” render without affecting Market/composer/proof availability — FR24, NFR9

**Given** a post attempt
**When** server auth, signed-message verification, eligibility against pending/committed Pick, rate limit and length/escape validation run
**Then** eligible messages append under server time; ineligible/refused/confirmation-unknown states retain the draft and provide the next action/idempotent retry; direct table updates/deletes are denied — AD27, NFR10

**Given** a report action or Room outage
**Then** the report is durable without deleting truth, and the Room alone degrades to an unavailable/retry panel while the Market and Pick flow remain green — NFR9

### Story 4.7: Copy-call context with fresh authority

As the recipient of a Call or Challenge,
I want the same Market/option context without inheriting someone else's authority,
So that following a good call remains my reviewed, signed decision.

**Acceptance Criteria:**

**Given** a valid open Call/Challenge before intake cutoff
**When** the recipient taps “Make my own Pick”
**Then** Market/option/suggested points prefill from a validated opaque id, suggested points clamp to remaining allowance, and the receiver must review and create a fresh address/nonce/signature — FR25, AD26

**Given** a locked/expired/settled source
**Then** the action becomes “View this Market” or “Play the next round”; attribution may record the source only after a real new Pick and never affects score/rank — FR25

**Given** a focused copy-boundary check inside this implementation slice
**Then** originator signature/session/nonce cannot enter the receiver request and a tampered share context fails closed with a public Market fallback — NFR10/11

### Story 4.8: Challenge builder over admitted Markets

As a Player/creator,
I want to package an existing admitted Market as a shareable Challenge,
So that I can invite a group without inventing an unprovable result.

**Acceptance Criteria:**

**Given** Create v1
**When** an authenticated Player selects a Market, short title and prompt and publishes
**Then** options, source, timing, scoring and lifecycle remain immutable; a durable public Challenge/Room/share route is created and the share sheet opens — FR26, AD29

**Given** locked/expired/unlisted Challenge states
**Then** the route preserves historical Market/Call evidence and routes to watch/settled/next Market; unlisting removes discovery only and cannot delete Picks, Cards or room audit rows — FR26, NFR9

**Given** the signed-out Create route
**Then** it explains the benefit and admitted-Market boundary with real examples, then returns an authenticated user to their draft — FR1/26

---

## Epic 5: Ready for Judgment

Real markets, judge-proof operations, and the entry itself.

### Story 5.1: Launch lineup live — Series templates authored, admission-checked, registered

As the league,
I want the launch lineup authored as Series templates (plus any one-off configs) with measured buckets,
So that from registration onward the Market Engine mints every recurring Market itself — the league feeds itself from the history window through Sep 18 (AD-21; reframed from one-off creation 2026-08-27).

**Acceptance Criteria:**

**Given** the Mainnet-Read-Gate verdict (1.2) and the pre-launch re-samples (Lido APR band; pool-race windows)
**When** the launch Series are registered (Lido yield + tips-and-fees on one source key; Pool Race if Layer C survives; the Hosted Round cadence) and the scheduler's buffer fills
**Then** each template has its written admission checklist in the repo (five rules incl. decode-feasibility, checked once per template), boundary formulas sized so no option is a foregone conclusion, the gate-fail branch swaps in Sepolia-equivalent templates, and the first scheduler-minted Markets appear on the Markets board with no human creation act — FR6, FR14, AD-3, AD-21

### Story 5.2: Hosted Round operator surface

As the operator,
I want a hidden, separately-authed admin surface to schedule Hosted Rounds,
So that a judge-safe round can run on demand in any 30-minute window — while the chain keeps me powerless over outcomes.

**Acceptance Criteria:**

**Given** the admin route (operator-secret auth per CONVENTIONS §9, never Privy player auth, unlinked from navigation, exempt from the design system)
**When** a round is created and its lifecycle runs
**Then** create→lock→settle→proof-verified completes inside 30 minutes through the identical Referee path with zero player-visible special-casing — FR21, AD-9, AD-11
**And** every player-facing Hosted Round surface carries the AD-11 luck-round copy law: framed as a future-block draw, never as skill ("Zero skill, zero operator influence. The skill league is the daily Markets.") — AD-11
**And** the permanently open Hosted Round that the liveness cron signs test-picks against exists from this story onward — flagged out-of-lineup so it never renders on player surfaces or feeds the Leaderboard; the probe re-signs one standing 10-point pick via nonce replacement so it never exhausts the allowance [review 2026-08-31] — AD-12, critic G9
**And** `verify:hosted-round` exists and asserts the create→lock→settle→proof-verified cycle completes ≤30 min — the FR-21 bound is mechanically timed, not asserted [review 2026-08-31] — CONVENTIONS §8

### Story 5.3: Judging-window operations

As NFR-4,
I want the liveness cron, upstream watch, and alerting wired,
So that Sep 6–18 survives without a developer.

**Acceptance Criteria:**

**Given** the scheduled jobs — hosted on an external scheduler (GitHub Actions cron), never on the worker they monitor, alerting on missing heartbeat as well as failed probes [review 2026-08-31]
**When** they run every 15 min (liveness) and daily (upstream watch)
**Then** probes cover Today, one market page, transparency, the nonce-replacement test-pick round-trip on the probe Hosted Round, worker `/health` last-loop-tick age, worker+escrow balances, **market supply** (≥48 h of scheduled instances + boundary-static coverage through Sep 18 — shortfall alerts), and **a Hosted Round reaching proof-verified within the last 48 h** (NFR-4 end-to-end); failures hit the operator webhook; upstream drift (gluwa versions, creditcoin3 releases, prover/faucet reachability) is reported — AD-12, AD-13, NFR4

### Story 5.4: The history window — the league runs for real

As SM-1/SM-2 and the landing's settled Card,
I want the league operating daily through the one-deployment history window (≈Sep 1–5, with earlier live days welcome), measurements folded back,
So that judging week shows genuine multi-day history and rehearsed timings.

**Acceptance Criteria:**

**Given** the stable deployment (full contract surface live before the window opens) and live Series-minted Markets
**When** the history window completes
**Then** ≥4 of 5 consecutive clean settlement days — **clean day defined: every scheduled Market that day reached proof-verified within the 60-min ceiling, zero stuck; counted from the transparency log's per-day tally, which IS the SM-2 evidence artifact** [review 2026-08-31] — ≥10 end-to-end settlements (branch-appropriate mainnet share), the judge loop rehearsed ≤5 min, SM-5's comprehension session run (≥4/5 testers on the fakeability question, **plus: each tester defines 3 of the 12 glossary terms after one unguided run, and states whether the Hosted Round is skill or chance** — validating the no-tutorial bet and the AD-11 copy law) [review 2026-08-31], and all UX timing copy reflecting measured values — FR12, SM-1/2/5, NFR2

**Given** the rehearsal procedure [review 2026-08-31]
**When** the window runs
**Then** `docs/rehearsal-checklist.md` exists and every run records: stopwatch time to Pick confirmation, interaction count (one tap/click/submitted field = one interaction — the FR-1 counting rule), the a11y items (aria-live fires, reduced-motion instant, contrast spot-checks), a Lighthouse Fast-4G cold-load run against the ≤3 s line, a Broadcast propagation probe against the ≤10 s line, and the ADDENDUM behaviors spot-checked (error-state gallery via forced-failure flags); all `verify:*` scripts pass against the live deployment with output archived in docs/; the worker failover drill (Story 2.8) executes once; escrow funding happens on the final pre-window deploy per the checklist — V1/V4/V10/A16, SM-1, NFR6
**And** the reference-fidelity matrix covers 1440×1000, 1024×768, 390×844 and 360×800 in both themes across signed-out/first/returning/loading/empty/error/open/awaiting/settled/voided-stuck states, with no overflow or missing primary job — NFR8, UX-DR16

### Story 5.5: The submission bundle

As the entry itself,
I want the demo video, five-pillar deck, Integration Summary, README, sector and bios done in the reserved window and uploaded,
So that the deadline is met with the upload that IS the entry.

**Acceptance Criteria:**

**Given** the Sep 4 code freeze
**When** Sep 4–6 executes
**Then** the bundle is complete (video URL, deck PDF answering the five CEIP pillars, standalone Attestcoin Integration Summary naming the closed vulnerability classes, README, sector selection, team bios) and the DoraHacks submission is uploaded before Sep 6 23:59 ET with confirmation captured — SM-3, AD-12

### Story 5.6: Reference-fidelity evidence and license gate

As Abu and future reviewers,
I want implementation evidence mapped back to every parity-ledger row,
So that no reference behavior silently disappears during build and no unlicensed code/assets enter the product.

**Acceptance Criteria:**

**Given** the parity ledger
**When** a release candidate is reviewed
**Then** every Exact/Adapted/Additive item links to its route, story, automated check and four-viewport screenshot/video; every Blocked item has current evidence; every Excluded item cites the explicit product boundary — NFR8

**Given** reference provenance
**Then** a dependency/source review confirms no copied source, component implementation, copy block or asset from either unlicensed pinned tree; 21st.dev/shadcn components record their own permissible provenance — authority record

**Given** forced Room/share/social failures
**Then** the evidence shows Market read, Pick submit and proof view stay functional and no social table/import can update truth modules — NFR9/10, AD24

---

## Epic 6: Creator Growth Loop

The post-v1 creator horizon is planned, not smuggled into operator shortcuts: propose, prove compatibility, review/register, publish a public record and create a reason to return.

### Story 6.1: Creator Series proposal studio

As a qualified creator/project,
I want to propose a recurring Series from an EVM event,
So that Proof League can grow beyond operator-authored content without granting settlement authority.

**Acceptance Criteria:**

**Given** authenticated Creator Studio
**When** a proposal is drafted
**Then** source chain/contract/event, subject key, derivation, option formula, timing and human explanation are captured in a versioned Class-2 draft; autosave/recovery/error states are explicit and no Market is created — AD29

**Given** unsupported chains, absence claims, cheap-to-force sources or incomplete decoder data
**Then** the studio blocks submission with the exact admission reason and a correction path — FR6

### Story 6.2: Source compatibility and admission report

As the creator and operator,
I want a machine-readable compatibility/admission report,
So that review is based on prove/decode/manipulation evidence rather than attractive copy.

**Acceptance Criteria:**

**Given** a submitted proposal
**When** checks run
**Then** chain support, event existence, decode fixture, genuine uncertainty, manipulation price, commitment margin, proof/gas budget and option coverage return a complete report with pass/fail/blocked evidence; failed/blocked items cannot advance — AD3/7/14/21/29

**And** AI may help draft explanations/config suggestions but its output is never accepted as source evidence or runtime outcome authority

### Story 6.3: Operator review and on-chain Series registration

As the operator constrained by the protocol,
I want to approve only a green immutable proposal version and register it through the existing Series path,
So that creator growth cannot create a privileged result path.

**Acceptance Criteria:**

**Given** a fully green report
**When** the operator approves and submits registration
**Then** proposal-version hash, review decision and on-chain Series tx are linked; runtime Markets are still formula-minted by AD-21 and the creator cannot edit registered truth — AD20/21/29

**Given** rejection, expiry or on-chain confirmation unknown
**Then** the studio keeps the report/draft, shows the durable/tx id when known and offers only safe next actions — UX-DR15

### Story 6.4: Public creator record and Challenge collections

As a Player,
I want to inspect a creator's admitted Series, Challenges and complete results,
So that creator reputation is earned by a visible record rather than marketing claims.

**Acceptance Criteria:**

**Given** a public creator route
**When** it renders
**Then** admitted/active/retired Series, Challenges, participation and complete settled record appear from real data with misses/voids and proof links; loading/thin/empty/error states are honest — NFR8

**And** creator analytics are descriptive operational aggregates and cannot influence score, ranking or admission

### Story 6.5: Notification and return loop with explicit authority

As a Player,
I want optional reminders for my own Market lifecycle and followed creator/Challenge activity,
So that I can return at meaningful moments without fake urgency or delegated action.

**Acceptance Criteria:**

**Given** explicit opt-in and a supported channel
**When** notifications are configured
**Then** preferences, consent version, channel verification, quiet hours and per-event controls are visible; unsupported state remains descriptive, not a dead toggle — FR27/30

**Given** a notification
**Then** it deep-links to the real Market/Call/Challenge/Record state, carries no auto-Pick/delegated signing authority, and never claims proof/scoring before canonical events — AD24/26/35

**Given** unsubscribe/provider failure
**Then** the product retains in-app Activity/Record truth, shows persistent retry/confirmation-unknown context and stops external sends when consent is absent — NFR10, AD35

---

## Epic 7: Intelligence, Analysis and Bounded Automation

The remaining compatible reference promises are explicit product work. The first three complete the human-driven product; the latter four are gated horizons whose contract/authority foundations must exist before their polished surfaces can claim success.

### Story 7.1: League Guide — grounded help beside the Market

As a Player deciding what a Market means,
I want a contextual Guide that can explain the evidence or tell me to sit out,
So that help remains close to the action without becoming an invisible trader or referee.

**Acceptance Criteria:**

**Given** a Market/proof surface in live, stale, loading, unavailable and terminal states
**When** League Guide opens from the dock, More or `?guide=1`
**Then** a versioned `GuideContext` contains only allow-listed typed Market/source/distribution/proof/own-record fields with provenance/completeness; no DB client, chain writer, signature, secret or unpublished Call enters the model boundary — FR28, AD30

**Given** the closed Guide dock on a real Market and no reduced-motion/session dismissal
**When** the page remains idle
**Then** the Proof League mark sits inside a ring derived from the nearest real lifecycle time, desktop hover/focus reveals its name, phone placement clears bottom navigation, and teasers follow the source cadence—first at 3.5 s, held 4.8 s, 4.5 s gap, three total—then rest; opening, dismissing or reduced-motion suppresses them — FR35, AD36, UX-DR26

**Given** the Guide drawer before, during and after a question
**When** its state changes
**Then** scrim/focus/Escape/return behavior is correct; starter chips appear only before the first question; branded avatar, pinned real meter and motion-safe loading/reveal remain visible; contextual follow-ups and dismissible “Review in composer” cards appear only after a valid non-failure answer; provider failure/refusal never exposes action cards — FR28/35, UX-DR19/25/26

**Given** a configured provider and any starter/user prompt
**Then** the response distinguishes known/derived/missing information, may answer/refuse/say “sit this one out”, and may emit only a schema-validated unsigned `PickIntentDraft`; “Review in composer” runs the ordinary current Market/allowance/time/signature path — FR28, UX-DR19

**Given** no credential, rejected credential, rate limit, timeout, malformed output or stale/missing context
**Then** the dock's real timing/context surface remains useful, the failure is persistent and correctly named, the prompt/draft is retained where safe, and the manual Market/composer is unaffected — AD30, UX-DR15

**And** one focused grounding/refusal evaluation proves no invented Market, option, distribution, proof phase, own Pick, score, rank or execution success; an import gate proves Guide modules cannot reach writers; no persistent personal memory ships — SM8, ARCH12, NFR11

### Story 7.2: Player Edge — the complete record explained

As a Player trying to improve,
I want a sample-aware explanation of my complete record,
So that I learn from misses and conditions instead of staring at a flattering win total.

**Acceptance Criteria:**

**Given** complete Card/scoring events
**When** the Player Edge projector rebuilds
**Then** overall and Series/source/horizon segments compute sample size, correct/incorrect/void/stuck, points committed, score yield per point, Streak/run distribution and evidence links from the same canonical projection as Record/League; rebuild diff is zero — FR29, AD31

**Given** no Cards, only provisional Cards, a thin sample, capped pagination, stale source or projector failure
**Then** `/record/edge` renders the corresponding empty/provisional/thin/partial/stale/error state with `asOf`, missing range and next action; it never presents visible rows as the full record or labels free-points outcomes as financial PnL — FR29, UX-DR20

**Given** a sufficiently-sized segment readout
**Then** every best/worst statement names the sampling floor and links to the supporting filtered Cards; incorrect and void/stuck records retain equal evidence density — NFR8, SM10

### Story 7.3: Takes, Calls feed and real lifecycle alerts

As a Player participating in the league around each Market,
I want to publish a Take and opt into meaningful lifecycle alerts,
So that the social/return loop exists without becoming result authority or fake urgency.

**Acceptance Criteria:**

**Given** a signed-in Player and admitted Market
**When** they publish a Take
**Then** length/schema/signature/rate-limit checks run, the exact Market and optional public Call/Record remain visible, durable acknowledgement precedes insertion, and known/unknown failures retain the draft/idempotency id — FR30, AD35

**Given** `/social` and Reels
**Then** real listed Takes/Open Calls may be browsed or woven between bounded real-Market cards; report/unlist changes discovery/moderation only, and feed failure leaves Market/Reels market cards/Pick/proof/Record working — FR30, NFR9/10

**Given** explicit alert intent on a Market/Call/Challenge/creator
**When** the channel is supported and verified
**Then** consent version, permission, quiet hours, per-event controls, unsubscribe and delivery status are visible; canonical outbox events alone trigger intake/commitment/proof/scored/voided/stuck copy and every notification deep-links to the current real state — FR30, AD35, UX-DR21

**And** the implementation directly exercises permission denied, expired endpoint, duplicate provider retry, quiet hours, unsubscribe, delivery unknown and attempted pre-canonical settlement/score copy; this is supporting evidence, not a separate test deliverable — ARCH16, NFR11

### Story 7.4: Combo Picks — multi-Market commitment without breaking knowability

As a Player with conviction across several admitted Markets,
I want one transparent free-points Combo,
So that a multi-call challenge has real combined stakes and settlement rather than a decorative grouped card.

**Acceptance Criteria:**

**Given** the AD-32 contract spike and threat model
**When** `ComboBook` (or proven equivalent) is implemented
**Then** it stores/verifies ordered immutable admitted-Market legs, owner, points, earliest cutoff, bounded deterministic multiplier/maximum return, explicit void policy and same daily allowance; it rejects duplicate/unknown/late legs, overflow/cap breaches and hash/reorder mismatch — FR31, AD32

**Given** leg terminal events
**When** settlement advances
**Then** a cursor applies each leg once, any caller can safely continue after deadlines, no whole-Combo win/loss is emitted early, and complete/incorrect/voided/stuck outputs rebuild the exact Combo Card/receipt — FR31, ARCH14

**Given** desktop and mobile Combo builders
**When** a Player selects legs and points
**Then** every leg, earliest cutoff, combined capped return and void behavior is visible before one EIP-712 confirmation; quote/cutoff change invalidates review, confirmation-unknown prevents blind duplicate submission, and per-leg lifecycle remains visible — UX-DR22

**And** the smallest focused Foundry fuzz/invariant checks cover multiplier bounds, allowance conservation, commit-before-knowability, idempotency, void branches and permissionless finalization before a user-visible “live” classification; they ship inside this contract slice, not as a testing workstream — AD32, NFR1/5/11

### Story 7.5: Pick from X — instruction, bounded grant and receipt

As a Player using X for public calls,
I want an instruction to become either a safe draft or a tightly bounded Pick,
So that convenience never becomes unlimited wallet authority.

**Acceptance Criteria:**

**Given** no active Action Grant
**When** a linked X instruction parses unambiguously
**Then** Proof League returns a deep link to an ordinary prefilled composer draft requiring current user signature; ambiguity/unsupported Market/action is refused with instruction id and reason — FR32

**Given** the AD-33 contract/account-policy spike, threat model and focused negative-security gate
**When** the Player reviews and signs a grant
**Then** owner/beneficiary, isolated executor, `X_PICK`, allowed Market/Series/action, max points per Pick/day, expiry and revocation nonce are explicit and cryptographically enforced; withdrawal/transfer/publish/create/proof/score/grant-widening calls are impossible — AD33, UX-DR23

**Given** an authorized mention
**When** deterministic parsing and fresh grant/Market/allowance/cutoff checks pass
**Then** the isolated one-writer/nonce-queue executor uses canonical Pick intake and emits a durable receipt linking provider instruction, grant, parsed intent, Pick and tx/status; refused/submitted/confirmation-unknown/accepted remain distinct — FR32, AD33

**Given** revoke, expiry, over-cap, replay, wrong executor/beneficiary/capability/scope or provider failure
**Then** targeted negative checks prove no Pick can be created, receipts remain inspectable in Activity, and Revoke is reachable from X, Settings and each active-grant receipt — SM9, NFR11

**And** official X account creation/credentials/live posting remain an owner-authorized external gate; this story cannot claim end-to-end completion before that gate is satisfied.

### Story 7.6: Strategy Playbooks and Agents — simulate first, automate by grant

As a Player or Creator,
I want readable Playbooks with labeled simulation and complete live performance,
So that automation can be inspected, bounded and revoked instead of trusted as a black box.

**Acceptance Criteria:**

**Given** Playbook Studio
**When** a rule set is drafted/published
**Then** human-readable inputs/actions/risk limits are stored as immutable versions; autosave/recovery states are explicit, AI assistance cannot publish/activate, and simulation uses labeled historical projection data with sample/completeness — FR33, AD34

**Given** discovery and Agent comparison
**Then** simulated and live results are visually/structurally distinct; live performance includes every resulting Pick, miss, void, failure and inactive period with Playbook version/grant/tx/score links — FR33, UX-DR23

**Given** a Player activates automation
**Then** exactly one published version binds to one `PLAYBOOK_PICK` AD-33 grant and isolated runner; updating the definition cannot mutate the active version or widen authority, and paused/unavailable/expired/revoked/out-of-scope/confirmation-unknown states are durable — AD33/34

**And** read-only draft/alert mode can ship before automation, but no control or copy may imply an Agent can execute until the same grant/security gate as Story 7.5 is green.

### Story 7.7: Proof Surface — honest structure and pipeline analytics

As a Player, Creator or judge,
I want to inspect how much real source/proof coverage exists and how the pipeline performs,
So that the product's depth and reliability are visible without borrowed finance theater.

**Acceptance Criteria:**

**Given** canonical Market/source/commitment/attestation/proof/score events
**When** the Proof Surface projector rebuilds
**Then** source-chain/contract-event/Series/horizon/lifecycle views expose admitted/open/settled coverage, option/call distribution, commitment participation, event→attestation, attestation→proof, proof→score latency and void/stuck/error rates with window/sample/source/`asOf`/completeness — FR34, AD31

**Given** partial pagination, stale dependency, thin sample or unsupported metric
**Then** the surface says partial/stale/thin/unavailable, retains last-good data and links to Status/evidence; it never displays implied probability, volatility, liquidity, price impact or “edge” without a separately approved real model/method — FR34, UX-DR20

**And** metric definitions live once in the projector package, page code only formats them, rebuild diff is zero, and all four viewports preserve filters/provenance without horizontal overflow — ARCH13, SM10, NFR8
