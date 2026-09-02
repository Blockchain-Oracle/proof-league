# Proof League Reference Authority and Parity Ledger

Status: canonical reference-fidelity contract  
Created: 2026-09-02  
Target: Proof League planning corpus in `/Users/abu/dev/hackathon/buidl-ctc`  
Task boundary: product planning, UX specification, architecture amendments, epics and stories. No product implementation, deployment, publishing, or submission is authorized by this document.

## 1. Authority record

### Target authority

1. Abu's latest direction on 2026-09-02: treat the supplied products as minimum UX/product baselines down to onboarding, contextual popovers, marks/avatars, micro-interactions and recovery; preserve the fixed Proof League idea; correct the planning corpus before development; then use Plan-mode-led repo-native implementation rather than BMad development.
2. This authority record and parity ledger.
3. The PRD fidelity revision, reference-led UX contract, architecture revision, and revised `epics.md` produced in the same change set.
4. The original Proof League PRD and architecture for domain rules not amended by the revision.
5. Earlier UX documents and teardowns only as historical evidence. `COMMAND DECK` is superseded.

### Reference artifacts and pins

| Reference | Artifact | Pin / snapshot | Authority in Proof League | Reuse boundary |
|---|---|---|---|---|
| Yosuku | `https://github.com/Cybire1/yosuku` | `b499afdb16a465e2c6c3cb3990218997d98346ab`, `main`, 2026-09-01 | Primary visible-product baseline: information architecture, responsive parity, editorial light/dark system, market discovery, ticket composition, rooms, profiles, leaderboard, open/settled sharing, creator and social loops | Study behavior and structure only. README links to MIT but the pinned tree contains no LICENSE/COPYING file; do not copy source or assets until licensing is clarified. |
| Yosuku live | `https://yosuku.xyz` | Browser-verified 2026-09-02 at 1440×1000 and 390×844 | Current public rendering and responsive behavior win over stale prose when they conflict | Authenticated and local-storage-gated states were read from the pinned source when not publicly reachable. |
| ZK Freighter web | `https://github.com/Blockchain-Oracle/zk-freighter/tree/main/apps/web` | `5ddf72483e1383defcbc0a17fd9dba58c5e0f0f4`, `main`, 2026-07-03 | Secondary interaction/engineering baseline: versioned first-run state, create/import branching, recovery acknowledgement, returning-user shortcut, truthful async/report models, activity/settings and small files | Study behavior and structure only. The pinned tree has no LICENSE/COPYING file; do not copy source or assets. |
| ZK Freighter live | `https://app.zkfreighter.app` | Unreachable on 2026-09-02; navigation and HTTP fetch timed out | Blocked evidence, not a reason to omit the reference | The pinned source was built locally and the onboarding was browser-verified. |
| Masayume supplemental audit | `/Users/abu/dev/hackathon/sommina-events` | `4f442d51ad508ef43e78f0ae66eac10725eb3ba3`, `feat/yosuku-source-led-shell`, 2026-09-02 | Audit validator: source-led fidelity method, five-step onboarding, Sensei, Player Edge, Takes/alerts, Parlay, X-trade, strategies/agents, Surface, honest dependency shells and complete responsive navigation | Evidence and behavior study only for Proof League. The checkout's user-owned untracked `context/screens/` and `prompt.md` remain outside this corpus. |
| Existing Proof League corpus | PRD, architecture, conventions, epics | snapshots dated 2026-08-23 through 2026-08-31 | Domain and cryptographic authority: Creditcoin/Attestcoin, EVM source events, signed Picks, merkle commitments, proof fan-out, scoring, projections, no real money | Product-shell reductions and invented visual decisions do not outrank the latest reference-fidelity direction. |

### Reference roles

- Yosuku is the **product-shell and visual authority**.
- ZK Freighter is the **onboarding/state-machine and implementation-discipline authority**.
- Masayume is a **supplemental adaptation audit**, not a new protocol or exact visual authority. It proves that compatible secondary promises must be classified and architected instead of silently dropped.
- Proof League's existing PRD and architecture are the **domain, integrity and settlement authority**.
- Protocol-specific behavior is adapted behind explicit adapters. Sui/DeepBook, Stellar shielding, seed phrases, deposits, leverage and private trading are not silently imported.

