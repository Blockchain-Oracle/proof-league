# AGENTS.md — Proof League implementation repository

Read `project-context.md` first, then the canonical planning set in `docs/planning/` (authority
order lives in project-context). This file is the working law distilled from
`docs/planning/architecture/CONVENTIONS.md` and the architecture spine; the source documents win
on any conflict.

## Non-negotiable laws

- **Truth**: the chain is the only writer of truth (AD-1). The worker is the sole tx submitter
  and sole writer of class-1 projections. The web app's one write path is EIP-712 Pick intake.
  No settled/correct state renders before its on-chain transaction is confirmed.
- **Planes** (AD-2): `apps/*` import only from `packages/*`; `packages/*` import nothing from
  apps. Enforced by eslint import zones.
- **File size**: 300 effective TypeScript lines (eslint `max-lines`, error), 400 raw lines for
  CSS/SQL/config/Solidity (`scripts/raw-lines-sweep.mjs`). Pre-split modules before they grow.
- **Constants**: module-scope `SCREAMING_SNAKE` in the file that owns the behavior, each with a
  one-line why-comment. No central constants dumping ground. Cross-plane canon lives only in
  `packages/shared`; chain identity only in `packages/chain`.
- **Errors**: `Result<T, E extends string>` + compile-checked copy maps; tx submission returns
  report objects with `submitReached`. Every user-facing error ends in a next action.
- **Honesty**: no fake data, no fabricated progress, no optimistic settlement, no celebration
  before proof. Waiting states show real elapsed/expected times from measured figures.
- **Styling**: Tailwind v4 tokens from `REFERENCE-DESIGN.md` via one `@theme` layer and
  `[data-theme]`; `react/forbid-dom-props` bans inline style objects.
- **Verification** (NFR-11): tests are supporting checks, never deliverables. No testing epic,
  coverage target or broad UI suite. Security-critical contract/signing/proof/allowance/grant/
  payout invariants get focused negative/fuzz/invariant checks inside their implementing slice.
  UI fidelity is accepted by direct browser inspection at 1440x1000, 1024x768, 390x844, 360x800
  in both themes, including live theme toggling of mounted chart/SVG/canvas primitives.
- **Workflow**: implementation agents start in Plan mode per
  `/Users/abu/dev/hackathon/buidl-ctc/AGENT-IMPLEMENTATION-PROMPTS.md`. No BMad build/dev/story/
  sprint workflows; no hackathon-idea or pivot workflows. The product identity is fixed.

## Commands

- `pnpm check` — eslint laws + raw-line sweep + typecheck + secret-scan + overclaim-scan
- `pnpm build` — web + worker + packages; `forge build` in `contracts/`
- `pnpm rebuild` — AD-8 projection rebuild diff (armed in Story 1.3)
- `pnpm verify:<claim>` — one focused testnet evidence script per judged claim (armed by owning stories)

## Review checklist (every change)

1. Non-obvious constants and branches carry why-comments naming the confusion/bug they prevent
   (comment law, CONVENTIONS §10).
2. No inline duplication of state text, payout math, signing or availability — import the
   canonical module.
3. New error variants have copy before the compiler lets them ship.
4. UI strings: no casino vocabulary, no emoji, no em/en dashes (overclaim-scan enforces).
5. Reference repos (`/Users/abu/dev/hackathon/buidl-ctc/reference/*`) are behavior evidence
   only — no copied code, copy blocks or assets; both trees carry no license grant.
