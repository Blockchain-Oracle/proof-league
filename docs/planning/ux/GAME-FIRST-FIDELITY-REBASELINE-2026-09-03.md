---
title: "Proof League Game-First Fidelity Rebaseline"
status: superseded_on_experience_conflict
created: 2026-09-03
superseded_by: "./LIVE-EVENT-EXPERIENCE-REBASELINE-2026-09-04.md"
task_boundary: product and UX authority for implementation; no deployment or live action
supersedes_on_conflict:
  - "../prd/fidelity-revision-2026-09-02.md"
  - "./REFERENCE-DESIGN.md"
  - "./PRODUCT-FLOWS.md"
  - "../../research/reference-fidelity-2026-09-02/SOMNIA-MASAYUME-SUPPLEMENTAL-AUDIT.md"
full_ux_inventory: "./FULL-REFERENCE-UX-INVENTORY-2026-09-03.md"
implementation_handoff: "../../../FIDELITY-IMPLEMENTATION-HANDOFF.md"
---

# Proof League Game-First Fidelity Rebaseline

> **2026-09-04 authority correction:**
> `LIVE-EVENT-EXPERIENCE-REBASELINE-2026-09-04.md` supersedes this document on product objects,
> event-family interaction, visual direction, navigation labels, Card naming, result ritual and
> implementation order. In particular, there is no user-facing “Market Card”; public objects are
> Event tiles/posters and Event Stages, while “Card” is reserved for the Player-owned artifact
> created after an accepted Pick. The existing cream/near-black/vermilion palette, generic option
> rows and probability-looking compositions are not protected. This document remains useful for
> compatible integrity, state, accessibility and full-flow requirements.

## 0. Decision and task boundary

Abu approved this direction on 2026-09-03 after reviewing the current implementation:

> Proof League is a game-first prediction league whose results are cryptographically undeniable.
> Questions, choices, Cards, Streaks and Games lead. Proof remains attached to the exact Market and
> exact Card, but it is progressively disclosed as the referee, not presented as the product.

The approved human loop is:

```text
understand the question
  -> choose an outcome
  -> commit free points
  -> receive a personal Card
  -> wait with honest status
  -> see the result
  -> update Streak and rank
  -> share or play again
```

The proof loop follows from the same Market/Card context:

```text
why is this trustworthy?
  -> plain-language source and lock explanation
  -> proof lifecycle
  -> technical receipt and explorer links
```

This document is the current product/experience authority where it conflicts with the 2026-09-02
fidelity corpus. It does not alter Proof League's free-points boundary, chain truth, scoring rules,
market admission, EIP-712 signing, projection rebuildability or operator authority.

This documentation task does not authorize deployment, publishing, submission, credential
creation, live transactions or reference code/asset copying.

## 1. Authority record

### 1.1 Authority order

1. Abu's latest explicit game-first direction recorded above.
2. This rebaseline, `FULL-REFERENCE-UX-INVENTORY-2026-09-03.md` and
   `FIDELITY-IMPLEMENTATION-HANDOFF.md`.
3. Proof League architecture and contracts for truth, signing, settlement, scoring and authority.
4. Yosuku for editorial product density, action-adjacent market composition and Card/share
   lifecycle.
5. The current Somnia/Masayume Games work for game selection, player-state visibility, truthful
   mode readiness, resume behavior and the lesson that Games are a primary product surface.
6. ZK Freighter for first-run, returning-user, recovery and long-running operation states.
7. The older Proof League fidelity revision for compatible scope not changed here.

The latest user decision wins when any older document says Games are secondary, excludes the
Games surface, keeps `Markets / Reels / Create / League / Record` as the immutable five-job nav,
or puts technical proof content before the Pick action.

### 1.2 Reference artifacts and verified snapshots

