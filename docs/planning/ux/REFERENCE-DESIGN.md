---
name: 'Proof League — Editorial Market Floor'
status: final
created: 2026-09-02
supersedes: './DESIGN.md'
reference_contract: '../../research/reference-fidelity-2026-09-02/AUTHORITY-AND-PARITY.md'
---

# Proof League — Reference-Led Visual Contract

## 1. Direction

The product is an **editorial market floor with a cryptographic record**, not a sci-fi command console. Yosuku is the visual/product baseline; Proof League adapts the content to free points and proof settlement. ZK Freighter contributes calm step-by-step state presentation, not palette or mobile behavior.

The reference is a floor. No route may fall back to generic shadcn styling, a separate marketing palette, or the superseded cyan/amber HUD.

## 2. Tokens

### Light

| Token | Value | Use |
|---|---:|---|
| `--canvas` | `#F4EEE3` | page canvas; first-light default when system is light |
| `--surface` | `#FBF7EE` | raised cards, sheets, ticket and menus; verified Yosuku `gray-950` |
| `--surface-strong` | `#F6F0E4` | selected/quiet emphasis; verified Yosuku `gray-900` |
| `--ink` | `#141210` | primary type/rules |
| `--ink-muted` | `#5E574B` | secondary copy; verified light `gray-400` |
| `--rule` | `rgba(20,18,16,.11)` | ordinary borders/grid; stronger rules use `.20` explicitly |
| `--brand` | `#D93E1F` | light-theme vermilion |
| `--brand-deep` | `#B83214` | pressed/strong light-theme brand state |
| `--up` | `#2E6B4F` | accessible light-theme UP/correct direction |
| `--down` | `#C2381F` | accessible light-theme DOWN direction only |

### Dark

| Token | Value | Use |
|---|---:|---|
| `--canvas` | `#050505` | page canvas |
| `--surface` | `#0C0C0C` | solid dark card/sheet fallback; translucent market cards use the source alpha |
| `--surface-strong` | `#171717` | selected/quiet emphasis; verified dark `gray-900` |
| `--ink` | `#FFFFFF` | primary type/rules |
| `--ink-muted` | `#A3A3A3` | secondary copy; verified dark `gray-400` |
| `--rule` | `rgba(255,255,255,.06)` | ordinary borders/grid; stronger rules use the source step |
| `--brand` | `#E04D26` | dark-theme vermilion |
| `--brand-deep` | `#B83A1B` | pressed/strong dark-theme brand state |
| `--up` | `#34D399` | dark-theme UP/correct direction |
| `--down` | `#FB7185` | dark-theme DOWN direction only |

### Shared semantic color

| Token | Value | Law |
|---|---:|---|
| `--waiting` | `#D69A3A` | actual waiting/confirmation-unknown states |
| `--recorded` | `#817A72` | incorrect/void historical record in light theme; adapted in dark |

Red alarm styling remains forbidden. Validation/refusal uses ink, border, icon, copy and persistent layout; `--down` is not an error token. Verification-before-celebration remains absolute.

### Type

- Display/interface emphasis: **Sora**, 600–800.
- Body and controls: **Inter**, 400–700.
- Data, hashes, UTC times and serials: **JetBrains Mono**, tabular numerals.
- Editorial contrast only: **Noto Serif JP**, italic/regular, used for one phrase or proof quotation—not body copy.
- Fallbacks are explicit and metrics-compatible; fonts are locally bundled or loaded through the framework with no layout-shift flash.

## 3. Theme behavior

- First paint follows `prefers-color-scheme` unless the user has a persisted `pl.theme.v1` choice.
- An inline pre-paint script/server cookie applies `data-theme` before content paints.
- The toggle has an accessible name and visible current state; it is available in public and authenticated shells.
- Every route, share preview and state is reviewed in both themes. Share images use their own deterministic light/dark composition selected by artifact type, not the viewer's browser.
- Theme-specific semantic colors above are not flattened into one palette: Yosuku deliberately darkens vermilion/UP/DOWN on cream for contrast.
- Charts, SVGs, canvases and third-party widgets subscribe to theme changes or read CSS variables at render time. Tests toggle theme after mount in both directions; a correct clean reload does not prove a live toggle.