### Explicit allowed deviations

- Keep the Proof League name, vocabulary, daily points, Cards, Streaks, Seasons, Creditcoin contracts and Attestcoin proof flow.
- Replace money/trading concepts with free-to-play points and proof-backed calls.
- No order book, funding flow, leverage, custody, real-money positions, private positions, seed phrase or wallet import. These conflict with the approved free-to-play product and are classified Excluded below. A free-points Combo is not a financial parlay and is separately specified.
- Preserve verification-before-celebration and honest waiting. Vermilion is brand/action; rose may denote DOWN direction but never errors or shame. Incorrect Cards use ash.
- Build one responsive web product. ZK Freighter's phone handoff is evidence of a gap, not a target behavior.
- Use approved recognizable marks for BTC, ETH/Ethereum, Creditcoin/Attestcoin and X plus address identicons/approved Player images; do not replace available logos or avatars with initials, colored letter circles, random glyphs or fake portraits.
- Retain the epics/stories as the complete requirements catalog, but do not use BMad build/dev/story/sprint/retrospective workflows. Tests are supporting checks rather than deliverables: no test-only stories, coverage target or broad UI automation suite.
- Do not invoke hackathon-idea auditing/scouting, saturation/collision ranking or alternative-product generation unless Abu explicitly reopens the already selected idea.

### Latest-reference deltas

- Yosuku's pinned `main` is newer than the earlier teardown and contains a larger product: Markets, Reels, Create, Strategies, Leaderboard, Portfolio, rooms, open/settled share cards and full mobile navigation.
- `origin/seriesfun` is both behind `main` and outside the user-supplied baseline; it is not authoritative.
- ZK Freighter has a newer `post-hackathon` remote branch, but the supplied URL explicitly names `main/apps/web`; `main` is the baseline.
- Masayume's embedded Yosuku pin is older than Proof League's current `b499afdb...` pin. Masayume wins only as evidence of its own adaptation and implemented flow; the newer Proof League Yosuku pin remains the visible-product authority.

## 2. Reconstructed reference products

### Yosuku product map

Primary public routes at the pin: `/`, `/markets`, `/markets/[id]`, `/reels`, `/creator/studio`, `/creators`, `/portfolio`, `/leaderboard`, `/strategies`, `/parlay`, `/pool`, `/agents`, `/fund`, `/claim`, `/trade-from-x`, `/social`, `/docs`, `/how-it-works`, `/status` and `/stats`.

Core loop:

1. A visitor understands the product on an editorial landing page with live market proof, not a feature grid alone.
2. Markets provides a hero instrument, live chart, close time, Room entry and a complete action ticket.
3. Reels converts market browsing into a fast, full-screen sequence with immediate UP/DOWN action.
4. Connect Wallet gates action, not reading.
5. Portfolio records the user's positions and outcomes.
6. Leaderboard and creator surfaces turn private action into public reputation.
7. An open call can be shared before settlement; the same lifecycle produces an honest settled card later.
8. Native share is preferred, with PNG download and X intent as fallbacks.

First-run and returning states:

- A local-storage-versioned Tutorial teaches four beats, ends in connection, and can be skipped.
- Signed-out portfolio and creator routes explain the benefit and expose one next action instead of rendering blank shells.
- Returning users enter the product directly; no repeated tutorial debt.
- Loading and thin-data states are explicit on the leaderboard and chain-backed surfaces.

Responsive contract:

- Desktop: fixed header, full navigation, live ticker, two-column market-plus-ticket composition.
- Mobile: compact header plus persistent bottom navigation for Markets, Reels, Create, Strategies, Portfolio and More; the hero market remains actionable and the ticket becomes a small-screen surface.
- All primary jobs remain available; mobile is not a diminished desktop page.

Visual contract:

- Light canvas `#F4EEE3` and dark canvas `#050505`, system-aware with a manual theme toggle.
- Vermilion is the decisive brand/action color: source-dark `#E04D26`, source-light `#D93E1F`; black/cream surfaces and fine rules carry the editorial structure.
- Sora for display, Inter for interface/body, JetBrains Mono for data, Noto Serif JP for selective editorial contrast.
- Large editorial headlines, mono ticker/time data, restrained borders, minimal radius, strong whitespace and 4:5 social artifacts.