| Artifact | Snapshot reviewed | Authority | Reuse boundary |
|---|---|---|---|
| Proof League implementation | `/Users/abu/dev/hackathon/proof-league`, `main`, `1cba3ee4e4f4b5fb310d4d30f1c45d6ff48b5c89` before this documentation change | Current implementation truth and gap evidence | Own source |
| Yosuku | `/Users/abu/dev/hackathon/buidl-ctc/reference/yosuku`, `main`, `b499afdb16a465e2c6c3cb3990218997d98346ab` | Primary visible-product and Card/share behavior baseline | Study only. No license file was found in the pinned tree, so do not copy code or assets |
| Somnia/Masayume | `/Users/abu/dev/hackathon/sommina-events`, `main`, `8b80d066eee91cd554a415dbe022d043f3b0d385` | Games hierarchy, player meta-state and honest readiness evidence | Study only. Preserve its user-owned state and do not copy source/assets into Proof League |
| ZK Freighter | `/Users/abu/dev/hackathon/buidl-ctc/reference/zk-freighter`, `main`, `5ddf72483e1383defcbc0a17fd9dba58c5e0f0f4` | First-run, return-to-intent and recovery/state-machine evidence | Study only. No license grant recorded |
| Existing Proof League corpus | `docs/planning/` and `docs/research/` | Domain, integrity, existing product breadth and visual tokens | This rebaseline wins only for the conflicts named here |

The Somnia/Masayume repository is evolving and its reviewed `main` was nine local commits ahead of
`origin/main`. At final documentation validation it also contained user-owned modifications under
`services/ops/` and untracked prompt/spike files. Those changes were not altered or promoted to
stable reference authority. Re-verify its current commit and working tree before treating newer
behavior as evidence, and never clean or overwrite that work.

### 1.3 Confirmed, inferred and unknown

Confirmed:

- The current Market detail puts source-chain keys, emitter, event signature, subject, decoder,
  source key, commitment hash and raw thresholds before any usable Pick composer.
- The current `SettledRecordCard` is a Market resolution receipt, not a personal prediction Card.
- The current primary navigation has Markets, Reels, Create, League and Record; there is no Games
  route.
- League and Record are honest pre-feature text surfaces, not working player loops.
- The registered recurring Series list contains only Lido daily rate-ratio APR.
- CC3 reported Ethereum mainnet and Sepolia as supported source chains in the measured day-one
  probe. Creditcoin CC3 is the verification/scoring chain, not a third source catalogue entry.

Inferred and now product-approved:

- “Card” means a permanent collectible-feeling personal record, not a tradable NFT or token.
- Games should reuse the same admitted, proof-settleable Market deck and canonical Pick path.
- Streak is persistent meta-progression and belongs in the shell, Games, Card, Record and League.

Unknown or dependency-gated:

- The final Privy production configuration and embedded-wallet signing smoke.
- Which additional recurring Series will be admitted after Lido.
- Whether a real head-to-head Duel needs new contract state or can be derived from independent
  Picks and a presentation-only Challenge.
- Whether non-event arcade belongs outside Proof League, in a clearly separated local practice
  surface, or under a newly approved broader Games definition. The current verified-event Games
  rule does not decide that product expansion.
- Reference asset licensing and ownership beyond behavior study.

## 2. Product center of gravity

### 2.1 One-sentence product definition

Proof League is a free-to-play prediction league where people call the outcomes of real on-chain
events, build a permanent Card record and Streak, and can verify every result through Creditcoin.

### 2.2 What leads and what supports

Lead with:

- the question;
- the choices;
- points and the lock time;
- the Player's Pick/Card state;
- Streak, rank and the next reason to return;
- Games that organize the real Market deck into understandable ways to play.

Support with:

- the source identity in ordinary language;
- when and how the source event decides the answer;
- an honest proof lifecycle;
- technical identifiers and explorer evidence on demand.

Never lead with:

- chain keys, emitters, event signatures, decoder IDs, source keys or hashes;
- a generic explanation of cryptography disconnected from a question;
- a “settled record” that describes only the Market and omits the Player's call;
- a card-shaped container that has no ownership, lifecycle or sharing behavior.