## 4. Composition

### Desktop shell

- Fixed 64px header with mark, Markets/Reels/Create/League/Record, More, theme and account.
- A thin live strip may show real next-lock/settlement facts. It cannot animate fabricated market data.
- Content width 1280px max; 24–32px page gutters; 1px rules create the grid.
- Market detail uses a 7/5 composition: question/chart/context left, sticky points ticket right. Under the fold: source proof, Room and related Markets.

### Mobile shell

- Compact 56px header with brand, theme and account.
- Persistent safe-area bottom navigation: Markets, Reels, Create, League, Record.
- Sticky composer action or sheet may occupy the bottom only above the nav and must not obscure proof/Room content.
- No horizontal overflow at 360px. Every target is at least 44×44px.

### Rhythm and shape

- 8px base spacing; primary section gaps 64/80 desktop and 40/48 mobile.
- Borders and whitespace carry hierarchy. Shadows are rare and shallow.
- Market cards use the source 4px radius; compact controls use 4–8px; pills remain compact state/filter/nav controls. Larger 16–22px radii are reserved for source-backed modal/studio/dock surfaces, never used as a generic default.
- Lines, ticks and mono labels may evoke a market terminal; they stay quiet and functional.
- Film grain (`.045` overlay in the source), crop ticks, torii/numbered section heads, the live ticker/marquee and selective editorial italics are required shell grammar, not optional polish.
- Intentional dark islands are allowed only when the reference/product job calls for an immersive artifact. Their complete ink/border/hover palette must be reasserted in light mode; a dark background alone is not an island contract.

## 5. Component visual contracts

### Landing Hero

Large Sora headline with one Noto Serif JP phrase, live featured Market evidence, one vermilion primary action and one proof-oriented secondary action. A visitor sees what is being predicted and how it settles in the first viewport.

### Market Board

Question-first rows/cards separated by rules. Each shows category/source, state, absolute lock/settlement time, option summary/distribution and own-Pick state. On desktop a Featured Market may expand into an instrument panel; on mobile it remains fully actionable.

### Points Ticket

One canonical visual/behavioral component reused by Market detail and Reels. It contains option controls, points presets/custom input, remaining allowance, gross return if correct, expected settlement, submit status and “not money” gloss. No balance/deposit/leverage/private controls.

### State Label

Text + icon + optional semantic tint. Canonical labels: OPEN, LOCKED, COMMITTED, AWAITING ATTESTATION, PROOF VERIFIED, VOIDED, STUCK and Pick PENDING. Color never replaces text.

### Call / Record Card

- 4:5 social-first silhouette, also used in Record grids without forcing the entire page dark.
- Open: large choice, `OPEN CALL`, absolute UTC lock, points, caller, Market and factual source. No result color or price path.
- Settled correct: outcome and proof status lead; green is earned and restrained.
- Settled incorrect: ash treatment, same information density, no hiding.
- Footer contains Proof League, short public id and proof availability—not a referral slogan.

### Proof Lifecycle

Horizontal on desktop, vertical on narrow screens: Event observed → Attested → Proof submitted → Verified → Pick scored. Only reached phases appear complete. Active phase breathes under motion-safe; elapsed/usual time is adjacent. No percentage bar.

### Market Room

Editorial thread with signed-player marker, timestamp, pagination and a clear persistent note: “Discussion is off-chain. It cannot change the result.” Posting errors stay in the composer slot with retry/context.

### Reels

One Market fills the usable viewport between header and bottom nav. Question/source/time lead, real distribution/supporting facts follow, canonical composer actions remain reachable. Motion is snap/slide under motion-safe and instant under reduced motion.

### League