Engineering lessons:

- Keep the product model, theme script, share-card lifecycle and responsive navigation.
- Do not reproduce the oversized route/component files or 5,849-line global stylesheet. Several key Yosuku files exceed 900–1,300 lines; Proof League keeps its enforced 300-line TypeScript limit.

### ZK Freighter web product map

First-run sequence verified from the pinned local build:

1. Brand introduction: “Privacy by default on Stellar.”
2. Mental model: public and shielded balances.
3. Boundary explanation: shielding/unshielding is visible; internal transfers are private.
4. Local-key promise with Create new wallet / I already have a wallet branching.
5. Create path: recovery phrase, explicit saved acknowledgement, device-vault password, ready state and funding handoff.
6. Import path: existing-wallet recovery input, password and ready state.
7. Returning browser: versioned intro is skipped and the wallet unlock/home path resumes.

Authenticated map: Home, Shield, Send, Receive, Activity, Settings, Unshield, Bridge, Disclosure, Confidential, Discover and Tools.

State/engineering lessons:

- Each long-running flow has a pure state/report model separate from rendering.
- Progress advances on real events and terminal errors preserve what is known.
- Activity, settings, lock/unlock and recovery are first-class product states.
- Source UI files stay under the enforced 300-line cap.
- The mobile gate redirects to a separate app. Proof League explicitly rejects this split and adopts Yosuku's same-product responsive parity.

### Masayume supplemental product map

The complete audit is recorded in `SOMNIA-MASAYUME-SUPPLEMENTAL-AUDIT.md`. Its most important correction is architectural, not cosmetic: a compatible user-visible reference capability is kept as a real route/flow with a truthful dependency state until it can be connected. It is not removed because it falls after an MVP cut.

Verified product lessons:

- Five-step first run teaches product, lifecycle, signing authority, economic pools and beginner/expert presentation before Connect.
- One shared market stream feeds hero, chart cards, plain-language board, Reels, Sensei and record projections.
- Sensei is contextual and action-adjacent but cannot execute; it reads typed live data, may refuse, and hands action to the canonical ticket.
- Player Edge uses the same complete projection as Record and League, including losses, voids and incomplete-history labels.
- Parlay, X-trade, strategies/agents and Surface keep full visible shells and name their required contracts/services; fake successful data is forbidden.
- Browser verification at 1440×1000 and 390×844 confirmed light/dark editorial parity, five-step onboarding and persistent mobile navigation. It also reproduced the documented live-theme chart-color trap, which now becomes a Proof League visual test obligation.

## 3. Proof League target product flow

### Global shell

- Desktop primary navigation: **Markets · Reels · Create · League · Record**. “How proof works”, Status, Activity and Settings live under More/profile and remain directly addressable.
- Mobile bottom navigation: **Markets · Reels · Create · League · Record** with safe-area padding. More is reached from the header/profile control.
- Public reading is always available. Sign-in gates Pick, Share-a-call, Room posting and Create actions.
- Theme follows system on first paint, persists a versioned user choice, and exposes a labeled toggle.

### First-time journey

1. Landing proves the product with a live Market, a settled proof-backed Card and a three-step “how the referee works” section.
2. A skippable, versioned five-job primer appears at the first play intent: product purpose; Pick lifecycle; wallet signing authority; free-points/public-recovery model; and Plain/Detailed presentation choice.
3. Final primer action opens Privy sign-in. No seed phrase, funding or chain selection.
4. The user returns to the exact Market and draft option/stake that triggered sign-in.
5. A guided first composer explains allowance, return and expected settlement in place.
6. Confirmation creates an Open Call Card immediately and shows its lifecycle: pending → committed → awaiting → proof verified/voided/stuck.

### Daily and social loop

