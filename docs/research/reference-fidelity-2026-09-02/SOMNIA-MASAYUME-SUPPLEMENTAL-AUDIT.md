# Supplemental Reference Audit — Masayume / `sommina-events`

Status: canonical audit evidence; target amendments are carried by the PRD, UX, architecture and epic revisions  
Audited: 2026-09-02  
Target corpus: Proof League in `/Users/abu/dev/hackathon/buidl-ctc`  
Reference checkout: `/Users/abu/dev/hackathon/sommina-events`

## 1. Authority and scope

Abu supplied the local Masayume checkout as an additional audit validator. It is not a fourth domain authority and does not turn Proof League into a financial market. Its job is to expose user-flow, fidelity and architecture omissions that remained after the Yosuku and ZK Freighter reconstruction.

Authority order for this audit:

1. Abu's current request: inspect the full user flow, onboarding, colors and secondary capabilities including Sensei, Parlay and X-trade; amend the Proof League planning corpus where the product promise is compatible.
2. Proof League's existing EVM/Creditcoin/Attestcoin product and cryptographic boundaries.
3. The current Yosuku pin in `AUTHORITY-AND-PARITY.md` for visible-product behavior and visual values.
4. Masayume's source-led migration package and current implementation as evidence of how a serious adaptation preserves a product promise while changing protocol substrate.
5. The two referenced Codex tasks as process evidence only. The first was ultimately identified as work in an unrelated Sibyl checkout; the second concerned a separate `strk20.run` architecture. No product or architecture conclusion from either task is imported into Proof League.

## 2. Repository truth

| Fact | Verified value |
|---|---|
| Product | Masayume, a source-led Yosuku reconstruction on Somnia/DreamDEX |
| Branch | `feat/yosuku-source-led-shell` |
| Commit | `4f442d51ad508ef43e78f0ae66eac10725eb3ba3` |
| Commit time | 2026-09-02 05:59:28 +01:00 |
| Remote | `https://github.com/Blockchain-Oracle/masayume.git` |
| Package/runtime | pnpm 11.24; Node >=22; Next.js web app |
| Current authority | `docs/architecture/yosuku-source-led-migration/` |
| User-owned dirty state | untracked `context/screens/` and `prompt.md`; preserved and not read as target authority |
| Masayume's embedded Yosuku pin | `3c56ef52b78dae28cc198495f753480292f6a5ad`, older than Proof League's current `b499afdb...` pin |

Masayume's README and migration direction explicitly call Yosuku a minimum product baseline, not inspiration. It allows brand/protocol substitution and truth corrections, but no unapproved user-visible exclusions. That is the discipline Proof League's first revision still did not apply to several compatible capabilities.

## 3. Reconstructed Masayume product

### Shell and route system

The current implementation exposes 57 built routes. The user-facing baseline includes:

- Markets, Reels, Portfolio, Player Edge, Leaderboard, Earn, Strategies, Agents, Parlay, Surface and Trade from X.
- Creator discovery/studio/recovery, social, stats, docs, how-it-works, status, demo, pitch, download, waitlist and install/recovery support.
- Additive game routes for practice, duel, lucky, range, moonshot, line-rider and candle-hop.
- Redirect routes preserve old/deep-link intent rather than falling into 404s.

The primary/secondary navigation is defined once. Markets, Reels, Create, Strategies, Games, Leaderboard and Portfolio are primary on desktop; Sensei, X-trade, Parlay, News and Docs remain reachable through More. Mobile derives its overflow from the same tables so a desktop destination cannot disappear on a phone (`web/src/components/shell/header/nav-items.ts:28-70`).

### First run and return

The first-run flow is a five-step narrative, not a tooltip attached to one button:

1. What the product is and that it is testnet.
2. How a Window opens, closes and settles.
3. Who signs and what the wallet does.
4. Where each money pool sits, without a misleading aggregate.
5. A beginner/expert presentation choice, followed by Connect.

It is persisted with a versionable local key, skips on return and never renders a server/hydration flash (`web/src/features/onboarding/steps.ts:29-69`, `useFirstRun.ts`). Browser verification at 1440×1000 confirmed the complete sequence; 390×844 confirmed that the same product and navigation remain available on mobile.

Proof League already adapted the first three lessons, but missed the reference's closing personalization choice and the rule that first-run copy teaches the product's whole operating model, including authority and recovery, not only its slogan.

### Market-to-record loop

