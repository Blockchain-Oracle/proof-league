---
title: 'PRD Fidelity Revision: Proof League'
status: final
created: '2026-09-02'
supersedes_on_conflict:
  - './prd.md'
  - './addendum.md'
source_contract: '../../research/reference-fidelity-2026-09-02/AUTHORITY-AND-PARITY.md'
---

# PRD Fidelity Revision — Proof League as a Complete Product

## 0. Purpose and change rule

This revision corrects the product scope after full reconstruction of the two references Abu supplied and a supplemental source/runtime audit of Masayume. It does not replace Proof League's EVM/Creditcoin integrity model. It replaces the earlier decision to treat the references as loose inspiration and the resulting desktop-first `COMMAND DECK` shell.

Read this file with `prd.md`. On conflict, this revision wins. Requirements not named here remain unchanged. The revised canonical requirement set is **FR-1..35 and NFR-1..11**.

## 1. Revised product thesis

Proof League is a public prediction record for real Ethereum events. A person can discover a question, make a free-points call, discuss it, share the call while it is still open, and later return to the same URL to see what Ethereum decided and how Creditcoin proved it. The loop is not complete at “place a Pick”; it is complete at **discover → call → share/discuss → verify → build a public record → return**.

The reference promise is preserved without importing their protocols:

- Yosuku contributes the editorial market floor, complete action surface, Reels discovery, Market Rooms, public record, leaderboard, share lifecycle and mobile parity.
- ZK Freighter contributes versioned first-run teaching, returning-user shortcuts, explicit recovery states and pure async flow models.
- The Masayume audit contributes the compatible capabilities the first revision still missed: contextual assistant, Player Edge, Takes/alerts, Combo, bounded X-originated action, Playbooks/Agents, a truthful analytical Surface and the small overlay/identity details that make those surfaces feel complete.
- Proof League contributes free points, Cards, Streaks, Seasons and proof-settled EVM outcomes.

### Glossary additions

- **Open Call** — the explicitly published public presentation of a Player's still-unresolved signed Pick. It expires at the Market intake/lock boundary and never implies an outcome.
- **Settled Record** — the public Card presentation after canonical scoring/void/stuck state is available, including the real outcome and proof where one exists.
- **Record** — the complete own-player history surface: Cards, allowance/Season Points and operation status. It is not a curated portfolio.
- **Reels** — a one-Market-at-a-time discovery presentation over the same admitted Markets and canonical composer.
- **Market Room** — off-chain discussion attached to one Market. It cannot change source, outcome, proof, score or rank.
- **Challenge** — a shareable presentation/distribution wrapper around one already-admitted Market. It cannot change truth-bearing Market fields.
- **Creator** — a Player/project that publishes Challenges or proposes Series. Creator status conveys no settlement or admission authority.
- **League Guide** — a contextual assistant over typed Market, proof and own-record readings. It may explain, refuse or prepare a draft; it has no truth, signing or submission authority.
- **Player Edge** — a complete own-record analysis by Series, source and horizon. It includes misses, voids/stuck states and sample size; it is not financial PnL.
- **Take** — a signed public opinion attached to an admitted Market or Call. It is social content, not result evidence.
- **Combo** — one free-points commitment containing immutable Picks on multiple admitted Markets, locked before the earliest leg becomes knowable and scored by a deterministic capped rule.
- **Action Grant** — an owner-signed, expiring and revocable authorization that fixes executor, beneficiary, action kind and Market/points/day limits. It never grants withdrawal, transfer, settlement or Market-creation authority.
- **Proof Surface** — an analytical view of real source/Series coverage, call distribution and settlement-pipeline timing/reliability; it never labels unsupported financial analytics as product truth.

## 2. Revised user journeys

### UJ-1 — First call, no ceremony

Kwame arrives from a shared call on a phone. The public page shows the caller, question, choice, lock time and why the answer cannot be hand-graded. “Make my own Pick” opens the same Market. A five-job primer appears once, can be skipped, and ends in Privy sign-in. His chosen option and stake draft survive sign-in. He confirms his own EIP-712 Pick in under two minutes. His Open Call Card appears immediately with a real expiry and “settles ~{time}”.

### UJ-2 — Browse the market floor

Deji opens Markets on desktop. A featured Market and points composer sit above a state-grouped board. He switches to Reels on mobile and moves through one full-height Market at a time without losing the canonical composer behavior. He opens the Market Room, reads signed player comments, and makes a Pick. Discovery is not a landing-page-only concern.