1. Markets is the complete board grouped by state; Today is a filter, not the entire information architecture.
2. Reels provides rapid one-Market-at-a-time discovery without changing the underlying composer or truth model.
3. Market detail combines question, source explanation, option distribution, action composer, lifecycle tracker and Market Room.
4. An opted-in Open Call can be shared before lock. The recipient sees the exact Market and call, then chooses “Make my own Pick”; no action is copied automatically.
5. The shared URL preserves Market/call context, never a signature authority. Receiver signs a new Pick with their own nonce and allowance.
6. At settlement, the same public route becomes a Settled Record with the decoded outcome, score and proof links.
7. League ranks public records; Record is the player's complete, uncurated history; Activity and Settings close the account/product loop.
8. League Guide explains the current Market/proof state from typed readings, can say “sit this one out”, and can prepare but never sign a draft.
9. Player Edge explains the complete own record by Series/source/horizon; a Calls/Takes feed and explicit lifecycle alerts create honest return paths.
10. Product-horizon Combo, Pick-from-X and Playbook flows use ordinary admitted Markets and the same proof/scoring pipeline; only their intake/authorization surface differs.

### Creator loop

- v1 Create means **Create a Challenge** from an admitted Market or share an Open Call. It never lets a user invent an unprovable outcome.
- A Challenge chooses an existing Market/Series instance, title/copy and optional room prompt, then produces a public join link.
- Post-v1 Creator Studio is a separately phased capability: submit a Series template, run the same admission/decode checks, preview source compatibility, and await operator approval. It cannot bypass on-chain market creation or outcome rules.

## 4. Parity ledger

Classification: **Exact** preserves the visible contract; **Adapted** preserves the promise through Proof League's domain; **Additive** is user-directed or target-specific; **Blocked** lacks evidence/dependency; **Excluded** conflicts with an explicit approved product boundary.

| Reference capability | Target classification | Proof League contract | Story owner |
|---|---|---|---|
| Editorial landing with live product evidence | Adapted | Live Market + real settled Card + proof pipeline; no fake data | 3.2 |
| System-aware light/dark theme and toggle | Exact | Yosuku token/family baseline, versioned preference, no flash | 3.1 |
| Desktop full nav + mobile bottom nav | Exact | Same primary jobs on both breakpoints | 3.1, 3.4 |
| Versioned skippable tutorial | Adapted | Five Proof League jobs, then Privy; Plain/Detailed choice and exact return to intent | 3.3 |
| Create/import wallet branch | Excluded | Privy embedded wallet; no seed phrase/import ceremony | PRD non-goal |
| Recovery acknowledgement/password vault | Excluded | Provider-owned recovery; settings exposes provider recovery status only | 3.11 |
| Returning-user shortcut | Exact | Skip primer; resume latest relevant Market/result | 3.3, 3.4 |
| Activity and Settings | Adapted | Pick/settlement activity, profile, theme, session and recovery state | 3.11 |
| Markets board | Adapted | State-grouped real-event board with Today/Upcoming/Settled filters | 3.4 |
| Hero market + full action ticket | Adapted | Featured Market + points composer; no money or leverage | 3.5 |
| Reels discovery | Adapted | Full-height Market sequence reusing the canonical composer | 3.9 |
| Plain-language market board | Exact | Question-first cards; protocol details secondary | 3.4, 3.5 |
| Market Room | Adapted | Signed off-chain player discussion, visibly not proof/truth | 4.6 |
| Open call share card | Adapted | User-authorized public call before lock; truthful OPEN state and UTC expiry | 4.5 |
| Settled share card | Adapted | Real outcome/score/proof only; incorrect calls use ash | 4.5 |
| Native share → PNG → X fallback | Exact | Same fallback order, accessible status and retry | 4.5 |
| Copy another user's market/call | Adapted | Deep link pre-fills context; receiver reviews and signs a new Pick | 4.7 |
| Portfolio/record | Adapted | Complete Cards, allowance, Season Points, current/past state | 4.1 |
| Leaderboard | Adapted | Chain-derived full field, current-user bar, honest thin/loading states | 4.3 |
| Creator Studio | Adapted, phased | v1 Challenge builder; Series authoring studio is post-v1 and admission-gated | 4.8, 6.1–6.3 |
| Creator public profiles | Additive | Public challenge/record stats without hiding misses | 6.4 |
| Contextual assistant / Sensei | Adapted | League Guide reads typed Market/proof/own-record models, may explain/refuse/prepare a draft, and never signs/submits or invents state | 7.1 |
| Sensei dock, teaser and drawer micro-flow | Adapted | Real lifecycle ring; three timed motion-safe invitations; hover/focus label; starter/follow-up chips; loading/refusal; action cards only after a valid answer; canonical composer handoff | 7.1, 3.1 |
| Asset/source/social marks | Adapted | Official or owned BTC, ETH/Ethereum, Creditcoin/Attestcoin and X marks from one provenance registry; no text-initial logo/avatar substitutes | 3.1, all market/social surfaces |
| Overlay hierarchy | Exact | Tooltips are supplementary; one blocking dialog/sheet/drawer at a time; toast never carries critical state; mobile safe areas and focus return are preserved | 3.1, all interactive stories |
| Trader Edge | Adapted | Player Edge over the complete Card projection with sample size, misses, voids/stuck states and real segment breakdowns | 7.2 |
| Takes / social board | Adapted | Signed public Takes/Open Calls attached to admitted Markets and optionally woven into Reels; visibly opinion, never truth | 7.3 |
| Threshold/lifecycle alerts | Adapted | Explicit opt-in, quiet hours, event preferences, honest delivery/permission states and canonical deep links | 7.3, 6.5 |
| Parlay | Adapted, phased | Free-points Combo with immutable admitted-Market legs, earliest-lock enforcement, deterministic capped return and explicit void policy | 7.4 |
| Trade from X | Adapted, phased | No grant means prefilled draft only; full execution requires an expiring/revocable EVM grant capped by action, Market, points and day plus a linked receipt | 7.5 |
| Strategy marketplace / agents / playbooks | Adapted, phased | Read-only simulation first; automation only through the same audited grant boundary; complete performance includes misses/inactivity | 7.6 |
| Market Surface | Adapted | Proof Surface shows real source/Series coverage, call distribution and proof-pipeline latency/reliability; never relabels unsupported finance analytics | 7.7 |
| Trading balance/funding/claim | Excluded | Free points and testnet prize pool; no custody or purchasable balance | PRD non-goal |
| Leverage, private trading, order book/financial pool | Excluded | Explicitly not a betting exchange | PRD non-goal |
| LP/earn and creator earnings | Excluded | No capital-supply, fee or purchasable-balance rail is approved | PRD non-goal |
| Yosuku native/PWA parity | Adapted | Installable responsive PWA; no separate native app | 3.10 |
| ZK Freighter desktop phone gate | Excluded | One responsive product; no feature-reducing gate | 3.1 |
| Truthful async phase/report model | Exact | Pure flow/view models + `Result`/report objects + persistent recovery context | all async stories |
| Proof League proof reveal, Cards, Streaks, Seasons | Additive | Target-specific value loop; verification before celebration | 3.7, Epic 4 |