Masayume implements one shared live market stream across the hero ticket, chart cards, plain-language board, Reels, Sensei and portfolio projections. The current loop is:

```text
first-run or returning entry
  -> live Market hero and canonical ticket
  -> chart-card or plain-language discovery
  -> quote / sign / submit / receipt
  -> Room, Take, alert and share context
  -> open position / settled history
  -> equity, reputation, badges, Player Edge and Leaderboard
```

The implementation ledger distinguishes Done, Partial, Shell, Pending and Blocked. A future route remains visible with a precise dependency instead of being removed or populated with fake success data.

## 4. Capability evidence that changed Proof League

| Reference capability | Masayume evidence | Proof League adaptation |
|---|---|---|
| Contextual assistant / Sensei | Full dock, real countdown ring, timed teaser bubbles, live meter/tape, thread, starter prompts, contextual follow-up chips, typing/loading treatment and action handoff. The server route is provider-configured, server-key-only and performs no trade (`web/src/features/sensei/`, `web/src/app/api/sensei/route.ts:7-32`). | **League Guide** over typed Proof League read models. It preserves the contextual invitation/drawer behavior, may explain, refuse or prepare a draft, but cannot invent Market/proof/score state or sign/submit. Story 7.1. |
| Trader Edge | One complete fill projection drives record, equity, reputation, badges, edge and leaderboard, including losses/voids and incomplete-history labels (`docs/implementation/parity-ledger.md:361-457`). | **Player Edge** over complete Cards: hit/miss/void/stuck, sample size, performance by Series/source/horizon, points committed and score yield. No financial PnL language. Story 7.2. |
| Takes, alerts and social feed | Takes attach opinions to a Market; alerts are threshold/lifecycle rules; Reels reserves woven Take cards (`03-feature-adaptation-ledger.md:28-40`). | Signed **Takes/Calls feed** plus explicit lifecycle notification preferences. Neither can alter truth; feed/notification outage is local. Story 7.3. |
| Parlay | Immutable multi-leg ticket, pre-confirmation max payout and void policy, per-leg idempotent settlement (`03-feature-adaptation-ledger.md:97-108`; visible shell `web/src/app/parlay/page.tsx:4-10`). | **Combo Pick** using free points: immutable admitted-Market legs, earliest-lock enforcement, deterministic capped combined return and explicit void policy. Requires a new on-chain contract/security gate. Story 7.4. |
| Trade from X | X + wallet link, bounded `X_EXECUTOR` grant, deterministic parse/refusal, isolated executor, caps/revocation and linked receipt (`03-feature-adaptation-ledger.md:42-69`; shell `web/src/app/trade-from-x/page.tsx:4-10`). | **Pick from X**. Without a grant, only a prefilled draft/deep link. Full execution requires an owner-signed, expiring, revocable, market/action/points-capped EVM grant and a receipt. Story 7.5. |
| Strategies and Agents | Discovery, verified complete history, bounded grants, isolated single-writer runner and risk-aware ranking (`03-feature-adaptation-ledger.md:83-95`). | **Playbooks and Agents** begin read-only/simulated. Automated Picks use the same audited grant contract as X and cannot gain settlement authority. Story 7.6. |
| Surface | Real probability/spread/depth/term structure, never a relabeled unsupported volatility model (`03-feature-adaptation-ledger.md:110-123`). | **Proof Surface** shows real Proof League structure: source/Series coverage, option distribution, commitment participation, attestation/proof latency and void/stuck rates. Story 7.7. |

### Micro-interaction evidence that must survive adaptation

The Sensei surface is a small state machine, not a floating “AI” button:

- the fixed dock sits above the mobile bottom navigation and contains a ring derived from the nearest real Market close;
- desktop hover/focus expands the name while phone keeps the compact mark;
- the first teaser appears after 3.5 seconds, remains for 4.8 seconds, waits 4.5 seconds and repeats for three total invitations; opening the drawer or reduced-motion preference suppresses the sequence (`SenseiDock.tsx:17-63`, `part-02.css:213-279`);
- the teaser itself is actionable, carries a speech-tail, springs from the dock under motion-safe and never impersonates a system notification;
- the drawer has scrim, Escape/close, pinned live meter, branded assistant avatar, initial starter prompts, loading dots, answer reveal, contextual follow-up chips and an input;
- recommendation/action cards appear only after a genuine non-failure assistant answer, remain dismissible and hand off to the canonical ticket instead of creating a second signing path (`SenseiDrawer.tsx:67-174`, `SenseiTradeCards.tsx:25-43`);
- no-provider, stale and network states remain inside the drawer while the real meter and manual product stay usable.