## 3. Current product truth and catalogue boundary

### 3.1 Networks

| Role | Network | Confirmed use |
|---|---|---|
| Source | Ethereum mainnet | Lido `TokenRebased` event for the recurring daily rate-ratio APR Series |
| Source | Sepolia | Hosted Round source and committed fallback |
| Verification and scoring | Creditcoin 3 testnet | Attestcoin proof verification, Market resolution, score, Streak and League truth |

User-facing copy should say “two source chains, with results verified and scored on Creditcoin”
until the live `getSupportedChains()` reading and registered Series catalogue say otherwise.

### 3.2 Prediction inventory

Current recurring public inventory:

- one Lido daily rate-ratio APR Series;
- five outcome bands;
- Ethereum mainnet source;
- daily cadence configured in `apps/worker/src/register-series.ts`.

Existing capability:

- operator-created Hosted Rounds sourced from Sepolia;
- a future-block draw can be the honest luck-oriented mode when an admitted round exists.

Not confirmed as registered/live:

- a broad multi-chain catalogue;
- Uniswap Pool Races;
- governance, milestone or cross-chain event families;
- head-to-head Duel;
- arcade outcomes unrelated to real EVM source events.

The UI must never manufacture these to make Games look full. A planned event family can be named
only with its exact admission dependency and must not resemble a live game card.

## 4. Product objects, corrected 2026-09-04

“Card” is no longer an overloaded component name. The newer live-event authority defines four
distinct objects and reserves Card for the Player-owned artifact.

| Object | Question it answers | Ownership | Lifecycle |
|---|---|---|---|
| Event tile/poster | What can I predict? | Public Event/Market | Upcoming, open, locking, awaiting, settled, voided, stuck or unavailable |
| Event Stage | How do I understand and call this family of event? | Public Event/Market | Family-specific signal, draw, race, milestone, chamber, allocation or pulse |
| Your Card | What did I choose, what happened and what changed? | One Player and one accepted Pick | Private/open, waiting, reveal-ready, correct, incorrect, voided or stuck |
| Proof Receipt | Why is this exact result trustworthy? | Exact Event and Card context | Plain explanation, lifecycle and technical evidence |

The personal Card is one persistent record that evolves. It is not replaced at settlement and it
is not a token, NFT, transferable collectible or financial position.

### 4.1 Personal Card content contract

Always present after an accepted Pick:

- Proof League identity and a short stable Card/public id;
- Player identity from an address-derived identicon or approved image;
- Market question and event-family composition;
- selected outcome;
- committed points;
- Pick creation time and absolute UTC lock;
- source name and source chain in plain language;
- real lifecycle state;
- direct route to the exact Market.

Added only when canonically known:

- decoded result and winning option;
- correct, incorrect, voided or stuck state;
- score/points effect;
- Streak effect, only after the relevant league day finalizes;
- rank movement, only when present in the authoritative projection;
- proof transaction and technical receipt.

Forbidden:

- result color before settlement;
- fabricated probability or price path;
- fake player portrait, score, Streak or rank;
- hiding incorrect Cards;
- implying that “Open Call” means public before the Player explicitly publishes it;
- showing “0” where the system actually means not loaded or not recorded.

### 4.2 Card visual contract

- 4:5 social-first silhouette; export at 1200 by 1500.
- OG companion at 1200 by 630 for the same public URL.
- Collectible feeling comes from strong composition, serial identity, event-specific motifs,
  material texture, restrained motion and lifecycle continuity, not blockchain ownership claims.
- Open Call uses neutral/vermilion anticipation without a win signal.
- Correct uses earned, restrained green after proof and score confirmation.
- Incorrect uses ash with equal information density and no shame copy.
- Voided and stuck remain visible and explain what happened to points and Streak.
- Rate band, race, milestone, governance and draw Cards may compose information differently, but
  all keep the same identity, state, player, points, time and proof grammar.