Large editorial rank numerals, dense but legible rows, current-user sticky bar and real venue stats. Loading/thin/empty/error states preserve the table geometry. No fake podium people.

### Activity and Settings

ZK Freighter's calm utility density: plain rows, explicit status, exact timestamps, durable ids/hashes and next actions. These surfaces do not become marketing pages.

### League Guide

A floating Proof League mark with a ring derived from the nearest real Market/proof timing opens one contextual drawer. Desktop hover/focus reveals “League Guide”; phone retains the compact mark above the bottom navigation. Three motion-safe teaser bubbles invite interaction, then rest. The drawer owns a compact live meter, branded assistant avatar, thread, starter/follow-up chips, answer/loading/refusal treatment, input and a clear no-provider/error state. “Review in composer” cards appear only after a genuine non-failure answer and may prefill an ordinary draft; no button implies the Guide placed or signed a Pick. On phone the drawer becomes a full-height sheet above safe areas; on desktop it is a right rail that keeps the Market visually present.

### Player Edge

An editorial report, not a casino PnL dashboard: one complete-record curve/readout, sample/completeness label, segment bars and linked evidence rows. Correct and incorrect results have equal information density. Thin samples do not receive a trophy treatment or confident “best edge” label.

### Takes, Calls feed and alerts

Takes/Open Calls carry author, Market, timestamp and opinion/publication state in the same editorial grammar as Reels. The Market remains the dominant object. Alert controls use calm utility rows for permission, channel, quiet hours and events; browser/provider errors stay inline and no ringing/glowing urgency appears without a real deadline.

### Combo Slip

Desktop uses a bounded leg browser with a sticky slip; mobile uses stacked leg cards and one review sheet above bottom navigation. Ordered legs, earliest cutoff, points, combined capped return and void policy are visible before confirmation. Per-leg lifecycle remains readable after submission and the whole Combo never receives a win/loss stamp early.

### Pick from X / Playbooks / Agents

Authority is presented as a receipt/policy object: fixed executor and beneficiary, allowed scope, points caps, expiry and one prominent Revoke action. Instruction, grant, Pick and tx ids use mono type. Simulated and live results have structurally different labels/surfaces; an Agent leaderboard cannot hide inactivity or misses.

### Proof Surface

Dense editorial analysis with real filters, metric definition/provenance, sample/window, updated time and completeness on every view. It may use small multiples and distribution bars, but never a decorative price/volatility chart unsupported by Proof League data.

## 6. Motion

- 120–220ms control/sheet transitions; 250–400ms route/section reveal; no perpetual ambient animation except real awaiting/live indicators.
- Source easing set is canonical: `cubic-bezier(.4,0,.2,1)`, `cubic-bezier(.22,1,.36,1)` and the restrained bounce `cubic-bezier(.34,1.56,.64,1)` for the few source-backed dock/toast moments.
- Proof Reveal keeps the existing evidence-first order but adopts the editorial tokens.
- Reels uses snap and opacity/translate only; no 3D card toss.
- Web Share/download actions show durable state in the sheet.
- `prefers-reduced-motion` removes choreography without removing sequence or meaning.

## 7. Copy and content imagery

- Plain language, short sentences, no casino vocabulary or fake urgency.
- “Make my own Pick” is the copy action; never “copy trade”.
- “Open Call” means unresolved; “Settled Record” means proof-backed outcome.
- Use official or project-owned marks for known assets, chains, protocols and social providers. BTC uses the Bitcoin mark, ETH/Ethereum uses the Ethereum mark, Creditcoin/Attestcoin uses its approved mark and X uses the X mark; a text acronym inside a colored circle is not a substitute. Keep accessible names and useful adjacent copy even when the visible control is icon-led.
- Player identity uses a deterministic address-derived identicon or a user-supplied approved image. Do not invent portraits or use one/two-letter avatar circles. League Guide uses the owned Proof League assistant mark.
- Record every mark's source, license/trademark guidance and allowed monochrome/color variants. Reference assets are not reusable merely because they are visible in the supplied projects.
- No stock photography, influencer portraits, invented charts, invented trade ticks or fake testimonials.
- League Guide copy distinguishes known, derived and unavailable. X/Agent copy says “authorized within these limits”, never “connected” as a substitute for scope.

