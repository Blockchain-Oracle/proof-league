---
title: 'competitive research: prediction fantasy products'
type: 'competitive'
topic: 'prediction fantasy products'
decision: 'Position Proof League against Polymarket, Sorare, Fantasy Top and pick the game loop worth building'
source: 'native run (web fan-out, 3 competitor teardowns × 2 rounds)'
status: complete
preset: 'standard'
validation: 'normal'
created: '2026-08-22'
updated: '2026-08-22'
---

# competitive research: prediction fantasy products

**Decision this research serves:** Position Proof League against Polymarket, Sorare, Fantasy Top and pick the game loop worth building.

## Executive summary

**The evidence says: the specific combination Proof League proposes — a fantasy-style league over on-chain events with cryptographic proof-based settlement — was searched for twice across two rounds and does not exist anywhere.** Every retrieved fantasy/prediction hybrid settles via a commercial data feed (Opta), a price feed, a token vote (UMA), or an undisclosed centralized backend [10][15]. Three findings drive the positioning:

1. **Settlement is the market leader's open wound.** Polymarket's #1 user complaint is not payments but *grading*: UMA token-vote resolution produced documented scandals (a ~$60M market escalated over rule ambiguity; a ~$7M market resolved against reality by a whale casting ~25% of the vote; a WSJ investigation found >60% of active UMA voters linkable to Polymarket accounts and ~1 in 5 disputes involving financially interested voters) [3][4][5]. Polymarket's own regulated US venue "fixed" this by centralizing — the exchange itself rules, final, no appeal [6][7]. Nobody in the market solves settlement cryptographically. That is Proof League's wedge, verbatim.
2. **The manager fantasy retains users even when the money breaks.** Sorare's cardholders grew 33% to 378k in 2024 while revenue fell 27% [8] — but its economy collapsed from supply dilution (issuing cards through auctions *and* rewards, no sink), from paying rewards in the asset it sells, and from loot-box mechanics users read as gambling [8][9]. The single mechanic that reversed its decline was **Hot Streaks** — cumulative rewards for consecutive high scores [9].
3. **Cards-as-speculation is a proven death.** Fantasy Top hit $9.3M weekly fees at launch and was dead within two years; the founder's own post-mortem: "the card is financial before it is anything else" selects investors over players, and "a token before product-market fit is poison" [11][12][13]. Its bot-gameable social-engagement oracle forced an early competition cancellation [12] — a second, independent argument for objective proof-based scoring.

**Biggest caveat:** absence of a competitor is weak evidence of a market — it is equally consistent with "nobody wants this yet." The graveyard (Fantasy Top, Reignmakers) says the *collectible-speculation* framing dies; the survivor patterns (Sorare's manager loop, Sport.fun's fee-on-churn) say play-first with real-but-bounded stakes lives.

## Dimension: Polymarket (offshore + US)

**Mechanics.** Central limit order book, not an AMM; outcome shares trade $0.00–$1.00 and "the price directly represents the market's belief in the probability" [1]. Matched Yes+No orders mint $1 of ERC-1155 outcome tokens; winners redeem at $1 [2]. Collateral is pUSD, a 1:1 USDC-backed ERC-20 on Polygon (wrap/unwrap on-chain, no documented redemption fee) [16]. Monetization: taker-only fees, Fee = C × feeRate × p × (1−p), category feeRates 0–0.07; makers get rebates [17]. US venue (effective 2026-07-01): taker Θ=0.06 capped $1.50, maker rebate Θ=−0.0125 [7].

**Settlement — the wound.** Offshore: UMA optimistic oracle — ~$750 bond, 2-h challenge window, disputes escalate to a UMA token-holder vote, 4–6 days worst case, outcomes immutable once finalized, Polymarket disclaims ability to correct [2][3]. Documented failures: the "Strategy sells Bitcoin by May 31" ~$60M dispute (rule-ambiguity escalation, June 2026) [4]; a ~$7M Ukraine–Russia market resolved "Yes" with no deal, one holder casting ~25% of the vote via ~5M UMA across three wallets [5]; WSJ: "Nothing prevents the token holders from voting on disputed wagers in which they have a personal stake" [3]. **The US venue abandoned UMA entirely** — the CFTC-designated exchange resolves against a declared source hierarchy, settlements "final in accordance with the Rulebook", no user-facing dispute path [6]. So the market leader's two settlement modes are *conflicted token vote* and *trust-the-house* — cryptographic evidence is the unoccupied third option.

