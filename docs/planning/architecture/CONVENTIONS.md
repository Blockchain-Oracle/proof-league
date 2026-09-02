---
title: 'Engineering Conventions — Proof League'
type: architecture-companion
spine: './ARCHITECTURE-SPINE.md'
status: final
created: '2026-08-27'
updated: '2026-09-02'
provenance:
  - 'zk-freighter teardown (research/reference-teardowns-2026-08-27/zk-freighter.md)'
  - 'yosuku teardown (research/reference-teardowns-2026-08-27/yosuku.md)'
  - 'spine Consistency Conventions (naming, ids, state, time, a11y, contracts, targeted verification)'
  - 'reference-fidelity-2026-09-02 authority/parity ledger + FIDELITY-ARCHITECTURE-REVISION.md'
---

# Engineering Conventions

Extends the spine's Consistency Conventions with the layers it left open: file size, internal folder structure, constants, schema ownership, env inventory, styling, and error handling. **Law of this document: a rule must name its enforcement or acceptance observation (lint, compile/build check, small script, direct browser inspection, focused safety check or story AC).** Both reference repos proved it: the enforced 300-line cap held for 23k LOC; the documented-but-unenforced rules were violated within the same repo that wrote them.

## 1. File-size law

- **`max-lines: ["error", {"max": 300, "skipBlankLines": true, "skipComments": true}]`** in the flat eslint config, day 1, over `apps/**` and `packages/**` TypeScript. Evidence: zk-freighter's largest file across 23k LOC is 299 lines and every screen stays readable; yosuku's quality/size correlation is strongly negative (its best components are <250 lines, its worst are 1,600).
- Exemptions live in the eslint config as explicit per-file overrides, each with a one-line justification comment. Expected initial list: generated ABI files in `packages/chain`.
- A raw-line repo sweep script (cap 400, catches CSS, SQL, config and non-TS source) ships day 1. Generated/vendor files require explicit justified exemptions.
- **Pre-split config modules so nothing grows to the ceiling** (zk-freighter's `networks.ts` sat at 298/300 with no natural seam left): `packages/chain` starts as `chains.ts` / `contracts.ts` / `endpoints.ts`, never one `networks.ts`.

## 2. Monorepo & internal structure

Top level is the spine's Structural Seed (contracts/, apps/web, apps/worker, packages/shared, packages/chain, docs/). Inside:

### apps/web
```
app/                    # route groups per AD-23: (public), (product), (account), (operator), api
components/
  ui/                   # themed base primitives; registry provenance at the component site
  shell/                # desktop header, mobile bottom nav, More/account, ThemeToggle
  market/ reels/ record/ room/ share/ onboarding/ identity/ overlays/
features/               # auth/calls/challenges/markets/picks/rooms/share/theme
                        # each owns schema/service/view-model/errors; no route forks domain rules
lib/                    # server-only auth/db/config + route-safe format/helpers
hooks/                  # usePoll (visibility-aware, fires once on tab-return, exports its cadence
                        #   so the UI can print "Checking every Ns" — yosuku doctrine), useRealtime
```
- Shared state/control patterns belong in the narrowest named component folder and import their canonical view model. Inline duplication of state text, payout math, signing or availability is a review failure. StateChip enforcement remains the multi-word grep plus restricted state-literal union rule.
- Components are sourced from the 21st.dev registry/CLI where a fit exists, provenance is recorded, and `REFERENCE-DESIGN.md` wins over registry styling.

### apps/worker
```
src/
  scheduler/            # AD-21 series scheduler (rolling buffer)
  pipeline/             # watch -> attest-wait -> prove -> submit -> project; each phase a pure
                        #   function returning a report object (§6), composed by the loop
  ledger/               # proof units + CTC gas (AD-7)
  projector/            # sole writer of truth projections (AD-8)
  loop.ts               # self-rescheduling setTimeout + re-entrancy guard (zk-freighter indexer
                        #   pattern): a failed round logs and reschedules, never kills the loop
```

### packages/shared — the canonical single sources (spine ARCH8), now with homes
| Canonical thing | Home |
|---|---|
| Seven-checks list (verbatim copy source) | `checks.ts` |
| Payout & points math | `payout.ts` |
| EIP-712 `hashPick` + **domain params (name `ProofLeague`, version `1`, chainId from packages/chain; verifyingContract = deployed LeagueCore via packages/chain)** | `pick.ts` |
| Derived-state functions (chip states) | `market-state.ts` |
| Time util + `INTAKE_QUIET_PERIOD` (≥ 60 s) + `MIN_COMMIT_MARGIN` + `SEASON_CHALLENGE_WINDOW` (6 h) + measured-settlement constants | `time.ts` |
| Market/Series config schema (zod) | `config.ts` |
| `Result<T, E>` + error copy maps (§6) | `result.ts`, `errors.ts` |
| Drizzle schema + migrations + RLS policy files (§4) | `db/` |
| Share/call/challenge/Room discriminated domain contracts | `domain/social.ts`, `domain/share.ts` |
| Deterministic open/settled/voided/stuck share view model | `flows/share-card.ts` |

## 3. Constants law

- Domain constants are **module-scope `SCREAMING_SNAKE` in the file that owns the behavior**, each with a one-line why-comment (yosuku habit; their every non-obvious constant carries one). No central constants.ts dumping ground.
- Cross-plane canonical values live only in `packages/shared` (table above); chain addresses/endpoints only in `packages/chain`. Enforcement: the AD-2 import zones + AD-6 chainKey-literal ban (eslint `no-restricted-imports` / `no-restricted-syntax`), already spine law.
- Prefer `Record<Union, X>` lookup tables over switch statements for state→value maps (both repos); `as const satisfies` for config tables so literals stay narrow but shape-checked.
- Client storage keys are versioned: `pl.<name>.v1` — a schema change is a key bump, never a migration.
- Shell navigation, tutorial version, theme key, share sizes and Room limits each live in their owning typed module; no new central dump is permitted (AD-22..28).

## 4. Database schema ownership

- **`packages/shared/db/` solely owns the Drizzle schema, migrations, and RLS policies (as migration SQL files).** Web imports types and query builders from it; the worker imports it for the projector. Nobody else defines a table. (Critic G3 — web and worker build against the same tables in parallel; without one owner the DB becomes an unfrozen contract.) Enforcement that can actually catch it [review 2026-08-31]: eslint `no-restricted-imports` makes drizzle table builders (`pgTable` et al.) importable only under `packages/shared/db` — the rebuild diff alone cannot see a rogue table defined elsewhere.
- Initial schema (class-1 truth + class-2 operational tables per AD-18/24) is created in **Story 1.3** alongside chain config. It includes the AD-24 social tables from the revision; RLS keeps truth worker-written, pending Picks owner-controlled before cutoff, public calls/challenges listed-read/owner-unlist, and Room mutation server-verified.
- Enforcement: `pnpm rebuild` diff in CI (AD-8) breaks if projector and schema drift.

## 5. Async flows: pure view-models

Every multi-step async flow gets a **pure view-model file** (`settlement-flow.ts`, `pick-submit-flow.ts`, `reveal-flow.ts`, `share-flow.ts`, `room-post-flow.ts`); the `.tsx` only renders the result. Add a small colocated verification only where uncertainty or a security-critical branch justifies it—never a test file by ritual. Rules inherited from the ZK Freighter pattern:
- Progress advances only when a **real** phase event is reached — no simulated timers, ever.
- Phase index is the **max** across received events, so late/duplicate events can never regress the tracker.
- The blocked/stalled headline derives from the phase actually reached, never hardcoded.

## 6. Error & honesty law

- `Result<T, E extends string>` for fallible domain functions; error unions are string literals so UI copy maps are `satisfies Record<E, string>` — **adding an error variant is a compile error until user-facing copy exists** (zk-freighter pattern).
- Transaction submission returns **report objects, not throws**: `{status, submitReached, error?, txHash?}`. `submitReached` decides the copy: never claim "nothing happened" when a transaction may have been broadcast. A thrown exception means a genuine bug and gets the honest "we lost track — check your Cards before retrying" branch.
- Every user-facing error message: ends in a next action; asserts "your points are untouched" where true; blames in 2nd person for user actions ("You cancelled the signature") and 3rd person for system ones ("The market locked while you were signing"); raw error text is demoted to a detail field plus a short ref code — never shown, never destroyed (yosuku `errorMessages.ts` + `friendlyMintAbort` doctrine).
- Enforcement: copy maps are compile-checked; `PRODUCT-FLOWS.md` §16 owns the hierarchy; review AC on each story that adds an error path.

## 7. Styling law

- **Tailwind 4 utilities + `REFERENCE-DESIGN.md` tokens as CSS vars via one `@theme` layer and `[data-theme]` dark variant — the single token system.** No parallel palette, per-page globals or styled dump. System/light/dark first-paint logic is owned by the Theme adapter.
- **`react/forbid-dom-props: ["error", {"forbid": ["style"]}]`** — inline style objects cost hover states, breakpoints, and responsiveness (zk-freighter shipped a separate mobile app to apologize for this). Exemption: computed dynamic values (bar widths, countdown arcs) via the documented eslint disable comment.
- Card and share surfaces consume one deterministic lifecycle view model. Exported images use their own owned token composition; in-product Cards participate in the current page theme while preserving information parity.
- Mobile: **one breakpoint vocabulary** (Tailwind's, mobile-first); `viewport-fit=cover` in the viewport meta + `env(safe-area-inset-*)` padding; touch targets ≥ 44px. Single app, no desktop gate — judges open phones.
- Enforcement: eslint rule above; Story 3.1 token/font/theme AC; Story 3.10 four-viewport overflow checks; a named ≤20-line lint step greps `apps/web` for ad hoc media queries outside the owned theme/safe-area file.

## 8. Delivery checks—not a testing deliverable

```
pnpm check = eslint (max-lines, import zones AD-2, chainKey-literal ban AD-6, forbid-dom-props,
                    drizzle-placement restriction §4, chip-literal restriction §2, @media grep §7)
          + tsc --noEmit
          + secret-scan        (≤20 lines of script or it's cut; private-key/token regexes)
          + overclaim-scan     (two ≤20-line steps, mechanically specified below)
pnpm build   = production web + worker build; forge build compiles contracts
pnpm rebuild = AD-8/AD-18 projection rebuild diff + Series boundary conformance (AD-21)
pnpm verify:* = one focused testnet evidence script per judged claim, owned by the feature that
               ships the claim: verify:commit (2.2) · verify:void (2.6) · verify:settlement (2.8)
               · verify:payout (2.10, minutes-long test Season) · verify:hosted-round (5.2, times
               the ≤30-min bound) — all run against the live deployment in Story 5.4, output archived
CI = GitHub Actions, on every push: check + build; add only the focused contract/conformance
     checks already justified by the implementation slice
```

Tests are not a product deliverable. There is no coverage target, testing epic, test-only story, broad automated UI/snapshot suite or parallel fixture framework. The default UI evidence is direct browser inspection of the real flow at the four reference viewports. Contract/signing/proof/allowance/grant/payout invariants receive the smallest focused negative/fuzz/invariant checks necessary inside their implementation slice. AD-36 marks and overlay behavior are inspected in the real product, including keyboard, reduced motion and live theme switching.

**Overclaim-scan, mechanically specified** [review 2026-08-31 — "unqualified provably fair" was unenforceable by grep and collided with the sanctioned Hosted Round chip label]: (a) **docs scan** — judge-facing docs (README, docs/, Integration Summary) fail on the banned list verbatim (casino vocabulary, "guaranteed", "risk-free", "instant"), and "provably fair" may appear only in a file that also contains its mechanism sentence ("blockhash" / "pre-committed block"); (b) **UI scan** — `apps/web` string literals fail on banned words, emoji, and em/en dashes (ADDENDUM §10), with one explicit allowlist entry for the Hosted Round label file, whose adjacent explainer carries the mechanism.

## 9. Env & secrets inventory (critic G4 — complete; each var maps to exactly one store)

| Variable | Used by | Store |
|---|---|---|
| `DATABASE_URL` (Supabase Postgres, new-format) | worker, migrations | Fly secrets / local `.env.local` |
| `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` (new-format publishable; NEXT_PUBLIC_ because Next.js only exposes prefixed vars to client bundles [review 2026-08-31]) | web (client) | Vercel env |
| `SUPABASE_SERVICE_KEY` (new-format secret) | worker only (AD-13) | Fly secrets |
| `WORKER_PRIVATE_KEY_1..3` | worker (creation/commits/proofs/scoring/voids) | Fly secrets |
| `ESCROW_PRIVATE_KEY` | never loaded by services — season funding is a manual op; key lives only in Abu's password manager | (offline) |
| `NEXT_PUBLIC_PRIVY_APP_ID` (client) / `PRIVY_APP_SECRET` (server only) | web / web server routes | Vercel env |
| `PROBE_PRIVATE_KEY` (liveness test-pick signer [review 2026-08-31]) | external liveness cron | GitHub Actions secrets |
| `CC3_RPC_URL`, `SEPOLIA_RPC_URL`, `PROVER_URL`, `EXPLORER_BASE_CC3`, `EXPLORER_BASE_SEPOLIA` | packages/chain consumers | Vercel + Fly (validated at boot, zod) |
| `OPERATOR_WEBHOOK_URL` (alerts) | worker + external liveness cron (which runs on GitHub Actions cron, never on the worker host it monitors [review 2026-08-31]) | Fly secrets + GitHub Actions secrets |
| `ADMIN_OPERATOR_SECRET` (G5: shared secret checked in middleware; admin surface is exempt from the design system and never uses Privy player auth) | web `admin/` routes | Vercel env |
| Preview builds | scratch Supabase project keys only — production keys never in previews (AD-13); enforced by a zod boot refinement: `VERCEL_ENV == 'preview'` with non-scratch DB refs refuses to boot (~5 lines) [review 2026-08-31] | Vercel preview env |

All testnet-value only; `zod`-validated at boot (spine conventions row); config readers take `env` as a parameter so they unit-test without mocks (zk-freighter pattern).

## 10. Comment law

Annotate every non-obvious decision with the user confusion or bug that motivated it — one line, at the decision site. This is the single strongest habit in the yosuku codebase and the reason its craft was recoverable by teardown. Enforcement: review AC ("non-obvious constants and branches carry why-comments") in Story 1.1's CI/review checklist.

## Not changing, and why

- Naming, ids/keys, state machine↔chips, canonical lists, time, a11y, contract pins and targeted verification posture: already law in the spine plus the newer fidelity revision — this file extends, never restates-with-drift.
- No prettier config: both reference repos hold style by convention; adding one to a 10-day build is churn without a defect it prevents.
- No `no-magic-numbers` eslint rule: evaluated and dropped — pure noise in practice (critic recommendation); the constants law (§3) covers the real risk.