### UJ-3 — Share now, prove later

Kwame explicitly publishes his Open Call. Native share is attempted first; PNG download and an X intent remain available. A recipient opens a 4:5 call artifact and public route. Before lock, the route offers “Make my own Pick”; it never auto-signs or spends points. After settlement, the same route becomes a Settled Record with the decoded answer, score, seven checks and explorer links. Incorrect calls remain visible and use ash, not shame or fake celebration.

### UJ-4 — The proof ritual

The Market moves through committed, awaiting attestation and proof verified using real events only. The Player can leave; Activity and Record retain the operation. When scoring lands, one Proof Reveal plays, then the same state is available as static evidence. A long wait shows phase, elapsed time, expected range, tx hash when known and an explicit retry/recovery action where one exists.

### UJ-5 — Rivalry and identity

Deji opens League, sees an honest loading/thin/full field, then the deterministic ranking and his sticky row. A Player/Creator profile shows every Card, Challenge and result without hiding misses. He follows a shared call into the Market, reviews it, and signs a distinct Pick. Reputation is a record, not a vanity profile.

### UJ-6 — Create a Challenge safely

Ama chooses Create. In v1 she can select only an admitted, already-created Market, add a short challenge title/prompt and publish a join link. The challenge cannot change outcomes, options, lock time or source. Post-v1, a Creator Studio can propose a new Series template, but admission, decoder compatibility and on-chain creation remain mandatory gates.

### UJ-7 — Return, recover and understand

A returning Player skips the primer. The app resumes the most relevant state: an open draft, awaiting own Pick or newest settled result. Record exposes complete history; Activity exposes operations; Settings exposes theme, profile/session and provider recovery status. Failed actions retain context and say whether submission was reached.

### UJ-8 — Ask, inspect and improve

Deji opens a Market. A restrained, capped Guide teaser appears beside a real lifecycle ring without covering the Pick action. He opens it and asks what is known, what is missing and what would invalidate the call. The Guide uses the same source, timing, distribution and proof state already on the page, can recommend sitting out, and hands any choice back as an ordinary unsigned composer draft. BTC, Ethereum, proof infrastructure and X actions use their recognizable approved marks rather than demo-like letter circles. After settlement, Player Edge shows his complete sample, including misses and void/stuck cases, with segment breakdowns that never overstate a thin sample.

### UJ-9 — Compose and distribute with bounded authority

Kwame builds a Combo from admitted Markets. The app shows every leg, the earliest cutoff, deterministic capped return and void rule before one EIP-712 confirmation. Later he links X: without an Action Grant a mention produces only a prefilled draft; with a reviewed, capped and revocable grant, an unambiguous mention can submit through an isolated executor and returns a receipt. The same grant boundary can eventually power a Playbook, but neither X nor an Agent can change truth, move funds or exceed points policy.

## 3. Amendments to existing functional requirements

### FR-1 — Product-led first run and return to intent

Replace the previous “sign-in only” interpretation.

- A versioned, skippable five-job primer appears at the first play/create intent, not on every public visit.
- It teaches: what Proof League is; how a Pick moves from open to proved; what the embedded wallet may sign; where free points and public/recovery records live; and the Plain/Detailed presentation preference. It never implies deposits, custody or chain selection.
- Final action opens Privy. The exact Market, option and stake draft survive authentication.
- Returning users skip the primer and resume the highest-priority unfinished/recent state.
- The end-to-end first Pick remains a ≤2-minute timed test. After the user completes or skips the primer, authentication plus the composer/signing path uses ≤6 meaningful interactions.

### FR-2 — Legible public product, not a brochure

Landing, Markets, Market, shared Call/Card, Player, League and proof pages are readable without authentication. The landing contains real current/settled product evidence and an honest pre-first-settlement empty state. No fabricated cards, rows, charts or activity.

### FR-3 — Player record and account completion

The public Player route contains full uncurated Card history, Streaks, Season Points and published Challenges. The private Record view adds allowance, pending/committed operations and activity shortcuts. Settings and Activity are required product surfaces; avatars, bios and follows remain out of scope.

### FR-4 — Markets board and discovery states

“Today” becomes a filter inside Markets, not the whole product IA. Markets supports Featured, Today, Upcoming and Settled views; each state has loading, empty, stale and error rendering. State transitions remain realtime and no-reload.