**Trajectory & voice.** ~$10.6B notional volume March 2026, ICE invested ~$1.64B, talks at $15–20B+ valuation, CFTC DCM since Nov 2025 (US venue still thin as of April 2026) [18][19]. Trustpilot 1.5/5 (~438 reviews): withdrawal delays, locked funds, unresponsive support; Reddit's serious complaints are almost all about resolution/grading, the $750 dispute bond as a barrier, and voter anonymity [20][21]. Onboarding (US): SSO + instant KYC + instant buying power on uncleared deposits — minutes to first trade; withdrawal friction lives on the fiat rails (funds-in-flight, FIFO, same-method-return) [22].

**Takeaways for Proof League:** don't compete on breadth of markets or liquidity; compete on *provable grading* for Ethereum-native questions. Copy: price-as-probability legibility, minutes-to-first-action onboarding. Avoid: any settlement path a human can dispute, and any UX where "who decides the outcome" is unanswerable in one sentence.

## Dimension: Sorare

**Loop.** Weekly 5-card fantasy lineups (captain +50%), print-capped scarcity (Limited 1,000 / Rare 100 / Super Rare 10 / Unique 1), free Common cards for the Rivals budget-capped head-to-head mode (entry costs priced by L15 form), XP earned by *participating* (training lineups even without fixtures), 1–5% same-club collection bonuses, tiered divisions [23][24].

**Economy autopsy.** Sales volume $343M (2022) → $2.7M/month trough (June 2025); revenue ~€143M → €43M; two layoff rounds (13% in 2024, 35% in Nov 2025); Solana migration to cut ~$10M costs; ~€500M of license commitments renegotiated [8][9][25][26]. Causes per community and industry analysis: card issuance through both auctions and rewards with no sink; removing the ETH payout threshold (Sept 2024) cratered engagement for ~11 months until **Hot Streaks** (cumulative payouts for consecutive high scores, Aug 2025) drove volume back over $20M and an all-time-high 1M+ monthly transactions [9]; Essence/loot-box mechanics read as gambling [27]. The decisive signal: **users kept growing (378k, +33%) while the money model failed** [8].

**Takeaways:** copy participation-earned XP, streak mechanics, budget-capped entry (skill over wallet), collection/history bonuses, and free-tier head-to-head. Avoid: paying rewards in the asset you sell, issuance without a sink, randomized loot boxes, scarcity-tier sprawl.

## Dimension: Fantasy Top (autopsy) & adjacent landscape

**Arc.** Launched on Blast May 2024; week one: $9.31M fees (5th most profitable protocol that week), $1.25M paid to influencer "heroes" [11]. Loop: demand-priced packs (~0.4 ETH at peak) → 5-card decks of CT influencers → score = Twitter engagement × rarity multiplier (1.5×/2×/2.5×) → ETH prize leaderboards; heroes earned 1.5% of their card volume + share of pack revenue [12]. Fees peaked ~$717k/month (Sep 2024), −85% by July 2025 in an oscillating decay — the signature of an economy funded by new deposits [13]. Migrated to Base, pivoted to prediction markets, drew "soft rugpull" allegations (March 2026), shut down May–June 2026 with 100% investor refunds [11][14].

**Founder post-mortem (co-founder "Kipit"):** "We tried to put crypto on top of a model that was never built for crypto"; great TCGs are games first, assets second — in crypto "the card is financial before it is anything else", selecting investors over players; "a token before product-market fit is poison" [13]. Its social-engagement oracle was bot-gamed hard enough to force an early cancellation of the first main competition [12].

**Adjacent landscape.** Sport.fun (ex-Football.Fun, Base): live; tokenized athlete shares priced by trading flow, contests settle against Opta's commercial feed, rewards paid in more inventory (closed loop), revenue = trading fee, token launched *after* PMF [15]. CoinDraft (Solana): drafts tokens under a salary cap but scores on price % gain — a price feed, not chain state [15]. Maincard (TON), Fanton (3M+ users, free-to-play distribution) persist on trusted feeds; DraftKings killed Reignmakers amid legal action [10]. **After two targeted passes: no product drafts on-chain events/entities as the "players", and no product settles via cryptographic proof. The combination is unoccupied** [10][15].

## Cross-dimension insights

- **All three competitors independently point at the same design law:** the scoreboard must be objective and ungameable (Polymarket's vote scandals, Fantasy Top's bot-farmed engagement oracle), and the collectible must be *evidence of play*, not a speculative asset (Sorare's dilution, Fantasy Top's "financial before it is anything else"). Proof-settled prediction cards whose value is *history* — what you called, when, verified on-chain — sit exactly at the intersection the graveyard clears.
- **Streaks are the single most evidenced retention mechanic in this dataset** (Hot Streaks reversed Sorare's decline; Polymarket's probability-price gives no equivalent progression). A prediction league should make consecutive-correct-calls the spine of progression.
- **Every survivor monetizes flow, not asset sales:** Polymarket takes taker fees, Sport.fun takes trade fees. Every casualty monetized primary card issuance. Monetization must come from activity (entry fees, market rake, sponsored pools), never from selling the collectible.