### 4.3 Share contract

- A pending Pick is private unless the Player explicitly publishes an Open Call.
- The public URL remains stable from Open Call through Settled Record.
- Share order: Web Share with image/file where supported, PNG download, copy link, X intent.
- Share failure is persistent in the originating surface and retryable.
- A recipient sees the caller, question, choice, points and lock, then may choose “Make my own
  Pick”. No signature or spend is copied automatically.

## 5. Games and Streak

### 5.1 Games principle

Games are different ways to enter and organize the same admitted Market deck. A mode can change
presentation, pacing, social context and progression. It cannot change the Market's source,
options, cutoff, proof, outcome or scoring truth.

### 5.2 Initial mode ledger

| Mode/surface | Classification | Product promise | Readiness rule |
|---|---|---|---|
| Practice | Adapted | Learn the interaction through already-settled real Markets without changing points, Streak or rank | Historical practice only; label local practice score as non-recorded |
| Daily Deck | Adapted | One real Market at a time with fast next/previous play | Reuse Reels plus the canonical composer; show empty/end state when no real Markets exist |
| Market Play | Exact domain surface | Browse and Pick any admitted Market | Existing Markets data, redesigned question-first |
| Band Call | Adapted | Focused ordered-band play over the real Lido five-band Market | Same Market/options/composer/Card; do not copy Masayume Range reserve, quote or payout mechanics |
| Lucky Hosted Round | Adapted | A clearly labeled luck mode over an admitted future-block draw | Live only when a real Hosted Round exists; never describe it as skill |
| Challenge | Adapted, dependency-gated | Invite others to the same admitted Market and compare independent records | Presentation wrapper only in v1; requires the existing Challenge/publication work |
| Duel | Blocked | A real head-to-head session with explicit rules, resume and result | Do not ship a card or nav promise until authority, scoring and recovery are designed |
| Milestone Call | Blocked | Predict whether an on-chain threshold is reached by a deadline | Requires a real admitted milestone Series and compatible decoder before any live promise |
| Future event families | Blocked | Rate, race, milestone, governance or draw compositions | Live only after Series admission, decoder compatibility and real Market data |
| Non-event arcade | Blocked owner decision | Score-only play unrelated to a verified source event | Do not ship or erase it silently; Abu must resolve how or whether it belongs beside the approved verified-event Games rule |

Do not copy Somnia's financial modes or contract semantics. Preserve its higher-level lessons:

- Games is visible as a primary job;
- a resumable active session outranks starting a new one;
- each mode reports live, loading, unavailable or implementation-blocked truthfully;
- player identity, settings and meta-progression remain visible;
- a shared Game frame provides Back, mode/economic label, settings, progress, safe leave and resume;
- device-local sound, haptics, motion and accent settings apply consistently;
- achievements and history come only from real records, while loading and never-recorded remain
  distinct;
- missing infrastructure is named, never papered over with fixture success.

### 5.3 Game settings and feedback

- Sound is opt-in and device-local. It never owns semantic feedback.
- Haptics appear only when supported and remain optional.
- Motion offers Follow system, Full and Reduced; an explicit Player choice wins.
- Accent defaults to an address-derived treatment and never replaces semantic state colors.
- Settings apply immediately, persist locally and clearly say that nothing is signed or sent.
- Game and Streak feedback occurs only after the corresponding canonical state is confirmed.

### 5.4 Streak contract

Streak is the main return loop, not profile decoration.

- Authenticated shell: compact current Streak and provisional marker.
- Games: Streak sits near the next playable action.
- Card: current Streak may be context; Streak effect appears only at canonical day finalization.
- Record: complete day-by-day contribution, including misses, voids and provisional days.
- League: current Streak participates in the approved deterministic ranking/tie-break display.
- Signed out, loading and never-recorded are distinct states. Never render a fake zero.
- A stuck Market makes the day provisional exactly as AD-16 defines; no premature animation.