### FR-5 — Complete Market detail

Market detail must include:

- question, source and plain-language integrity explanation;
- options/distribution, lock and expected settlement times;
- canonical points composer;
- lifecycle tracker and proof panel;
- Market Room entry and current participant/message state;
- Share/Challenge actions whose availability follows lifecycle and auth.

### FR-10 — One Card, two public lifecycle artifacts

A Card is created at Pick confirmation and remains one permanent record. It has:

- **Open Call** presentation before outcome: exact call, points, creation time, absolute UTC lock/expiry, OPEN status and no fabricated price/probability path;
- **Settled Record** presentation after scoring: real outcome, Payout/zero, Streak effect and proof links;
- voided/stuck variants with truthful non-celebratory treatment.

### FR-11 — Share lifecycle and fallbacks

Sharing is no longer deferrable polish.

- Users explicitly opt to publish an Open Call; private pending Picks are not public by default.
- Share tries Web Share with an image/file when supported, then offers PNG download, copy link and X intent.
- Open and settled images are 1200×1500 (4:5). A 1200×630 OG companion is generated for link previews.
- The same public URL resolves across the lifecycle and never claims settlement before proof.
- Share success/failure is visible in the originating surface and retryable.

### FR-19 — Product-grade League

Keep chain-derived ordering. Add current-user sticky row, Today/Season views, rank movement, venue stats sourced from real data, and honest loading/thin/empty/error states. No fake competitors.

### FR-21 — Operator Hosted Round and participant Challenge

Keep the operator-only Hosted Round lifecycle. Add a participant-facing Challenge wrapper over admitted Market instances. A Challenge changes only presentation/distribution context; it cannot create or alter truth.

## 4. New functional requirements

### FR-22 — Reference-led responsive shell and themes

Proof League ships as one responsive product with feature parity.

**Consequences:**

- Desktop primary nav: Markets, Reels, Create, League, Record.
- Mobile persistent bottom nav: Markets, Reels, Create, League, Record; More/account in header.
- No mobile redirect, desktop gate or hidden primary job.
- First paint follows system light/dark without flash; a labeled toggle persists `pl.theme.v1`.
- Public marketing and authenticated app share the same token system and product vocabulary.

### FR-23 — Reels market discovery

A Player can browse one full-height Market at a time, move next/previous, see lock time/source/state and open the canonical composer or Market detail.

**Consequences:**

- Reels never forks Pick math, auth, availability or submission logic.
- Keyboard, wheel/swipe and reduced-motion paths exist.
- Empty and end-of-feed states route back to Markets; no infinite fake loop.
- Reels uses only real admitted Markets and preserves filter/cursor state on return.

### FR-24 — Market Rooms

Every Market can have an off-chain discussion room that is visibly separate from settlement truth.

**Consequences:**

- Reading is public; posting requires auth and a valid signed message.
- Player-only posting eligibility is checked against a valid pending/committed Pick for that Market; a read-only visitor can never be mistaken for a participant.
- Messages are rate-limited, reportable, paginated and ordered by server time.
- The UI states “Discussion is off-chain. It cannot change the result.”
- Room failure never blocks Market/Pick/proof flows.

### FR-25 — Copy-call deep links

A public Open Call or Settled Record can lead another person to the same Market/call context.

**Consequences:**

- Before lock, “Make my own Pick” pre-fills Market, option and suggested points but requires review and a new signature/nonce.
- Suggested points clamp to the receiver's remaining allowance and are never submitted automatically.
- After lock, the action becomes “View this Market” or “Play the next round”.
- Attribution records the originating share/challenge for analytics, never for scoring or authority.

### FR-26 — Challenge builder

An authenticated Player can create a shareable Challenge from an admitted Market.

**Consequences:**

- v1 inputs: Market, short title and prompt. Options, source, timing and scoring are immutable.
- Publish produces a public route, share artifacts and Market Room context.
- Expired/locked Challenges remain as records and route to the settled/next-state experience.
- Delete means unlist the presentation wrapper; it never deletes Picks, Cards or truth.

### FR-27 — Activity, Settings and installability

The product includes the account/recovery states required for ordinary use.

**Consequences:**