## Contrary evidence

No red-team pass was run (normal validation). The strongest self-identified counters: (1) white space ≠ demand — no one may want fantasy-over-on-chain-events; the mitigations are that the settlement wedge is validated by real user pain at the leader [3][20], and the hackathon itself is a cheap demand test. (2) Fantasy Top's failure could indict the entire "crypto events as entertainment" category, not just its economics — its 2,000 residual actives suggest a niche, not a mass market [11]. (3) Polymarket could bolt on leagues/leaderboards faster than Proof League can build liquidity; the durable moat is only the proof-based settlement itself.

## Recommendations (downstream bindings)

1. **Brief/positioning:** "Prediction league where the referee is cryptographic" — attack grading pain (documented, quotable [3][4][5]), not Polymarket's liquidity. Confidence: high on the pain evidence; medium on demand.
2. **PRD — game loop:** play-first league: budget-capped picks (no pay-to-win), streak-spine progression, participation XP, cards as permanent verified history. Rewards from sponsored/entry pools, never newly-minted collectible value. Confidence: high (triangulated from all three teardowns).
3. **PRD — explicit non-goals:** order books/liquidity, tradable speculation on cards at launch, any token. Confidence: high (two documented deaths).
4. **UX:** show the proof: every settled event links to the verified Ethereum transaction — the anti-Polymarket moment. One-sentence answer to "who decided this outcome?": "Ethereum did." Confidence: high.

## Open questions

- Does Polymarket run any league/leaderboard/season surface today (searched, not confirmed either way) — matters for how defensible the league framing is.
- Sorare's post-Solana-migration volumes (Oct 2025→present, no data found) — would sharpen the "manager loop survives" claim.
- Fantasy Top's V2 prediction-market/jackpot mechanics (undocumented anywhere reachable) — the closest attempted pivot to our category; Wayback dig would derisk repeating its mistakes.

## Source appendix