## 6. Information architecture

### 6.1 Primary jobs

Desktop primary navigation after the 2026-09-04 correction:

```text
Play | Events | League | Record
```

Mobile persistent bottom navigation uses the same four jobs. Daily Deck/Reels, `Create Challenge`, Activity,
Settings, Transparency and account actions remain directly reachable through More/account and
contextual actions. Create is relocated, not removed.

The Play surface is the default authenticated/homeward product destination. Existing route paths may
be migrated without breaking saved links. Public landing remains `/`.

### 6.2 Route intent

| Route | Job | Required target state |
|---|---|---|
| `/` | Understand and enter | Real question/game evidence, how a Pick becomes a Card, Streak/League reason to return; proof secondary |
| `/games` | Choose how to play | Real mode availability, resume state, Player/Streak summary and no fabricated catalogue |
| `/markets` | Browse questions | Question-first real board with own-Pick state and clear action |
| `/markets/[marketId]` | Understand and make one Pick | Question, choices, points, draft/review/signing, Card result, then proof explanation |
| `/reels` | Play the Daily Deck | One real Market at a time, canonical composer, finite cursor and honest end state |
| `/call/[shareId]` | View a personal Card | Stable Open Call/Settled Record lifecycle and exact Market backlink |
| `/record` | See my whole record | Cards, pending operations, Streak/points and no hidden misses |
| `/player/[id]` | See a public record | Published Cards and chain-derived League identity |
| `/league` | Compare records | Real standings, sticky own row, thin/loading/empty/error states |
| `/create` | Create a Challenge | Existing admitted Market only; no arbitrary unprovable Market creation |
| `/transparency` | Inspect system evidence | Operational/proof view with direct Market/Card context links |
| `/activity`, `/settings` | Recover and manage | Durable operations, session/theme/provider recovery and next actions |

No route should become a disconnected proof museum. Transparency may aggregate evidence, but every
receipt links to the Market and any affected personal Card.

## 7. Market detail order

The first viewport must answer four questions without technical literacy:

1. What is being predicted?
2. What are my choices?
3. How many free points am I committing and when does it lock?
4. What happens after I confirm?

Required order:

1. Market identity: question, event/source name, source chain, state and absolute lock.
2. Outcome choices and distribution, with provenance for provisional/committed counts.
3. Canonical points composer: choice, presets/custom amount, remaining allowance, potential score,
   expected settlement, review and signature state.
4. Immediate accepted-Pick result: the Player's Card with private/public choice.
5. Related game context: Daily Deck position, Streak and next Market where real.
6. “Why this result is verified” in plain language.
7. Proof lifecycle and technical receipt behind explicit disclosure.
8. Room/Challenge/related Markets without displacing the main action.

For an already locked or settled Market, replace the unavailable composer in place with exact
state, next action and the Player's Card/result if one exists. Do not leave a dead action control.

## 8. Progressive proof disclosure

### Level 1: source identity

Example form:

> This question is decided by Lido's daily staking update on Ethereum. Picks lock before that
> update can be known.

### Level 2: why verified

Explain in ordinary language:

- which source event decides the answer;
- that Market rules and outcome bands were fixed before Picks locked;
- that Creditcoin verifies evidence of that exact event;
- that score, Streak and rank update only after confirmed on-chain settlement.

### Level 3: technical receipt

Only after explicit expansion show source chain key, emitting contract, event signature, subject,
decoder, source key, boundaries, pick-set hash, transaction hashes and explorer links.

The receipt header always repeats the Market question/id and, from a personal Card, the Player's
choice/Card id. Closing the receipt returns to that context.

## 9. Visual fidelity, superseded 2026-09-04

The token/palette prescription in this section is historical and is not an implementation
constraint. The live-event rebaseline authorizes a full visual reset and requires family-specific
Event Stages before palette selection. Preserve only compatible accessibility, responsive, state and
truth requirements from this section.

The existing source-led editorial system remains authoritative:

