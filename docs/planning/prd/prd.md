---
title: 'PRD: Proof League'
status: amended
created: '2026-08-23'
updated: '2026-09-02'
---

# PRD: Proof League

> **Canonical with revision.** Read with `fidelity-revision-2026-09-02.md`; the revision adds FR-22..27/NFR-8..10 and wins on conflict for product shell, onboarding, sharing, social, creator and responsive scope.

## 0. Document Purpose

This PRD turns the approved Product Brief into buildable requirements for the UX, architecture, and story-writing phases. It builds on — and does not repeat — the brief and its addendum (`_bmad-output/planning-artifacts/briefs/brief-buidl-ctc-2026-08-23/`) and the four research reports under `_bmad-output/planning-artifacts/research/`. Vocabulary is anchored in §2 Glossary; features carry globally numbered FRs; every inference made without Abu's explicit sign-off carries an inline `[ASSUMPTION]` tag, indexed in §12. Governing deadline: **submission by September 6, 2026, 23:59 ET — 14 days from this document's date.**

## 1. Vision

Proof League is a prediction league where the matches are real things happening on Ethereum and the referee is cryptographic proof. Players spend a small daily allowance of points on predictions ("what number will today's staking yield come in at?"), the real event settles on Ethereum, Creditcoin's Attestcoin Protocol proves the result, and the contract scores everyone — no human judgment anywhere in the loop. Every Pick becomes a permanent Card: what you called, when, what happened, and the proof. The brag is the verified Streak.