- Activity shows Pick drafted/signed/received/committed/scored and share/challenge operations with honest statuses and tx hashes when present.
- Settings shows theme, session/sign-out, public handle/address, notification capability state and Privy/provider recovery status; it never pretends to recover keys itself.
- The responsive web app has a valid manifest, icons, theme colors and install prompt eligibility; installation is optional and never blocks use.
- Logout/login preserves public history and rehydrates account state from server/chain, not local optimistic state.

### FR-28 — League Guide

Market and proof surfaces include one contextual assistant that remains subordinate to canonical data and the ordinary Pick path.

**Consequences:**

- Input is a validated, typed snapshot of the current Market, source, lifecycle, distribution, proof phase and optionally the authenticated Player's complete record; raw database/chain clients and secrets are not exposed to the model.
- Every answer distinguishes known fact, derived explanation and missing/unavailable data. It cannot invent a Market, option, distribution, proof phase, Pick, score, rank or submission success.
- The Guide may answer, refuse, say “sit this one out”, or create an unsigned composer intent. It cannot sign, submit, publish, grant authority or call chain/domain writers.
- The dock, contextual meter and starter prompts remain useful without a model credential. A missing/rejected/rate-limited provider has an honest persistent state and never removes the manual product path.
- The user can clear the current conversation. Persistent personal memory is out of scope until a separate privacy/retention decision.

### FR-29 — Player Edge

Record includes a complete evidence-backed performance explanation rather than only totals and wins.

**Consequences:**

- Metrics derive from the same complete Card/scoring projection as Record and League and include correct, incorrect, voided and stuck/provisional states.
- Required breakdowns: sample size, calls by Series/source/horizon, hit rate, points committed, score yield per point, Streak/run distribution and best/worst sufficiently-sized segment.
- Thin/incomplete history is labeled; a capped or stale scan cannot be presented as a complete record.
- No financial PnL, “edge” claim or causal explanation is invented from free-points outcomes.

### FR-30 — Takes, Calls feed and lifecycle alerts

Players can publish signed opinions and opt into honest return signals around admitted Markets.

**Consequences:**

- A Take is length-limited, signed, reportable and linked to a Market and optional public Call/Record. It is visibly opinion and cannot alter distribution, proof, score or rank.
- Reels may weave Takes/Open Calls between Market cards without changing the bounded real-Market cursor or hiding the source Market.
- Alerts cover explicit lifecycle/threshold events supported by canonical readings: intake approaching, commitment, proof phase change, scored/voided/stuck and selected Challenge/creator activity.
- Permission, channel verification, quiet hours, per-event controls, unsubscribe and delivery failure are first-class states. No alert claims settlement or score before canonical events.

### FR-31 — Combo Picks

A Player can commit free points to a multi-Market Combo while preserving commit-before-knowability and deterministic scoring.

**Consequences:**

- Every leg references an admitted Market and option. Legs and void policy become immutable at confirmation.
- Intake closes at the earliest leg cutoff. A leg already locked/knowable, duplicate Market or unsupported lifecycle blocks the whole confirmation.
- The preview shows points at risk, each leg, earliest cutoff, combined deterministic multiplier, maximum capped return and exact void behavior.
- One EIP-712 batch/Combo commitment is canonical. All-leg settlement is idempotent and permissionlessly continuable after safe deadlines; partial/unknown states remain visible.
- Combo points count against the same daily allowance. No money, reserve, leverage or purchasable balance is introduced.

### FR-32 — Pick from X with bounded authority

An authenticated Player can link X and originate a Pick intent without turning a social account into unlimited wallet authority.

**Consequences:**

- Without an active Action Grant, a valid X instruction returns a deep link to a prefilled draft that still requires ordinary user signature.
- Full execution requires an owner-signed grant fixing player/beneficiary, executor, action kind, allowed Market/Series scope, maximum points per Pick/day, expiry and revocation nonce.
- The parser is deterministic and refuses ambiguity. Submission repeats current Market, allowance, cutoff and grant checks; an isolated executor has one writer/nonce queue.
- Every accepted/refused/unknown instruction receives a durable receipt linking the X instruction id, grant id, parsed intent, Market, resulting Pick/tx id and status.
- The executor cannot withdraw/transfer value, change beneficiary, create Markets, publish Calls, alter proof/score, widen its grant or act after expiry/revocation.

### FR-33 — Strategy Playbooks and Agents

Creators can publish inspectable Playbooks and Players can simulate them before any automation is possible.

**Consequences:**