| [n] | Supports | Publisher | Pub | Accessed | Conf |
|---|---|---|---|---|---|
| [1] | CLOB, price=probability | [Polymarket docs — prices & orderbook](https://docs.polymarket.com/concepts/prices-orderbook.md) | — | 2026-08-22 | high |
| [2] | Minting/redemption; UMA flow, bonds, immutability | [Polymarket docs — resolution](https://docs.polymarket.com/concepts/resolution.md) | — | 2026-08-22 | high |
| [3] | WSJ: conflicted UMA voters | [Securities Docket quoting WSJ](https://www.securitiesdocket.com/2026/05/18/the-mysterious-crypto-judges-who-settle-polymarket-disputes-wsj/) | 2026-05-18 | 2026-08-22 | high (quote), med (stats — single upstream) |
| [4] | $60M Strategy-Bitcoin dispute | [The Defiant](https://thedefiant.io/news/markets/usd85m-polymarket-dispute-over-strategy-s-may-bitcoin-sale-puts-uma-s-token-voting-oracle-on) | 2026-06-01 | 2026-08-22 | med |
| [5] | Ukraine market whale-vote resolution | [Webopedia](https://www.webopedia.com/crypto/learn/polymarkets-uma-oracle-controversy/) | — | 2026-08-22 | med |
| [6] | US venue: exchange-resolved, final, no oracle | [Polymarket US docs — contract settlement](https://docs.polymarket.us/learn/markets/contract-settlement) | — | 2026-08-22 | high |
| [7] | US fee schedule (quadratic) | [Polymarket US docs — fees](https://docs.polymarket.us/fees) | 2026-07-01 | 2026-08-22 | high |
| [8] | 378k holders +33% vs revenue −27%; layoffs | [The Crypto Times (via The Big Whale)](https://www.cryptotimes.io/2025/11/21/sorare-lays-off-35-of-staff-cto-steps-back-as-nft-boom-fades/) | 2025-11-21 | 2026-08-22 | med |
| [9] | Volume collapse; ETH-payout removal; Hot Streaks recovery | [Sporting Crypto](https://newsletter.sportingcrypto.com/p/sorare-s-2025-strategy) | — | 2026-08-22 | med |
| [10] | Reignmakers shutdown; adjacent landscape | [Decrypt](https://decrypt.co/242459/draftkings-kills-fantasy-sports-nft-business) | — | 2026-08-22 | med |
| [11] | Fantasy Top shutdown; peak $9.31M week; payouts | [Decrypt](https://decrypt.co/368640/ethereum-crypto-influencer-game-fantasy-top-shutting-down) | 2026-05-21 | 2026-08-22 | high |
| [12] | Loop mechanics; bot-gamed oracle | [Decrypt — what is Fantasy Top](https://decrypt.co/resources/what-is-fantasy-top-ethereum-game-blast-crypto-twitter) | 2024-05-09 | 2026-08-22 | high |
| [13] | Fee curve ($717k peak → −85%); founder post-mortem | [DeFiLlama API](https://api.llama.fi/summary/fees/fantasy.top?dataType=dailyFees) + [The Block](https://www.theblock.co/post/402144/fantasy-top-to-shut-down-says-trading-card-game-model-was-never-built-for-crypto) | 2026-05 | 2026-08-22 | high / med |
| [14] | Soft-rugpull allegations | [The Block](https://www.theblock.co/post/393139/fantasy-top-slow-rugpull-allegation) | 2026-03-11 | 2026-08-22 | high |
| [15] | Sport.fun mechanics/token; CoinDraft | [Blocmates](https://www.blocmates.com/articles/football-fun-the-most-rewarding-fantasy-sports-platform) + [Bitrue](https://www.bitrue.com/blog/what-is-sportfun-fun-token) + [CoinDraft](https://www.coindraft.gg/) | 2026-01 | 2026-08-22 | med |
| [16] | pUSD design | [Polymarket docs — pUSD](https://docs.polymarket.com/concepts/pusd.md) | — | 2026-08-22 | high |
| [17] | Offshore fee schedule | [Polymarket docs — fees](https://docs.polymarket.com/trading/fees.md) | — | 2026-08-22 | high |
| [18] | Volume $10.6B; ICE investment | [TradingKey](https://www.tradingkey.com/analysis/cryptocurrencies/more/261801030-crypto-polymarket-ice-prediction-predict-forecast-cme-cboe-robinhood-tradingkey) + [Dealroom/Bloomberg](https://app.dealroom.co/news/note/polymarket-in-talks-to-raise-400m-at-15b-valuation-from-strategic-investors-beyond-ice) | 2026-03 | 2026-08-22 | med |
| [19] | CFTC DCM; US beta thin | [CoinDesk](https://www.coindesk.com/policy/2026/04/28/polymarket-seeks-cftc-approval-to-reopen-main-exchange-to-u-s-traders) | 2026-04-28 | 2026-08-22 | med |
| [20] | Trustpilot 1.5/5 | [Trustpilot — Polymarket](https://www.trustpilot.com/review/polymarket.com) | — | 2026-08-22 | med |
| [21] | Reddit grading complaints | [SportBot AI roundup](https://www.sportbotai.com/blog/is-polymarket-legit-reddit) | — | 2026-08-22 | low |
| [22] | US onboarding/withdrawal rails | [Polymarket US docs — signup/deposits/withdrawals](https://docs.polymarket.us/learn/get-started/signup.md) | — | 2026-08-22 | high |
| [23] | Card tiers, XP, collections, lineup | [LaLiga Expert guide](https://laligaexpert.com/2024/10/17/sorare-guide/) | 2024-10-17 | 2026-08-22 | high |
| [24] | Rivals budget-capped mode | [Sorare Football Guide](https://en.sorarefootballguide.com/sorare-rivals) | — | 2026-08-22 | med |
| [25] | Solana migration | [The Defiant](https://thedefiant.io/news/nfts-and-web3/sorare-migrates-to-solana-from-starkex) | 2025-10 | 2026-08-22 | med |
| [26] | 2024 layoffs | [TechCrunch](https://techcrunch.com/2024/03/06/nft-fantasy-sports-startup-sorare-layoffs-web3-gaming/) | 2024-03-06 | 2026-08-22 | med |
| [27] | Essence/loot-box sentiment | [Medium — mpenn10](https://medium.com/@mpenn10/sorare-rewards-desirability-19d4feb053c5) | — | 2026-08-22 | low |

## Staleness map

Competitive pack bars (pricing/features ≤3 mo, trajectory ≤6 mo, sentiment ≤12 mo): **Polymarket US fee schedule & product surface** — re-check ~2026-10-01 (the venue is in active flux); **whether Polymarket ships a league/leaderboard surface** — watch continuously through launch, it is the fastest way our wedge narrows; **Sorare post-migration volumes** — re-check when CryptoSlam/DappRadar coverage resumes (~2026-10); **Sport.fun fee schedule (3% vs 5% unresolved)** — re-check before citing in any deck. Earliest re-check: Polymarket product surface, ~5 weeks out.