Two structural properties carry the product: **settlement by proof instead of by people** (the market leader's grading scandals are impossible here for Ethereum-native questions), and **content generated free and forever by Ethereum itself** (the licensing and influencer costs that killed the fantasy-game category do not exist). The window is fixed: the Attestcoin Protocol's Ethereum-reading capability went live on Creditcoin mainnet in June 2026, this hackathon season made using it mandatory, and few teams have built anything deep on it — the judges score exactly that depth. (Market context and evidence: the brief.)

## 2. Glossary

*Nineteen terms you need before the rest of this document. Downstream documents use these terms verbatim; there are no synonyms anywhere else in this PRD. Naming rule for all judge-facing material: the protocol is the **Attestcoin Protocol** (its packages and repos still ship under `usc-*` names — expect both, write one).*

- **Player** — a signed-in user who makes Picks.
- **Market** — one open question with a defined settlement source (e.g. "What number will today's Lido yield come in at?"). Has Outcome Options, a Lock Time, and exactly one Settlement.
- **Outcome Option** — one of the 2–6 possible answers a Market offers (e.g. "2.30–2.35%").
- **Source Event** — the real Ethereum happening that answers a Market (e.g. the daily Lido report transaction).
- **Pick** — a Player's committed choice of one Outcome Option on one Market, with Pick Points staked. Immutable after Lock Time.
- **Pick Points** — the free daily allowance (resets every day at 00:00 UTC) Players stake on Picks. Not money, not withdrawable, not purchasable, never replenished by winnings. [ASSUMPTION] 100 per day.
- **Season Points** — cumulative points won from correct Picks over a Season. Distinct from Pick Points: Season Points are never spendable and never affect the daily allowance.
- **Payout** — what a correct Pick returns: **stake × N in total (gross), where N = the Market's number of Outcome Options**; the net gain is stake × (N−1). An incorrect Pick returns zero. This keeps random play exactly break-even on every Market shape — skill is the only edge.
- **Prediction Card (Card)** — the permanent record a Pick becomes the moment the Player makes it: the call, the stake, the timestamp, and — after Settlement — the outcome and the proof link. Cards are receipts; v1 gives them no market of any kind.
- **Lock Time** — the moment a Market stops accepting Picks. Policy is per-Market: always before the Source Event's window opens, and **always before the outcome becomes computable** (e.g. the weekly Curve Market locks days before the Thursday flip, because the flip's result hardens as votes accumulate).
- **Settlement** — resolving a Market from a proven Source Event and scoring all its Picks.
- **Attestation** — Creditcoin's confirmation that an Ethereum block is real (documented ~8–10 minutes after the block; treated as unmeasured until the day-1 test — see §11).
- **Proof** — the cryptographic package that lets the Referee verify one specific Ethereum transaction and read its contents.
- **Proof Builder** — the Attestcoin-side hosted service that assembles the Proof for a given Ethereum transaction (spec: brief addendum).
- **Referee** — the on-chain settlement path: Attestcoin Protocol verification plus the Settlement Contract's validation checks. No human is part of the Referee.
- **Settlement Contract** — our Creditcoin contract that verifies Proofs through the seven checks (§4.4), decodes the answer, resolves Markets, and records outcomes. Also holds the Pick commitments (there is one contract suite; architecture may split it internally).
- **Settlement Worker** — our off-chain service that watches Source Events, waits for Attestation, fetches Proofs from the Proof Builder, and submits them to the Settlement Contract.
- **Pool Race** — a Market shape that asks which of two or more equally-easy-to-force outcomes happens first (e.g. "which appears first after 14:00 UTC: a new USDC trading pool or a new USDT one?"). The race framing is the defense: forcing one side is exactly as cheap as forcing the other, so cheating is self-defeating.
- **Hosted Round** — a Market whose Source Event comes from a contest contract we deploy on Sepolia (Ethereum's test network), giving us full control of timing. The guaranteed demo path.
- **Mainnet-Read Gate** — the open question of whether our contract on Creditcoin's test network can verify events from Ethereum mainnet (documented in current docs, contradicted by a stale registry). Answered by a day-1 test. **If it fails, every mainnet-sourced Market waits post-hackathon and the launch lineup is Hosted Rounds plus Sepolia-sourced Markets.**
- **Streak** — consecutive days with at least one correct Pick. [ASSUMPTION] Breaks on a day whose Picks were all incorrect; a day with no Picks pauses (does not break) it.
- **Season** — the competition period framing the Leaderboard and Prize Pool. v1 ships "Genesis Season."
- **Leaderboard** — Season ranking of Players by Season Points.
- **Prize Pool** — the reward pot paid to top Season finishers. **v1 funding: a fixed, operator-funded amount of testnet CTC (Creditcoin's coin on the practice network — no real money), set at Season start, held by the Settlement Contract suite, outside the proof-budget accounts.** The post-hackathon model — entry-fee and sponsored pools with a rake — is Abu's locked business direction (forged idea), deliberately deferred, not dropped: see §9.

## 3. Target User

### 3.1 Jobs To Be Done
- **Functional:** make predictions on real crypto events and get scored fairly, automatically, with proof.
- **Emotional:** feel smart and *vindicated* — "I called it, and nobody can say I didn't."
- **Social:** a shareable, unfakeable track record; standing in a league of rivals.
- **Collector's job (supporting user):** own a history that means something — Cards whose worth is what happened, not a floor price.
- **Contextual (judge):** see, within five minutes, a product that could not exist without the Attestcoin Protocol.

### 3.2 Non-Users (v1)
- People who want to bet money against other people (that's Polymarket; deliberately not this).
- NFT traders looking for flippable assets — Cards have no market by design.
- Non-crypto mainstream audiences — v1 questions assume crypto-native context.

### 3.3 Key User Journeys

- **UJ-1. Kwame's first two minutes.** Kwame, a crypto-Twitter regular who quit Fantasy Top when the cards became a casino, hits the Proof League URL from a tweet.
  - **Entry:** unauthenticated, desktop web.
  - **Path:** the landing shows today's live Markets and a real settled Card with its proof link — the product is legible before any signup. He taps *Play today's round* and signs in (wallet-light: an account is created for him, no seed phrase). He lands on Today, sees the Lido Market ("What number will today's staking yield come in at? — settles at noon UTC") with its Outcome Options and a countdown to Lock Time. He stakes 40 of his 100 daily Pick Points on "2.30–2.35%".
  - **Climax:** confirmation shows his Card front — his call, timestamp, stake — with the status *Locked · settles ~12:12 UTC*.
  - **Resolution:** he's in the league, one Pick down, 60 points left for the 14:00 UTC Pool Race.
  - **Edge case:** arriving after Lock Time shows *Locked — watch it settle live* plus the next open Market — never a dead end.

- **UJ-2. The noon settlement ritual.** Same day, 12:04 UTC. Kwame opens the app to watch.
  - **Entry:** authenticated, Market page.
  - **Path:** the Lido report lands on Ethereum at 12:00:11 UTC. The Market flips to *Awaiting Ethereum attestation* with an honest explainer: "Creditcoin's attestors are confirming the Ethereum block — Ethereum can still rewrite its newest blocks, so we wait until this one is settled for good (usually ~10 minutes)." The Settlement Worker submits the Proof; the Market flips to **Proof verified**.
  - **Climax:** the settled screen shows the decoded answer (2.3785%), the winning Outcome Option highlighted, and two links — the Ethereum transaction that decided it and the Creditcoin settlement transaction that proved it. His Card flips to a green *CORRECT* face; the Streak counter animates 6 → 7.
  - **Resolution:** Leaderboard rank updates; tomorrow's Lido Market is already open.
  - **Edge case:** if Attestation runs long, the state stays honest ("still confirming — taking longer than usual") with elapsed time shown; no fake progress bar.

- **UJ-3. Deji scouts a rival.** Deji, #2 on the Leaderboard, taps the #1 Player's profile before staking today. The profile shows the rival's Streak, Season Points, and Card history — every call, hits and misses alike, each with its proof link. Deji sees the rival always plays yield Markets and skips Pool Races; the streak checks out on-chain, so he adjusts his own staking to chase the gap on the Races the rival avoids. Rivalry deepens; both come back tomorrow. **This journey is why Cards exist.**

- **UJ-4. Ama's five minutes.** Ama, a BUIDL CTC judge with twenty submissions to get through, opens the URL cold. She runs UJ-1 compressed (sign-in → Pick in under two minutes, on a Hosted Round timed to settle during judging), then UJ-2's proof-verified moment, then the *How settlement works* page: the seven checks in plain words, the settlement log, the Attestcoin Integration Summary, the public repo. **Climax:** she clicks the proof link and sees the real transaction. She has personally experienced "Ethereum decided — here's the receipt."

## 4. Features

### 4.1 Onboarding & Identity
**Description:** The landing page proves the product before asking for anything: live Markets, a real settled Card, a proof link that works logged-out. Sign-in is wallet-light — the Player gets an account and an in-app wallet without seed phrases or extensions [ASSUMPTION: embedded-wallet approach; provider is an architecture decision]. Realizes UJ-1, UJ-4.

#### FR-1: Sign in without wallet ceremony
A visitor can create an account and reach their first Pick in under two minutes without installing anything or writing down a seed phrase.
**Consequences (testable):**
- A first-time visitor on a clean browser reaches Pick confirmation in ≤ 2 minutes and ≤ 6 interactions (measured in the judge rehearsal).
- No seed phrase, extension install, or funding step appears before the first Pick.

#### FR-2: Legible logged-out state
An unauthenticated visitor can see today's Markets, countdowns, and any settled Market's proof links.
**Consequences (testable):**
- Every proof link resolves to a public block explorer page without authentication.
- The landing page renders meaningful content in ≤ 3 s on the reference connection (Chrome DevTools "Fast 4G" profile, cold cache, desktop — the single performance profile used throughout this PRD).

#### FR-3: Player profile
Every Player has a public profile URL: display name, Streak (current and all-time best), Season Points, and full Card history. Realizes UJ-3.
**Consequences (testable):**
- Any Player's profile is reachable from the Leaderboard in one tap and loads logged-out.
- Card history shows correct and incorrect Cards alike — history cannot be curated or hidden.
**Out of Scope:** avatars, bios, follows.

### 4.2 Markets & The Daily Round
**Description:** "Today" is the home surface: open Markets with countdowns, locked Markets awaiting their Source Events, settled Markets with outcomes and proofs. Each Market page explains its question in plain words — including *where the answer comes from and why nobody can fake it* — because the explainer is the product's trust pitch, and the pitch is aimed at a real wound: the incumbent's outcomes get decided by conflicted human votes (evidence: brief, The Problem). Ethereum generates these questions **free and forever** — no licenses, no paid influencers, no content treadmill; that is the second half of the thesis and the reason the lineup can grow without cost.

Launch lineup (all Source-Event specs in the brief addendum): the daily Lido yield Market and the daily Lido tips-and-fees Market (the extra income validators earn on top of staking rewards, reported in the same daily transaction — **one Proof settles both**), Uniswap Pool Races [ASSUMPTION: 2–3 race windows/day at fixed UTC times], and Hosted Rounds. **All mainnet-sourced Markets (both Lido Markets and the Pool Races) depend on the Mainnet-Read Gate. If the day-1 test fails: the launch lineup is Hosted Rounds plus Sepolia-sourced equivalents (a Sepolia contest contract per Market shape), the mainnet path ships as a documented, probed limitation on the transparency page, and SM-2 shifts to its fallback branch.** Recurring Markets are minted automatically from registered Series templates (architecture AD-21) — creation, like settlement, requires no daily human act; the lineup grows by registering a Series, never by posting markets [added 2026-08-27, Abu-directed]. Realizes UJ-1, UJ-2.

#### FR-4: Today view
A Player sees all of today's Markets grouped by state — open (with Lock Time countdown), locked (with expected settlement time), settled (with outcome + proof) — in one scrollable surface.
**Consequences (testable):**
- State transitions (open → locked → awaiting attestation → proof verified) appear without a page reload, within 10 s of the underlying change.
- An empty state never occurs: if no Market is open, the next Market's opening time is shown.

#### FR-5: Market detail with plain-language source explainer
Each Market page shows the question, Outcome Options with the current Pick distribution, Lock Time, and a two-sentence plain-words explainer of its Source Event and why it can't be rigged.
**Consequences (testable):**
- Every term in a launch Market's explainer is either in §2 Glossary or defined inline in the same sentence — verified by a pre-submission pass over all launch explainers.
- Pick distribution (% of points per Outcome Option) is visible before Lock Time. [ASSUMPTION: full pre-lock transparency.]

#### FR-6: Market admission rules
Every Market, launch or future, must pass a written admission checklist before it goes live. The rules encode the research's verified failure modes:
1. **Genuine uncertainty** — the answer cannot be computed or simulated in advance (the "gas cost of a transaction" trap).
2. **Manipulation-priced** — the documented cheapest way to force the outcome costs more than any plausible winnings; cheap-to-force events are admissible **only** in the Pool Race shape (both sides equally forceable).
3. **Determinism horizon** — Lock Time falls before the moment the outcome starts becoming computable from on-chain state (e.g. the Curve weekly Market locks early in the week, never at the Thursday boundary).
4. **Positive settlement only** — the Market settles on an event that *happens*; no "will X *not* happen" shapes.
5. **Framing locks from research are binding** — e.g. the beacon-deposit milestone asks *which day*, never *who*; the verified dead-end list (event-catalog research §dead-ends) is an exclusion list for market selection.
**Consequences (testable):**
- Each launch Market's admission checklist is written down (one paragraph per rule) before the Market opens; the file lives in the repo.
- No Market violating rule 4 or rule 3 can be represented in the Market configuration schema (structural, not just procedural).

#### FR-7: Market lifecycle and honesty states
A Market moves through exactly: *open → locked → awaiting attestation → proof verified (settled)*, or *open → locked → voided*, or — for failures — *stuck (visibly)*. **Void** means the Source Event provably did not occur within the Market's stated window [ASSUMPTION: 24 h for scheduled daily events]; all stakes return. **Stuck** means the Source Event occurred but proving has failed or stalled; a stuck Market stays honestly stuck until proven — it is never voided while its Source Event exists, and never hand-resolved.
**Consequences (testable):**
- No spinner or indeterminate progress UI during attestation; the state shows elapsed time and the expected window (display copy parameterized from the day-1 measured attestation time, not hardcoded).
- A voided Market returns 100% of staked Pick Points; a stuck Market's stakes stay escrowed and visible.

### 4.3 Picks, Points & Cards
**Description:** Every day each Player gets 100 Pick Points [ASSUMPTION]. They stake points across Markets — more points on higher conviction; the budget cap is the fairness mechanism (skill beats wallet size — nobody can buy standing). Payouts are gross stake × N (Glossary: Payout). Every Pick becomes a Card **the moment the Player makes it** — not at Settlement. Misses stay on the record; that is what makes the record credible. The word *commitment* below refers only to the on-chain event at Lock Time. Realizes UJ-1, UJ-2, UJ-3.

#### FR-8: Stake a Pick
A Player can stake 10–100 Pick Points [ASSUMPTION: minimum stake 10] on exactly one Outcome Option per Market before Lock Time, and adjust or cancel until Lock Time.
**Consequences (testable):**
- Total staked across a day's Picks never exceeds the daily allowance; remaining points are always visible.
- After Lock Time, mutation attempts fail with a visible "locked" response.

#### FR-9: On-chain commitment at lock
At Lock Time, a commitment covering every Pick on the Market (Player, Outcome Option, stake) is written to the Settlement Contract, so Settlement and scoring are independently checkable. A merkle root over Player-signed (EIP-712) Pick messages satisfies this, with the full set of Picks published for verification [ASSUMPTION: batch commitment, gasless for Players].
**Consequences (testable):**
- After lock, a tamper-evident record of every Pick exists on Creditcoin testnet before the Source Event's window opens, and the published set provably matches the on-chain root.
- The settled Market page links to both the commitment transaction and the settlement transaction.

#### FR-10: Cards as permanent receipts
Every Pick renders as a Card: front = the call (question, Outcome Option, stake, difficulty context — e.g. the Pick distribution at lock — and timestamp); back after Settlement = outcome, Payout, and proof links.
**Consequences (testable):**
- Cards for incorrect Picks are visually distinct but never deleted or hidden.
- A settled Card's proof links resolve to (a) the Ethereum Source Event transaction and (b) the Creditcoin settlement transaction.

#### FR-11: Card sharing
A Player can share any settled Card as an image/link carrying the call, the outcome, and the proof link. Realizes UJ-3's social loop.
**Consequences (testable):**
- The share artifact renders a link-preview image correctly when pasted into X/Discord.
- Shared links open the public Card view without authentication.
**Out of Scope:** in-app feeds, comments.

### 4.4 Settlement & Proof (the Referee)
**Description:** The heart of the product and of the Attestcoin Protocol integration. The Settlement Worker watches each Market's Source Event on Ethereum; when it lands, waits for Attestation, respects the protocol's recency floor (very fresh blocks cannot be proven yet), fetches the Proof, and submits it promptly — the protocol's proving cost rises steeply (>10×) for day-old transactions, so the Worker proves within the hour, never "later." The Settlement Contract runs **seven checks**, and rejects the Proof if any one fails:

1. **The Ethereum transaction succeeded** — it did not fail or revert.
2. **It came from the right contract** — the emitting address is on the approved list for this Market.
3. **It is the right kind of event** — the event's signature matches the one this Market settles on (never the calling function's shape, which the protocol has changed before).
4. **It is about the right thing** — e.g. the Lido report for *this* day, not another one.
5. **It has not been used before** — the same Proof cannot settle the same Market twice.
6. **The Market was open when it happened** — the Source Event came after the Market opened, never before.
7. **The submitter proved it through the real verifier** — settlement logic only trusts results from the genuine Attestcoin verification path, never from a caller-supplied "prover" contract.

Checks 5 and 7 close the replay and prover-trust vulnerability classes left open in Creditcoin's own published example contracts — that is our stated contribution and a judge-facing claim; the list above doubles as the FR-16 checklist copy and the transparency-page copy. Verification/decoding and Pick scoring are **separate transactions**: scoring an unbounded set of Picks inside the verify transaction would collide with the protocol's decode-gas ceiling and recreate the unbounded-loop vulnerability class the examples suffer from. Realizes UJ-2, UJ-4.

#### FR-12: Settlement Worker pipeline
The Settlement Worker detects a Source Event, waits for Attestation, obtains the Proof, and submits it — without human action — within [day-1 measured attestation time + 5 minutes] of the Source Event under normal conditions (planning placeholder: ~15 minutes; the placeholder is replaced by the day-1 measurement before FR acceptance).
**Consequences (testable):**
- For the scheduled Lido event (12:00:11 UTC), the Market reaches *proof verified* within the accepted window in ≥ 4 of 5 consecutive rehearsal days.
- A failed or stalled settlement posts to an operator webhook (Discord/Telegram) within 5 minutes of the expected settlement time; no Market is ever marked settled without an accepted on-chain Proof.

#### FR-13: Seven-check Settlement Contract
The Settlement Contract accepts a Proof only if all seven checks pass, then decodes the answer — including any on-chain derivation the Market needs (the Lido yield is *computed* from the event's rate fields with ≥ 12-decimal fixed-point precision, not read directly) — and resolves the Market to exactly one Outcome Option (or void).
**Consequences (testable):**
- Each check has a negative test: a reverted source tx, a wrong emitter, a wrong event signature, a wrong subject id, a replayed proof, a pre-open source tx, and a spoofed-prover path are each rejected on-chain.
- The Lido derivation reproduces the blind-verified reference values (e.g. 2.3785% for the 2026-08-22 report) from raw event fields.

#### FR-14: One Proof, many Markets
One accepted Proof can settle every Market that keys on the same Source Event (the Lido yield and tips-and-fees Markets settle from the identical transaction).
**Consequences (testable):**
- Settling both Lido Markets consumes exactly one Proof submission from the daily proof budget.
- The transparency log shows both Markets referencing the same settlement transaction.

#### FR-15: Scoring application
After a Market resolves, every Pick is scored (gross Payout for correct; zero for incorrect) in bounded batches, and each Player's Season Points, Streak, and Leaderboard position update together — a Player never sees points updated but Streak or rank stale.
**Consequences (testable):**
- No UI surface shows a settled Market with unscored Picks more than 60 s after resolution; a Player's reveal (points, Streak, rank together) fires when *their* Pick is scored, never on bare market resolution [architecture-gate amendment, accepted by Abu 2026-08-27].
- Days containing a stuck Market are provisional for Streak purposes: the day finalizes (and the streak animation fires) when its last Market settles; provisional days are excluded from all-time-best until final [architecture-gate amendment, accepted by Abu 2026-08-27].
- Recomputing any Player's Season Points from the published Picks and settled outcomes reproduces the displayed number exactly.
- Scoring gas per batch stays below the decode-gas ceiling headroom measured in the day-1 test.

#### FR-16: Proof view
Every settled Market and Card exposes the proof: the decoded event fields, the derivation to the answer (for computed Markets like Lido yield: the actual yield figure, e.g. 2.3785%), the seven checks as a plain-words checklist (all green), and links to the Ethereum and Creditcoin transactions.
**Consequences (testable):**
- The proof view renders decoded values and the derivation — not just a hash.
- Both explorer links resolve publicly (Ethereum explorer; creditcoin-testnet.blockscout.com).

#### FR-17: Settlement transparency page
A public "How settlement works" page walks the pipeline in plain words — the seven checks verbatim from §4.4 — with a live log of every Settlement to date (event → attested → proven timestamps). Doubles as the in-product face of the Attestcoin Integration Summary (the standalone submission document is owned by SM-3). Realizes UJ-4.
**Consequences (testable):**
- Every settled Market to date appears in the log with its three timestamps.
- The page is reachable logged-out, from the footer, in one tap.

### 4.5 Progression: Streaks, Leaderboard, Season
**Description:** The Streak is the product's emotional spine (the most retention-proven mechanic in the competitive research); the Leaderboard is the social scoreboard; Genesis Season frames it all with a Prize Pool at the end. During rehearsal days the league runs for real — the team and testers playing actual Markets — so by judging week the Leaderboard and Streaks show genuine multi-day history, never fabricated data. Realizes UJ-2, UJ-3.

#### FR-18: Streaks
A Player's Streak increments on each day with ≥ 1 correct Pick, pauses on days without Picks, and breaks on a day whose Picks were all incorrect [ASSUMPTION — semantics as in Glossary].
**Consequences (testable):**
- Streak changes render at Settlement (the UJ-2 moment), with a distinct break state.
- The all-time-best Streak persists on the profile after a break.

#### FR-19: Leaderboard
A Season Leaderboard ranks Players by Season Points, with rank movement shown daily.
**Consequences (testable):**
- Ties resolve deterministically [architecture-gate amendment, accepted by Abu 2026-08-27; precision review 2026-08-31: higher current Streak, then earliest commitment appearance — defined as the minimum commit ordinal among the player's scored Picks, the value the chain actually records — then address ascending as the final total-order key, so no tie is representable; chain-derivable end to end, the on-chain payout and the displayed Leaderboard can never disagree; replaces "earlier signup", an off-chain fact].
- The Leaderboard renders the full field in ≤ 1 s at 200 rows (seeded load test); pagination is not required below 200.

#### FR-20: Genesis Season & Prize Pool
Genesis Season runs from launch through [ASSUMPTION] Sep 17, 2026, with the Prize Pool (fixed operator-funded testnet CTC — Glossary) displayed all Season and paid to the top finishers at Season end [ASSUMPTION: 50/30/20 for top 3]. The payout is a pre-authorized, permissionless-triggerable transaction so it executes inside the unattended judging window without violating NFR-4.
**Consequences (testable):**
- Season end date, Prize Pool size, and split are visible on the Leaderboard at all times.
- At Season end, payouts execute on Creditcoin testnet from the pre-funded pool (never from Settlement Worker accounts) and are linked from the Leaderboard.

### 4.6 Hosted Rounds (the guaranteed path)
**Description:** A contest contract we deploy on Sepolia emits a clean settlement event on our schedule — a Market can always settle on demand for the judge demo, independent of mainnet timing and of the Mainnet-Read Gate. Also the seed of the future creator surface (§9). Realizes UJ-4.

#### FR-21: Hosted Round lifecycle
An operator can create a Hosted Round (question, Outcome Options, settlement schedule) whose Source Event contract on Sepolia emits the result at the scheduled time, settled through the identical Referee path as every other Market.
**Consequences (testable):**
- A Hosted Round can be created, locked, settled, and proof-verified end-to-end within a 30-minute demo window.
- Hosted Rounds use the same Settlement Contract and proof view — zero special-casing visible to Players.

## 5. Non-Goals (Explicit)

- **Not a betting exchange:** no odds, no order book, no Player-versus-Player money positions, no buying or selling of positions.
- **Not an NFT marketplace:** we build no market, no trading, no transfers, and no royalties for Cards; Card sales are never a revenue line.
- **No token.** No points-to-token bridge, no season implying an airdrop.
- **No real-money anything in v1:** free-to-play skill contest — no purchase, no cash value, no custody; testnet CTC only. Entry fees and sponsored pools are the locked post-hackathon business path (§9) and require legal review before any real-money step.
- **Not a generalized oracle service:** we settle our own Markets; we do not sell proof infrastructure.
- **No absence Markets** ("will X *not* happen") — technically unprovable.
- **No one-sided markets on cheap-to-force events** — such events are admissible only as Pool Races (FR-6).
- **No writability:** the product never causes actions on Ethereum from Creditcoin; it only reads and proves. (Protocol writability is unreleased and out of hackathon scope.)
- **No markets from the research's verified dead-end list** (per-transaction gas, spot prices, ETH burned/day, Nouns prices, vesting unlocks, and the rest — event-catalog research §dead-ends).
- **No mobile apps, no non-Ethereum source chains, no creator self-serve** in v1.

## 6. MVP Scope

### 6.1 In Scope — three layers with an explicit cut order

**Layer A — Demo spine (must exist or there is no submission):** FR-1, FR-2 (onboarding); FR-4, FR-5, FR-6, FR-7 (Markets); FR-8, FR-10 (Picks & Cards); FR-12, FR-13, FR-16, FR-17 (Referee + proof surfaces); FR-21 (Hosted Round); FR-18 (Streaks — cheap, and it is the UJ-2 payoff).

**Layer B — League layer:** FR-9 (on-chain commitment); FR-3 (minimum public profile — UJ-3 needs it); FR-14 (one-proof-many-markets) + both Lido Markets (gated on the Mainnet-Read Gate; Sepolia equivalents otherwise); FR-15 hardening (bounded batches at scale).

**Layer C — Deferrable:** FR-11 (sharing); FR-19 (Leaderboard — [NOTE FOR PM] with ~20 players a live Leaderboard is thin; rehearsal-period real play populates it, and if Layer C is cut the profile page carries ranking informally); FR-20 (Season & Prize Pool); the Uniswap Pool Race Market.

**Cut order, pre-decided [NOTE FOR PM — this is the 2 a.m. decision made now, in daylight]:** if Layer A is not green by **Sep 2** [date re-cut 2026-08-27 — build started Aug 28, not Aug 24], cut in this order before touching the spine: FR-20 Season & Prize Pool → FR-19 Leaderboard → FR-11 sharing → the Pool Race Market → FR-14/second Lido Market. The Hosted Round path is never cut.

**Schedule guardrails:** **Sep 4 is code freeze.** Sep 4–6 are reserved for the demo video, the five-pillar deck, the Attestcoin Integration Summary, the repo README, and submission form fields (sector, bios) — one to two full days of work that build features may not eat. Any feature not merged by Sep 4 is cut, not finished. P2 stretch items (Snapshot Keeper + Curve or base-fee Market — the market Vitalik asked for; Glamsterdam upgrade Market; beacon-deposit milestone Market, *which-day framing only*) exist only if Layers A–C are green by Sep 2 — realistically they are post-hackathon backlog. Calendar posture [Abu, 2026-08-27]: dates before the Sep 4 code freeze are guidance, not gates — build solid, iterate normally; the spine's one-deployment history window (≈ Sep 1–5) is the only schedule shape that matters, because it is where SM-2's judge-visible settlement history accrues.

### 6.2 Out of Scope for MVP
Everything in §5, plus: email/push notifications (out for v1 — the noon settlement ritual is the habit we are testing instead); localization; account recovery beyond the embedded-wallet provider's default; anti-sybil measures (stopping one person farming the Prize Pool with many accounts) beyond one-account-per-auth-identity [ASSUMPTION: sufficient at hackathon scale; §11]. ERC-721 Card export was considered and dropped — it would make Cards transferable and cost us the cleanest line in §5.

## 7. Cross-Cutting Requirements

- **NFR-1 Settlement correctness beats everything.** No Market may ever settle on an unverified or partially validated result — including during demos. A stuck Market stays visibly stuck; it is never hand-resolved.
- **NFR-2 Latency honesty.** All waiting states show real elapsed/expected times; expected times come from day-1 and rehearsal measurements, not from documentation.
- **NFR-3 Proof budget discipline.** Daily settlements fit the testnet oracle-fee budget: ~9 proofs/day per funded account across [ASSUMPTION] 3 funded Settlement Worker accounts, with FR-14 (one proof, many Markets) as the primary multiplier. Prize Pool CTC is held and spent separately (FR-20) — pool payouts never compete with the proof budget. Proofs are submitted within the hour (the >10× late-proving cost cliff).
- **NFR-4 Judging-window resilience.** From Sep 6–18 the deployed app, the Hosted Round path, and the transparency page survive without developer intervention: an automated liveness check hits Today, one Market page, and the transparency page every 15 minutes and alerts the operator webhook on failure; the Hosted Round path is re-verified end-to-end at least every 48 h during the window. The one scheduled action (Season payout, Sep 17) is pre-authorized and permissionless-triggerable (FR-20). The honest fallback if live infrastructure misbehaves during evaluation: the transparency log, genuinely settled Markets with working proof links, and the demo video — never seeded or fabricated data.
- **NFR-5 Security posture.** The Settlement Contract carries negative tests for all seven checks (FR-13); no admin key can alter a settled outcome; operator keys hold testnet value only.
- **NFR-6 Performance floor.** Today view interactive ≤ 3 s on the reference connection (FR-2); settlement state changes propagate to open clients ≤ 10 s.
- **NFR-7 Build-in-the-open (submission rule).** The repo is public from day 1 with incremental daily commits — an end-window code dump risks disqualification and forfeits the execution-capability evidence the commit history provides. Buffer assumption: zero upstream maintainer support; every blocked dependency is self-served or routed around, never waited on.

## 8. Platform & Information Architecture (v1)

Web app, desktop-first, responsive [ASSUMPTION: mobile-web usable but not optimized]. Surfaces: **Today** (home), **Market detail**, **Leaderboard**, **Profile / My Cards**, **How settlement works** (public), plus the logged-out landing. Navigation ≤ 5 top-level items. The UX phase owns layout, tone, and the design language of the two moments that matter most: first-pick onboarding and the proof-verified reveal.

## 9. Business Model & Growth (the pillar answers)

*This section exists because the judges score like investors: user-base expansion and market relevance are named pillars, and top-3 winners enter investment due diligence.*

**How the money works.** v1: free-to-play; the Prize Pool is a fixed operator-funded pot of testnet CTC (Glossary). **The locked business direction (Abu, forged idea): prizes funded by entry fees and sponsored pools, with the platform taking a rake on pool flow** — monetizing activity, never card sales (every competitor that sold collectibles died of it; every survivor monetizes flow). Sponsored pools are the near path: a protocol funds a prize pool on Markets about its own events — marketing spend for them, content for us. Real-money steps sit behind legal review (§5).

**How the player base grows.** (1) The daily ritual + Streaks — the retention spine with the strongest evidence in the category. (2) Zero-cost infinite content — Ethereum generates new Markets forever; no license fees, no content payroll, no treadmill. (3) Shareable Cards (FR-11) — every settled Card is a proof-linked brag that travels to X/Discord with the product attached. (4) The creator surface (post-v1, seeded by FR-21's data-driven Hosted Round machinery): any project whose contract emits a clean settlement event can host a league — every Ethereum project becomes a distribution channel. (5) As the Attestcoin Protocol adds chains, every new chain's events become new matches (architecture keeps a source-chain seam; addendum).

**Pillar map:** user-base expansion → this section + FR-11/FR-18/FR-21; technical alignment → §4.4 + FR-13/FR-14/FR-17; product vision → this section + brief Vision; execution capability → NFR-7 + the published research/provenance trail; market relevance → brief (The Problem) + FR-5's trust pitch.

## 10. Success Metrics

**Primary**
- **SM-1: The judge loop.** A first-time visitor reaches a Pick in ≤ 2 min and can witness or replay a proof-verified Settlement in ≤ 5 min total. Validates FR-1/4/16/21. Measured in rehearsal before submission.
- **SM-2: Real settlements.** *Gate holds:* ≥ 10 Markets settled end-to-end on Creditcoin testnet before submission, ≥ 5 from the live mainnet Lido event. *Gate fails:* ≥ 10 settled, all Sepolia-sourced, and the mainnet path documented as probed-and-blocked on the transparency page (itself a credible technical-depth artifact). Validates FR-12/13/14/15.
- **SM-3: Submission completeness, before Sep 6 23:59 ET:** public repo with README and incremental history; demo video; five-pillar deck; Attestcoin Integration Summary (standalone document; FR-17 is its in-product face); sector selection; team bios. Reminder: **registration is not entry — the final project upload is the entry.**

**Secondary**
- **SM-4: Demand signal.** ≥ 20 non-team Players make ≥ 1 Pick, **measured by Sep 5 so the number can appear in the deck**; Season-long totals reported separately. Validates FR-1/11.
- **SM-5: The trust claim lands.** ≥ 4 of 5 crypto-native testers, after one unguided run, can say in one sentence why the result could not have been faked by the operator (rehearsal, before Sep 4). Validates FR-5/16/17 — this is the pillar the whole deck leans on.

**Counter-metrics (do not optimize)**
- **SM-C1: Market count.** More Markets ≠ better; each spends proof budget and polish time. The demo needs 2–3 excellent ones. Counterbalances SM-2.
- **SM-C2: Card visual spectacle.** Cards are legible receipts first; art depth steals from the proof-moment polish SM-1 and SM-5 depend on. Counterbalances SM-4.

## 11. Open Questions

1. **Day-1 technical spike (owner: build, day 1 — in order):** (a) verify faucet funding actually landed for 3 worker accounts — the red-team's #1 schedule risk; Abu reports it handled, verify on-chain balances; (b) run hello-bridge end-to-end and **measure** real attestation wall-clock (replaces every placeholder in FR-12/NFR-2); (c) probe the **Mainnet-Read Gate** live via the ChainInfo precompile — resolve chain keys at runtime, never hardcode from docs; (d) measure decode-gas headroom on a representative Lido receipt (feeds FR-15 batch sizing).
2. **Lido bucket boundaries** — re-sample the yield band the week of launch (observed 2.17–2.38%); choose bucket width and option count together, since option count sets the Payout multiplier (5-basis-point buckets — 0.05 percentage points — imply ~5–6 options). Also re-measure the Uniswap new-pool rate to calibrate race windows.
3. **Which stretch market, if any** — decided by capacity on Sep 1 against §6.1's gate, constrained by the §5 dead-end exclusion list.
4. **Repo license** — open source is mandatory, no license named by the organizer; ask in #buidl-ctc-qna or default to MIT [owner: Abu, before first public commit].
5. **Track/sector selection** — Gaming vs AI positioning (the AI track's description matches the Referee nearly verbatim); required submission field [owner: Abu with the deck, by Sep 4].
6. **Name check** — "Proof League" collision scan [owner: Abu, before submission].
7. **Operational watch** — DoraHacks announcements tab + @Creditcoin weekly (rules can change mid-season; deadline extensions have precedent but are never planned on).
8. **Post-hackathon sybil strategy** — deferred; one-auth-identity suffices at demo scale.

## 12. Assumptions Index

Every inline `[ASSUMPTION]`, surfaced for Abu's confirmation:
1. §2/§4.3 — **100 Pick Points daily allowance.**
2. §4.3/FR-8 — **Minimum stake 10** points per Pick.
3. §2 (Payout) — **Gross stake × option-count payout**; incorrect loses stake only.
4. §2/FR-18 — **Streak semantics:** no-pick days pause; all-wrong days break.
5. §4.1 — **Embedded-wallet onboarding**; provider chosen in architecture.
6. §4.3/FR-9 — **Batch merkle commitment at Lock Time** over EIP-712-signed Picks (gasless for Players).
7. §4.2/FR-5 — **Pick distribution visible before Lock Time.**
8. §4.2/FR-7 — **24 h void window** for scheduled daily events whose Source Event never occurs (void ≠ stuck).
9. §4.5/FR-20 — **Genesis Season ends Sep 17, 2026; split 50/30/20; fixed operator-funded testnet CTC pool.**
10. §4.5/FR-19 — **Tie-break:** current Streak, then earliest commitment appearance (min commit ordinal among scored Picks — the chain-recordable value), then address asc (amended at architecture gate; was signup date; accepted by Abu 2026-08-27; precision review 2026-08-31).
11. §6.2 — **One-account-per-auth-identity** anti-sybil for v1.
12. §4.2 — **2–3 Pool Race windows per day** at fixed UTC times (re-calibrated per §11.2).
13. §7 NFR-3 — **3 funded Settlement Worker accounts** cover the daily proof budget.
14. §8 — **Mobile web usable but not optimized**; desktop is the design target.