- cream `#F4EEE3` and near-black `#050505` canvases;
- surfaces `#FBF7EE`, `#F6F0E4`, `#0C0C0C` and `#171717`;
- vermilion `#D93E1F` light and `#E04D26` dark for decisive action;
- Sora display, Inter body, JetBrains Mono facts and selective Noto Serif JP contrast;
- grain, crop ticks, numbered/torii rhythm, ticker, fine rules and restrained radius;
- equal light/dark fidelity and live theme updates for mounted primitives.

The correction is hierarchy, not a new mood board. The editorial grammar should now make play,
Cards and progression feel tangible. Avoid generic dashboard cards, neon crypto panels, glassy
futurism, casino language, fake charts and proof-heavy terminal walls.

Event-family variety must be semantic:

- rate band: ordered bands and the selected range;
- race: named contenders and finish order;
- milestone: threshold and deadline;
- governance: proposal choices and voting window;
- draw: auditable selection and explicit luck label.

Only render a composition when its real event family exists in the admitted catalogue.

## 10. Required states and recovery

Every affected surface accounts for:

- signed out, first-run, returning and exact draft restoration;
- loading, empty, thin, stale, offline/provider unavailable;
- open, locked, committed, awaiting attestation, proof verified, scored, voided and stuck;
- draft, signing, accepted, refused, retryable failure and confirmation unknown;
- Card private, publishing, published, share success/failure and unlisted;
- Streak recorded, provisional, unchanged, extended and broken;
- mode live, loading, unavailable, implementation-blocked and resumable.
- Guide context-ready, loading, refusal, provider-unavailable and valid unsigned handoff;
- Game sound/haptic support, system/full/reduced motion and persisted accent;
- navigation menu/drawer open, route-selected, breakpoint-close and focus-restored;
- first-run, skipped, authentication-refused and exact-intent-restored.

One error contract applies:

- known refusal/failure stays in the action slot with reason, effect and next action;
- retry retains the draft and uses idempotency;
- confirmation unknown is amber, durable and includes an id/hash plus safe next step;
- toast may echo but never own signing, proof or recovery state.

## 11. Parity ledger for this rebaseline