- A Playbook is a versioned, human-readable rule set over admitted Market/read-model inputs. Draft, backtest/simulation and published states are explicit; simulated results are labeled and never mixed with live results.
- Discovery/ranking uses complete live performance including misses, voids, costs where applicable and inactive periods; no cherry-picked record.
- Read-only alerts/drafts ship before automation. Automated Picks require the same Action Grant checks, isolated single-writer execution and receipts as FR-32.
- AI may help explain or draft a Playbook but cannot activate authority, certify evidence or decide settlement.

### FR-34 — Proof Surface

Proof League exposes the real structure and health of its own prediction/proof system rather than borrowing unsupported financial-market labels.

**Consequences:**

- Views may group by source chain, contract/event, Series, horizon and lifecycle.
- Supported measures include admitted/open/settled coverage, option/call distribution, commitment participation, event-to-attestation, attestation-to-proof and proof-to-score latency, plus void/stuck/error rates.
- Every measure names its source, sample/window, updated time and complete/partial/stale/unavailable state.
- No implied probability, volatility, liquidity, price impact or “edge” metric is shown unless a real model/data source and method are separately approved.

### FR-35 — Product identity marks and contextual micro-interactions

Small interaction details are part of the product contract, not optional polish.

**Consequences:**

- Known assets, chains, protocols and social providers use approved local marks from one provenance-recorded registry. BTC uses the Bitcoin mark, ETH/Ethereum the Ethereum mark, Creditcoin/Attestcoin its approved mark and X the X mark; acronyms or letters inside colored circles do not substitute for available logos.
- Player identity uses a deterministic address identicon or an approved user image. League Guide uses an owned Proof League assistant mark. Fake faces, random avatars and initial-letter circles are forbidden.
- Visible marks recur consistently in Markets, Market detail, Tickets, Reels, Cards, Guide context, filters, source/proof links and share/X actions. Accessible names and useful adjacent text remain even when the visible affordance is icon-led.
- Tooltips, contextual teasers, popovers, sheets, drawers, dialogs and toasts have separate jobs. Only one blocking overlay is open at a time; handoffs preserve context/focus; critical refusal, confirmation-unknown and recovery state remain in the originating surface.
- League Guide preserves the reference micro-flow: real timing ring; desktop hover/focus label; a 3.5-second first teaser, 4.8-second hold, 4.5-second gap and three-pop cap; starter and contextual follow-up chips; motion-safe loading/reveal; and action cards only after a valid answer. Open, dismissed and reduced-motion states suppress the teaser.

## 5. New non-functional requirements

### NFR-8 — Reference fidelity is observable

Every route/capability in the parity ledger remains classified Exact, Adapted, Additive, Blocked or Excluded. A story cannot silently reduce an Exact/Adapted behavior. Visual review covers 1440×1000, 1024×768, 390×844 and 360×800.

### NFR-9 — Social features cannot contaminate truth

Rooms, shares, attribution and Challenges are operational presentation state. They never write Market outcome, Pick score, Streak, Season points or proof state. Their outage must degrade locally.

### NFR-10 — Share and room safety

Public strings are length-limited and escaped; share images render from validated structured data; rooms have rate limits/reporting; no untrusted remote image or HTML is embedded. Public Open Calls require explicit user publication and can be unlisted without altering the underlying permanent Card.

### NFR-11 — Verification supports delivery; it is not the deliverable

- Product surfaces, real data, truthful lifecycle behavior and usable recovery are the deliverables.
- Do not create a testing epic, test-only story, coverage target or broad automated UI/snapshot suite. Manual browser inspection at the four reference viewports is the default visual acceptance method.
- Run build/type checks and the smallest focused verification needed when behavior is uncertain. Security-critical contract, signing, allowance, proof, grant and payout invariants still receive targeted negative/fuzz/invariant checks inside the implementing slice; those checks are evidence for the feature, not a parallel product.
- Existing planning artifacts and story identifiers remain the requirements catalog. Development is repo-native and Plan-mode-led; it must not depend on BMad build/dev/story/sprint workflows.

## 6. Revised information architecture

### Primary

- `/markets` — Featured + Today/Upcoming/Settled board
- `/reels` — rapid market discovery
- `/create` — Challenge builder; future Creator Studio entry
- `/league` — ranking and Season
- `/record` — own Cards, points and activity summary

### Public detail