## 8. Do / do not

Do:

- match the reference's cream/black/vermilion editorial hierarchy and responsive product density;
- treat light and dark as equal products;
- keep action and proof in the same Market experience;
- keep Cards/share artifacts truthful across open and settled states;
- keep persistent error/retry context in the action slot.
- preserve grain, crop marks, numbered/torii section rhythm, ticker, editorial italic accents and theme-specific contrast values across routes.
- use recognizable marks consistently across Market rows, tickets, Cards, Reels, Guide context, filters, source links and share sheets.

Do not:

- restore COMMAND DECK cyan/amber/green or its angular banner/card-glow vocabulary;
- theme shadcn defaults ad hoc per page;
- ship desktop-only nav, a phone gate or hidden mobile jobs;
- use toast-only errors, fake progress, fake live rows or celebratory green before proof;
- copy code/assets from either reference until licenses are resolved.
- collapse League Guide, Combo, X/Agent authority or Proof Surface into generic chat/card/dashboard templates that erase their flow/state contracts.
- replace an available BTC/ETH/X/protocol mark with initials, a random glyph, a colored letter circle or a fake avatar.

## 9. Component sourcing rule

At implementation time, search 21st.dev and shadcn for structural primitives (sheet, dialog, tabs, command, navigation, carousel/snap container, table, tooltip). Record source/provenance in the component file. The reference contract, tokens, states and responsive composition win over registry defaults. A registry component is raw material, not design authority.

## 10. Product identity and micro-interaction contract

### Mark system

- One typed mark registry maps supported `asset`, `chain`, `protocol`, `provider` and `player` identities to a local owned/approved SVG or deterministic identicon renderer.
- Marks retain their recognizable geometry. Theme adaptation may choose an approved monochrome variant or surrounding plate; it may not redraw the brand into an unrelated icon.
- Compact Market rows show mark + symbol/name; icon-only buttons expose an accessible name and hover/focus tooltip. Tooltips never carry required product facts and are not the only label on unfamiliar actions.
- Missing optional marks fall back to one neutral category glyph plus the full visible name. They never silently reuse another asset mark or manufacture a letter-avatar logo.

### Overlay hierarchy

- **Tooltip:** supplementary label/help on hover and keyboard focus; no transaction, proof or error state.
- **Popover/teaser:** non-blocking contextual invitation anchored to its control; dismissible, capped, never repeated on every render and never styled like an OS/provider notification.
- **Sheet/drawer/dialog:** one blocking overlay at a time. It traps focus, closes by its visible control and Escape/back where safe, returns focus to the opener and respects mobile safe areas/bottom navigation.
- **Toast:** at most one visible. It may echo a durable success or non-critical note but never owns refusal, recovery, confirmation-unknown, proof or signing state.
- Opening auth, share, report, Guide or composer review from another overlay closes/hands off the previous overlay instead of stacking a second modal.

### League Guide invitation details

- `GUIDE_TEASER_FIRST_MS = 3500`, `GUIDE_TEASER_HOLD_MS = 4800`, `GUIDE_TEASER_GAP_MS = 4500`, `GUIDE_TEASER_POPS = 3`; all live with the Guide feature and carry why-comments.
- The teaser sequence stops while the drawer is open, after its capped run, when dismissed for the session, or when reduced motion is requested.
- The dock ring and urgency derive from real Market/proof lifecycle timing. No arbitrary looping progress or glow is allowed.
- Initial starter chips show only before the first question. Follow-up chips derive from the last valid answer. Failure/refusal never unlocks action cards, and “sit this one out” offers non-pressuring follow-ups.
- Loading dots/type reveal are motion-safe; reduced motion preserves the state and reveals the answer without choreography.