| Surface/capability | Evidence | Classification | Target promise | Data authority | Acceptance |
|---|---|---|---|---|---|
| Live-event visual system | 2026-09-04 authority; Yosuku/PIPS/Flicky/Masayume behavior evidence | Adapted/additive | Full visual reset; event families stay distinct inside one product grammar | App tokens + event presentation metadata | Black-and-white family recognition, then shipped themes |
| Event-first IA | User decision; reference play hubs | Adapted | Play is primary; Events, League, Record and complete More remain reachable | Route model | Desktop/mobile nav and first-run inspection |
| Market question and composer first | Current Market detail gap; Yosuku market/action hierarchy | Adapted | A non-developer can understand and act before seeing technical proof | Market view + Pick intake | Real open/locked/settled Market walkthrough |
| Event tile and Stage | Existing canonical Market truth plus 2026-09-04 correction | Adapted/additive | Public discovery and family-specific interaction; never called a Card | Chain/projection + presentation metadata | Event Board and Play agree |
| Personal evolving Card | PRD FR-10/11; Yosuku Card/share lifecycle | Adapted | Accepted Pick becomes one permanent personal Card | Pick + chain/projection + explicit publication | Open through settled public URL |
| Streak everywhere | AD-16; Somnia player meta-state | Additive emphasis | Visible return loop without changing deterministic math | Chain/projection | Provisional and final day inspection |
| First-run and return to intent | Yosuku tutorial; ZK Freighter state discipline | Adapted | Short versioned primer, auth at authority boundary and exact draft return | Local intent + Privy + Market truth | First/skip/refusal/return walkthrough |
| Header and complete mobile navigation | Yosuku and Somnia shells | Adapted | One route registry; four primary jobs; complete More/account routes | Route model + session | Desktop/mobile pointer and keyboard inspection |
| One-overlay coordination | Somnia runtime defect; existing FR-35 | Additive correction | Guide/menu/settings/composer never stack; typed context survives handoff | UI coordinator | Guide-to-composer and breakpoint inspection |
| Daily Deck | Existing Reels; Somnia game selection | Adapted | Fast finite play over real Markets | Canonical Market feed | Empty/end/return behavior |
| Band Call | Existing Lido five-band Market; Somnia Range interaction | Adapted | Ordered-band game presentation over the same canonical Market | Canonical Market + Pick intake | Choice/composer/Card equality with Market detail |
| Practice | Somnia Practice adapted to verified-event rule | Adapted | Learn through settled real Markets with no canonical record effect | Settled Market projection + local session | Reveal/replay/live-Market exit |
| Lucky Hosted Round | Existing Hosted Round architecture | Adapted | Honest chance mode over admitted draw | Chain + operator-created Market | Only shown when real round exists |
| Challenge | Existing FR-21/25/26 | Adapted | Social wrapper around one immutable admitted Market | Operational publication + Market truth | Receiver reviews and signs own Pick |
| Duel | No settled Proof League authority | Blocked | No UI promise until rules/truth/recovery exist | Unknown | Owner/architecture decision |
| Non-event arcade | Somnia arcade; latest “verified event deck” decision | Blocked | Preserve as an explicit unresolved product decision; do not ship or erase silently | Unknown | Owner decides exclusion, separation or new integrity model |
| Game settings, history and resume | Somnia Games | Adapted | Device-local feedback controls, real achievements/history and resumable state | Local settings + canonical records | Support/persistence/interruption inspection |
| League Guide / AI handoff | Somnia Sensei; existing FR-28 | Adapted | Grounded optional help; no-provider usefulness; unsigned handoff to composer | Real context + server AI provider | Valid action, refusal, error and no-provider paths |
| Plain proof explanation | Product diagnosis | Adapted | Trust is understandable without raw identifiers | Market/proof state | User can explain what decides result |
| Technical proof receipt | Existing proof surfaces | Exact but relocated | Full evidence remains available and context-linked | Chain/projection | Market/Card backlink and real explorer links |

An implementation sequence is not permission to remove any Exact or Adapted row.

`FULL-REFERENCE-UX-INVENTORY-2026-09-03.md` is the exhaustive companion ledger for shell,
onboarding, overlays, AI, Games, Cards, social, Activity, Settings, recovery, responsive behavior
and micro-interactions. Its Exact, Adapted and Additive rows remain required even when they are not
part of the first vertical slice.

## 12. Implementation gates

The implementation owner should deliver dependency-complete vertical slices in this order:

1. Reconcile route/nav authority and the canonical Market/Card/Game view models.
2. Complete one real open-Market loop: question -> option -> points -> sign -> accepted Pick Card.
3. Complete that same Card's waiting, settlement, score and Streak lifecycle.
4. Complete explicit publication and all share fallbacks on one stable public URL.
5. Make Record and League expose the same real Card/Streak truth.
6. Add Games as the primary selection/resume surface and reuse the canonical composer in Daily
   Deck, Market Play and real Hosted Rounds.
7. Relocate proof to progressive disclosure without removing evidence.
8. Close first-run, returning, failure, recovery, both-theme and four-viewport behavior.
9. Work through the complete companion inventory so AI, social, creator, analysis, automation and
   proof surfaces retain explicit implemented, blocked or excluded dispositions.

Do not begin by producing a full grid of attractive game shells. The first acceptance slice is one
real Lido Market through the complete personal Card loop. A shell without the loop repeats the
current fidelity error.

## 13. Acceptance gates

Product comprehension:

- In the first viewport, a new visitor can state the question, available choices, points nature,
  lock time and what they receive after confirmation.
- No raw proof identifier appears before the primary Pick decision.
- Proof is reachable from the exact Market and Card, and each receipt returns to that context.