- `/market/[marketId]`
- `/call/[shareId]` — lifecycle-stable Open Call / Settled Record
- `/challenge/[challengeId]`
- `/player/[address]`
- `/proof/[settlementId]`
- `/how-proof-works`
- `/status`

### Account/operations

- `/activity`
- `/settings`
- `/admin/hosted-rounds` — separately authenticated, never in player nav

### Secondary product surfaces

- `/social` — signed Takes and public Call feed; distribution only
- `/record/edge` — complete own-record explanation
- `/combo` — contract-gated multi-Market free-points commitment
- `/playbooks` — versioned rules, simulation and publication
- `/agents` — activation/receipt surface; automation remains grant-gated
- `/trade-from-x` — X-origin draft or grant-backed execution receipt
- `/surface` — provenance-labeled proof-system analytics

These routes remain directly addressable from contextual actions or More; adding them must not displace the five primary navigation jobs.

## 7. Revised scope and phasing

The old Layer-C cut order no longer treats sharing, leaderboard or mobile product quality as optional; Abu explicitly named them as missing product requirements.

### Product baseline

FR-1..19, FR-21..35 and NFR-1..11 are the complete product backlog. A build may sequence them, but “demo complete” does not mean “product complete.”

### V1 release slice

- Proof/referee spine: unchanged mandatory core.
- Product shell: FR-22, complete public/returning states, Settings/Activity minimum.
- Discovery: Markets + Reels.
- Social loop: Open/Settled share lifecycle, copy-call, League, public Record.
- Community: read/write Market Rooms with local-failure degradation.
- Creation: Challenge builder over admitted Markets only.
- Intelligence: League Guide and Player Edge with honest no-provider/thin-history states.
- Distribution: signed Takes and in-app lifecycle alerts; external notification channels remain opt-in.

### Post-v1 product horizon

- Creator Studio for new Series proposals and source compatibility checks.
- Public creator analytics and challenge collections.
- Combo Picks after the new contract and scoring security gate.
- Pick from X after official-account authorization and delegated-grant security review; prefilled drafts may ship earlier.
- Strategy Playbooks/Agents after the same grant boundary; read-only simulation may ship earlier.
- Proof Surface and extended notification channels after their complete projections/provider consent paths exist.
- Real-money or purchasable balances remain excluded pending a separate legal/product decision.

## 8. Revised success metrics

- **SM-1 First-call loop:** a clean mobile or desktop user reaches a signed Pick in ≤2 minutes, the post-primer auth/composer path uses ≤6 meaningful interactions, and the user can explain free points plus proof settlement.
- **SM-4 Share loop:** open and settled share artifacts render from real data; a fresh recipient reaches the correct Market and creates a distinct Pick without hidden authority transfer.
- **SM-5 Comprehension:** ≥4/5 testers explain who decides the outcome, what is off-chain, and why copying a call still requires their own signature.
- **SM-6 Responsive parity:** every primary job passes the four reference viewports with no horizontal overflow, inaccessible action or desktop redirect.
- **SM-7 Social isolation:** forced Room/share outages leave Market reading, Pick submission and proof viewing operational.
- **SM-8 Guide grounding:** a fixed evaluation set produces no invented Market/proof/own-record state; unavailable input yields an explicit unknown, and every prepared action stops at an unsigned draft.
- **SM-9 Delegated authority:** negative tests prove expired/revoked/out-of-scope/over-cap/ambiguous X and Agent instructions cannot create a Pick; every attempted instruction is recoverable by receipt.
- **SM-10 Complete analysis:** Player Edge and Proof Surface reconcile to the canonical rebuild and label partial/stale/thin samples.
- **SM-11 Product identity and micro-flow:** BTC, ETH/Ethereum, Creditcoin/Attestcoin and X marks resolve consistently without initial-letter substitutes; the Guide teaser/drawer and overlay handoffs pass the source-led manual desktop/mobile flow.

## 9. Decisions that remain closed

- Free-to-play points; no deposits, leverage, order book, custody or real-money positions.
- Cards are records, not transferable collectibles.
- Creditcoin/Attestcoin verifies EVM source events; source-chain truth is not replaced by social state.
- Verification before celebration; no fabricated activity, results, rows, charts or progress.
- 300-line TypeScript implementation limit, constants law and shared canonical functions remain enforced. Verification stays targeted and proportional under NFR-11; it is never promoted into a separate deliverable.