## 5. Missing and blocked evidence

- ZK Freighter hosted web app was unreachable on 2026-09-02. Source and a local browser build cover first-run and responsive gate behavior; production deployment/runtime failures remain Blocked.
- Neither pinned reference tree contains a license file. No code, component implementation, copy block or asset is approved for reuse.
- Masayume's repository/source ownership statements apply to that project, not automatically to Proof League. This audit grants no new reuse permission.
- Yosuku authenticated transaction success, private room encryption and wallet-funded states were not executed with a live wallet. Their source establishes structure, not a verified end-to-end external transaction.
- Masayume's Sensei live model reply, Parlay, X-trade, strategies/agents and Surface are not all implemented end to end; Done/Shell/Pending evidence is preserved in the supplemental audit rather than upgraded to a runtime claim.
- A live Proof League X account/integration is not authorized. Full X execution remains Blocked until owner credentials and the delegated-grant security gate exist.
- Proof League has no implementation repository in this workspace yet. All verification in this change is document consistency, not runtime product proof.

## 6. Source provenance

Primary technical sources used to constrain the architecture revision:

- Next.js 16.2 project organization, route groups/private folders and segment loading/error conventions: `https://github.com/vercel/next.js/tree/v16.2.9/docs/01-app`.
- Tailwind CSS theme variables and data-attribute dark mode: `https://github.com/tailwindlabs/tailwindcss.com/blob/main/src/docs/dark-mode.mdx`.
- Privy React setup and access-token verification: `https://docs.privy.io/basics/react/setup` and `https://docs.privy.io/authentication/user-authentication/access-tokens`.
- Supabase private Broadcast authorization and RLS: `https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/realtime/broadcast.mdx`.