Card integrity:

- An accepted Pick produces a personal Card, not only a toast or market receipt.
- The same record evolves through open/awaiting/correct/incorrect/voided/stuck.
- Streak effect waits for canonical day finalization.
- Share is explicit, private-by-default and works through the required fallback order.

Games integrity:

- Every live mode consumes real admitted Markets and the canonical composer.
- Every unavailable mode states whether it is loading, chain-unavailable or not implemented.
- No fake catalogue, score, opponent, achievement or history exists.
- Practice uses settled real Markets and changes no canonical record.
- Game settings persist locally, support reduced motion and never change semantic state color.
- Duel and arcade retain explicit decision/dependency states rather than silently disappearing.

Responsive fidelity:

- Inspect 1440x1000, 1024x768, 390x844 and 360x800 in both themes.
- Exercise signed-out, first Pick, returning, open, awaiting, settled, incorrect, voided/stuck,
  empty, error and confirmation-unknown states where reachable.
- Mobile retains Play, Events, League and Record; Daily Deck/Reels and contextual Create remain
  reachable through Play, context and More.
- No horizontal overflow, hidden primary action, stacked blocking overlays or toast-only errors.
- Header menus, More, onboarding, Game settings and Guide/composer handoffs restore focus and
  preserve context.

Evidence:

- Record exact route, real data state, viewport and theme for each acceptance observation.
- Separate runtime-confirmed behavior from static inspection, inference and blocked dependency.
- A passing build does not substitute for direct product inspection.

## 14. Known conflicts this document resolves

- `REFERENCE-DESIGN.md` describes an editorial market floor. The 2026-09-04 authority permits a full
  visual reset; keep only behavior and accessibility that survives the live-event design.
- FR-22 and the current nav put Create in the five primary jobs. Create remains a feature, but the
  primary jobs are now Play, Events, League and Record; Create becomes contextual/More.
- The supplemental audit excluded arcade and treated Games only as adaptations. This document adds
  a primary Games surface and changes arcade from silent exclusion to an explicit owner-decision
  blocker while retaining the approved verified-event boundary for current modes.
- The current `SettledRecordCard` name implies personal fidelity it does not have. Treat it as a
  Market resolution receipt until the personal Card contract is implemented.
- The day-one spike mentioned planned Lido and Pool Race branches, but the current registration
  script contains only Lido. Current code wins; do not advertise Pool Races as live.

## 15. Evidence index

- Current proof-first order: `apps/web/app/(product)/markets/[marketId]/page.tsx`.
- Current market-only receipt: `apps/web/components/settled-record.tsx`.
- Current five-job nav: `apps/web/components/shell/nav.tsx`.
- Current placeholder Record and League: `apps/web/app/(account)/record/page.tsx` and
  `apps/web/app/(product)/league/page.tsx`.
- Registered Series: `apps/worker/src/register-series.ts`.
- Measured source-chain support: `docs/spike-day1.md`.
- Existing Card and flow requirements: `docs/planning/prd/fidelity-revision-2026-09-02.md`,
  `docs/planning/ux/REFERENCE-DESIGN.md`, `docs/planning/ux/PRODUCT-FLOWS.md`.
- Complete surface, state and micro-interaction inventory:
  `docs/planning/ux/FULL-REFERENCE-UX-INVENTORY-2026-09-03.md`.
- Yosuku Card/share evidence:
  `/Users/abu/dev/hackathon/buidl-ctc/reference/yosuku/components/BetPlacedCard.tsx`,
  `/Users/abu/dev/hackathon/buidl-ctc/reference/yosuku/lib/openBetShareCard.ts` and
  `/Users/abu/dev/hackathon/buidl-ctc/reference/yosuku/lib/shareCard.ts`.
- Somnia Games evidence: `/Users/abu/dev/hackathon/sommina-events/web/src/features/games/` and
  `/Users/abu/dev/hackathon/sommina-events/web/src/app/games/`.