Asset marks are likewise product information. The Yosuku Market card uses a Bitcoin mark beside BTC rather than asking typography to carry recognition alone (`reference/yosuku/components/TradingCard.tsx:14,130-133`), while X actions use the X glyph. Proof League therefore needs an owned/provenance-recorded mark registry for BTC, ETH/Ethereum, Creditcoin/Attestcoin, X and future admitted assets/sources. Visible symbols accompany useful copy where space permits; an acronym in a colored circle is not an acceptable logo or Player avatar substitute.

## 5. Capabilities considered but not imported

This audit does not silently ignore the rest of Masayume:

| Capability family | Decision for Proof League | Reason |
|---|---|---|
| Funding, Trading Balance, claim/cash-out, order book, leverage, private trade, LP/earn | Excluded | Directly conflicts with the approved free-points/no-custody/no-real-money boundary. |
| Creator earnings | Excluded | No money/fee rail is approved. Creator records and Challenge distribution remain planned. |
| Practice | Adapted | Covered by first-run teaching, dev-only fixtures and a guided first Pick; public fake outcomes remain forbidden. |
| Duel | Adapted | Challenges and copy-context provide player-vs-player distribution without a second truth loop. |
| Lucky | Adapted | The already-approved Hosted Round is the provably fair luck mode and must never be presented as skill. |
| Range | Adapted when admitted | A range may be an ordinary proof-settleable Market option formula; it does not need a financial reserve. |
| Arcade modes | Excluded from the canonical target | They do not settle real EVM source events, which is Proof League's explicit product identity. |
| Native-only app/auth bridge | Blocked/Excluded | One responsive installable web product remains the approved target. |

## 6. Visual and responsive audit

Source and browser verification agree on the actual visual system:

- dark canvas `#050505`; dark action accent `#E04D26`; dark UP/DOWN `#34D399` / `#FB7185`;
- light canvas `#F4EEE3`, raised card `#FBF7EE`, strong surface `#F6F0E4`, ink `#141210`;
- light theme remaps action to `#D93E1F`, UP to `#2E6B4F` and DOWN to `#C2381F` for contrast (`reference/yosuku/app/globals.css:4330-4349` in the Proof League pin);
- Sora, Inter, JetBrains Mono and Noto Serif JP;
- grain overlay, crop ticks, torii/numbered section heads, ticker/marquee, editorial italics, fine rules and deliberate dark islands;
- source easings `cubic-bezier(0.4,0,0.2,1)`, `cubic-bezier(0.22,1,0.36,1)` and `cubic-bezier(0.34,1.56,0.64,1)`;
- mobile compact header, persistent bottom navigation, sheets/drawers for action, and desktop enrichment without workflow reordering.

The first Proof League design revision used an invented `#FFFDF8` surface and shared dark-theme directional colors in light mode. `REFERENCE-DESIGN.md` now uses the verified light ramp and theme-specific semantic colors.

Browser verification also reproduced an important implementation trap documented by Masayume: a live dark-to-light toggle can leave an already-mounted chart with the old theme's line until reload. Proof League therefore requires live theme-toggle visual checks for canvas/SVG/chart primitives; a clean reload alone is insufficient evidence.

## 7. Resulting target product loop

The complete planned loop is now:

```text
learn / choose presentation / sign in
  -> discover in Markets, Reels or Takes
  -> ask League Guide or inspect Proof Surface
  -> make one Pick or a Combo
  -> publish, discuss, alert or invite a Challenge
  -> optionally originate a bounded Pick from X / Playbook
  -> watch commit, attestation, proof and score
  -> inspect Record, Player Edge and League
  -> share the settled record and return on the next real lifecycle event
```

Every step has a manual path. AI, X, notifications and agents are distribution/convenience planes, never the only route to Pick, proof, score, recovery or revocation.

## 8. Remaining external gates

- No Proof League implementation repository exists in this workspace.
- Reference source/assets remain behavior-only until licensing/ownership is explicitly resolved for this target.
- Full X execution is Blocked until the owner authorizes an official account/integration and the delegated-grant contract passes security review. No live account, post or credential action is authorized here.
- Combo Picks and automated Playbooks require new contract surfaces and negative tests; they are product-horizon work, not a UI-only promise.
- A model credential is optional for the League Guide. The dock/read surface must remain useful and honest when the model is unavailable.
