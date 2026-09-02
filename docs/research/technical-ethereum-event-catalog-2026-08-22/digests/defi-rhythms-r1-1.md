# Slice digest — DeFi / protocol rhythms (recurring Ethereum-mainnet settlement events)

**Run date:** 2026-08-22 · **Researcher:** defi-rhythms · **Round:** r1
**Question:** which recurring DeFi/protocol events on Ethereum mainnet end in ONE emitted event carrying an uncertain value, and are alive in mid-2026?

## Headline

One candidate clears every referee rule and every quality bar today: **the Lido daily accounting-oracle report**. It fires roughly once a day, lands in a single Ethereum transaction, emits `TokenRebased` from a single well-known contract, and the number it carries (the day's stETH APR) depends on the aggregate behaviour of ~1M validators over the preceding day — un-simulatable, un-manipulable at any sane cost, and legible in one sentence ("how much did stETH earn today?"). It is provably alive: Lido published a security disclosure about a *specific daily rebase* on 2026-07-25 and a post-mortem on 2026-08-06.

Everything else in this slice is either weekly-and-donation-manipulable (Curve), permissioned-publisher-endogenous (Ethena, Sky), absence-proof-shaped (Aave liquidations), or needs the snapshot-keeper pattern plus a trusted-publisher flag (Chainlink).

## Candidate table

| # | Candidate | Cadence | Single-tx? | Uncertainty | Manip. cost | Fit |
|---|---|---|---|---|---|---|
| 1 | Lido daily rebase — `TokenRebased` | daily ~12:00 UTC | YES | validator-set performance over 24h | prohibitive (oracle quorum only) | **5** |
| 2 | Lido daily EL/MEV rewards — `ETHDistributed` | daily, same tx | YES | MEV/tips harvested that day | prohibitive | **4** |
| 3 | Chainlink ETH/USD round after a deadline | ~hourly+ | ONLY-VIA-SNAPSHOT | ETH price | can't move global ETH price; but **trusted publisher** | **4** |
| 4 | Curve weekly veCRV fee distribution | weekly (Thu) | ONLY-VIA-SNAPSHOT | week's trading volume + crvUSD interest | **cheap — donation attack** | **3** |
| 5 | Ethena sUSDe weekly rewards — `RewardsReceived` | weekly, split into several txs | ONLY-VIA-SNAPSHOT | perp funding rates | permissioned rewarder = endogenous | **3** |
| 6 | Sky Smart Burn Engine flap/`kick` | sub-daily (hop) | YES | SKY/USDS pool price at kick | **cheap — kicker can sandwich** | **2** |
| 7 | Aave v3 `LiquidationCall` | irregular, clustered | YES (per-liquidation) | market stress | trivial — self-liquidate | **2** |

---

## 1. Lido daily rebase — `TokenRebased` (fit 5)

- **Contract:** stETH `0xae7ab96520de3a18e5e111b5eaab095312d7fe84` (Ethereum mainnet), triggered by the AccountingOracle report tx.
- **Event (verified from `lidofinance/lido-dao` master `Lido.sol` this run):**
  ```solidity
  event TokenRebased(
      uint256 indexed reportTimestamp,
      uint256 timeElapsed,
      uint256 preTotalShares,
      uint256 preTotalEther,
      uint256 postTotalShares,
      uint256 postTotalEther,
      uint256 sharesMintedAsFees
  );
  ```
- **Answer field:** daily APR = `((postTotalEther/postTotalShares) / (preTotalEther/preTotalShares) - 1) * 365d/timeElapsed`. All five inputs are in the one event, so a Creditcoin-side decoder can compute the bucket from the receipt alone with no external data.
- **Cadence:** Lido docs say oracle reports deliver accounting data "usually (but not guaranteed) once a day". Design the market as "the **next** `TokenRebased` after time T", never "the report on day D" — that keeps settlement positive-only and immune to a skipped day.
- **Uncertainty:** the number is the realised consensus-layer + execution-layer yield of Lido's whole validator set for the past day: attestation effectiveness, proposer luck, MEV in the blocks Lido validators happened to propose, slashings/penalties, and new deposits. Forecastable to a band (~2.0–2.3%), not computable. Hard evidence of real variance: 2026-07-25 the report printed **2.04%** where ~2.15% was expected; the corrected 2026-07-26 report printed an extrapolated **2.29%**. That spread across two consecutive days is exactly the spread a 3-bucket card wants.
- **Manipulation:** to move the printed APR you must move the rewards of ~a third of Ethereum's validators — not purchasable. The only real vector is the oracle committee itself misreporting (which is precisely what the July 2026 incident looked like, and it was an accident, disclosed, and corrected). **Endogeneity flag:** Lido oracle members could in principle bet on their own report. For a hackathon demo this is a footnote; for production, exclude oracle-member addresses or cap stake.
- **Single-tx:** YES. One `AccountingOracle.submitReportData` tx; the receipt contains the `TokenRebased` log emitted by the stETH address. Status + emitter + topic0 + values all decodable — exactly the Attestcoin receipt shape.
- **Attestation delay:** irrelevant; the ending is scheduled ~daily, not second-by-second.
- **Caveat to re-verify before building:** Lido shipped Staking Router v3 in 2026 and the master source now also declares `CLBalancesUpdated` and `InternalShareRateUpdated`. Confirm on Etherscan that `TokenRebased` is still emitted by `0xae7ab9…` in the *most recent* report tx before wiring the decoder.

**Market copy:** *"What will stETH's daily yield print at today's Lido report? Under 2.0% / 2.0–2.2% / Over 2.2%"*

## 2. Lido daily EL rewards — `ETHDistributed` (fit 4)

Same transaction, second event, spicier number:
```solidity
event ETHDistributed(
    uint256 indexed reportTimestamp,
    uint256 preCLBalance,
    uint256 postCLBalance,
    uint256 withdrawalsWithdrawn,
    uint256 executionLayerRewardsWithdrawn,
    uint256 postBufferedEther
);
```
`executionLayerRewardsWithdrawn` is the day's MEV + priority-tip harvest — far more volatile day-to-day than the blended APR, because it is proposer-luck times whatever MEV existed that day. Free second market off an ending you are already proving. Slightly less legible than "yield %", hence 4.

**Market copy:** *"How much MEV will Lido book today? Under 300 ETH / 300–600 / Over 600"*

## 3. Chainlink ETH/USD round after a deadline (fit 4)

- **Trust model — say this out loud in the demo:** Chainlink is a *trusted publisher writing onto Ethereum*. The proof system honestly proves "the Chainlink aggregator contract emitted this price". It does not prove ETH's price. That is allowed under the referee's rule 5, but it must be labelled, because it is a different trust story from Lido/Curve/Sky where the number is a protocol's own state.
- **Mechanics:** the ETH/USD aggregator updates on a **0.5% deviation threshold or a 3600s heartbeat**, whichever comes first — so several rounds a day, more when ETH moves. Each round emits `AnswerUpdated(int256 indexed current, uint256 indexed roundId, uint256 updatedAt)` from the underlying aggregator (not the proxy).
- **The trap:** "the first round at/after 17:00 UTC Friday" is **not** provable from one receipt — proving a given round is the *first* after the deadline requires proving no earlier qualifying round exists, which is an absence proof. Rule 2 kills the naive version.
- **Fix → ONLY-VIA-SNAPSHOT:** deploy a keeper contract on Ethereum that anyone may poke in a window `[deadline, deadline+15min]`; it calls `latestRoundData()` on the ETH/USD proxy and emits `Snapshot(int256 price, uint80 roundId, uint256 ts)`. First successful poke settles. Bounty the poke so the window never goes empty. Now settlement is one tx, one emitter you control, one decodable field. The residual game is a poker delaying inside the window; a 15-minute window on an hourly-heartbeat feed bounds that to noise.
- **Uncertainty / legibility:** maximal and instant respectively — the most legible market a newcomer will ever see.
- **Manipulation:** you cannot move the global ETH price for a hackathon-sized pot. Cost is effectively unbounded.
- **Unverified this run:** the aggregator/proxy address and the exact `AnswerUpdated` signature — `data.chain.link` returned 429. Re-read the address from data.chain.link and topic0 from Etherscan before building.

**Market copy:** *"Where does ETH/USD print at Friday 5pm? Under $2,200 / $2,200–2,400 / Over $2,400"*

## 4. Curve weekly veCRV fee distribution (fit 3)

- **Contract:** `FeeDistributor` — Etherscan labels `0xD16d5eC345Dd86Fb63C6a9C43c517210F1027914` as "Curve.fi: FeeDistributor". Curve migrated veCRV payouts from 3CRV to **crvUSD**; confirm which distributor is the live crvUSD one before wiring.
- **Cadence:** weekly, distributed **Thursday**. Alive and varying: **Week 32 of 2026 (Aug) = $71.5k, +4.6% w/w**; Week 16 (Apr 2026) = $78k; July 2026 averaged $105k/wk vs $124k in June. That is a healthy, continuously-supplied, genuinely-varying weekly number.
- **Uncertainty:** the week's Curve trading volume plus 80% of crvUSD market interest. Not computable in advance. Good.
- **Aggregation problem:** `checkpoint_token` may fire multiple times in a week (at most once per 24h), so no single `CheckpointToken(time, tokens)` log equals the week's total → **ONLY-VIA-SNAPSHOT**: poke a keeper after Thursday that reads `tokens_per_week(weekTs)` and emits it.
- **Manipulation — the killer:** the distributor counts its own crvUSD balance. Anyone can **donate crvUSD directly to the distributor** and inflate the checkpoint. At a ~$70k weekly scale, a bettor sizing a position above the donation profits deterministically. Any bucket boundary within a few tens of $k of the expected value is buyable. Would need bucket widths far wider than plausible donations, or a cap. This is why it scores 3, not 5.

**Market copy:** *"How much will veCRV holders get paid this Thursday? Under $60k / $60–90k / Over $90k"*

## 5. Ethena sUSDe weekly rewards (fit 3)

- **Contract:** StakedUSDe `0x9d39a5de30e57443bff2a8307a4256c8797a3497` (Etherscan-labelled "Staked USDe (sUSDe) | ERC-4626").
- **Cadence / mechanics:** Ethena Foundation computes APY weekly and pays the StakingRewardsDistributor; per Ethena docs, rewards for a period are distributed **the following week, deliberately in multiple smaller payments** to stop arbitrage of lumpy distributions. Each payment emits a rewards event, but the *weekly total* spans several txs → **ONLY-VIA-SNAPSHOT** (poke a keeper reading `totalAssets()` / the vesting amount).
- **Uncertainty:** perp funding + basis + ETH staking yield — genuinely future market behaviour, excellent.
- **Endogeneity flag:** the rewarder is a permissioned Ethena role. The entity that sets the number could bet on it. Materially worse trust story than Lido, where the number is produced by a validator set nobody controls.
- **Legibility:** strong — "how much yield will Ethena pay stakers this week?"

## 6. Sky Smart Burn Engine flap/`kick` (fit 2)

- Sky's SBE converts protocol surplus into SKY buy-and-burn on a cooldown (`hop`), triggered by `vow.flap` → Flapper `kick`; the emitted event carries the USDS lot and the SKY bought. That "bought" figure is the uncertain value.
- **Alive but shrunken:** the SBE ran at ~$1M/day; in **March 2026 the daily allocation was cut from 300,000 to 37,600 USDS (-87.5%)**, and a "SBE BEAM" module now lets a trusted operator retune SBE parameters without a core spell. Both facts point the same way: the number is increasingly *governance-set* rather than market-discovered.
- **Manipulation — fatal at hackathon scale:** the caller chooses *when* to kick, and the trade routes through a Uniswap SKY/USDS pool. A bettor can move that pool immediately before kicking and unwind after, so the cost of forcing a bucket is only slippage-round-trip, not the bet size. Combined with a 37.6k USDS lot, this is cheap.
- **Not verified this run:** developers.sky.money 301s to developers.skyeco.com which 404s — no primary event signature, no `hop` value, no 2026 on-chain tx. Treat all mechanism detail here as unconfirmed.

## 7. Aave v3 `LiquidationCall` (fit 2)

- Event shape: `LiquidationCall(address indexed collateralAsset, address indexed debtAsset, address indexed user, uint256 debtToCover, uint256 liquidatedCollateralAmount, address liquidator, bool receiveAToken)` (signature from prior knowledge, **not verified this run**).
- **Alive, but bursty:** Aave v3 sat at ~$12.2B TVL with 82.46% utilisation in Aug 2026; ETH's +18% day on **2026-08-20** produced $3B of crypto-wide liquidations without cascading Aave; a March 2026 stale-risk-oracle incident caused $26–27M of wstETH liquidations.
- **Why it fails the referee:** "will a liquidation over $X happen today?" resolves NO by absence — unprovable. Only YES is provable. And continuous supply is not guaranteed: calm days may produce nothing above any interesting threshold.
- **Manipulation:** trivial. Anyone can open a thin position and self-liquidate to force a YES for a few hundred dollars of gas plus the liquidation bonus they pay themselves.
- Salvageable only as "the first liquidation after time T — which collateral asset?" with a keeper fallback, and even then the self-liquidation attack persists.

---

## Claims (each with a source retrieved this run)

| Claim | Source | Publisher | Confidence |
|---|---|---|---|
| Lido runs a **daily** accounting-oracle report; the 2026-07-25 report printed a daily rebase APR of 2.04% vs ~2.15% expected, corrected 2026-07-26 to 2.29%; post-mortem 2026-08-06 | https://research.lido.fi/t/security-disclosure-25-7-2026-minor-underreporting-of-total-protocol-cl-side-balances-in-accounting-oracle-report/11756 | Lido Governance Research forum | high |
| `TokenRebased` and `ETHDistributed` exact signatures (plus V3-era `CLBalancesUpdated`, `InternalShareRateUpdated`) | https://github.com/lidofinance/lido-dao (master `Lido.sol`) | Lido Finance / GitHub | high |
| stETH mainnet address `0xae7ab96520de3a18e5e111b5eaab095312d7fe84`; oracle reports arrive "usually (but not guaranteed) once a day" | https://docs.lido.fi/contracts/lido/ | Lido Docs | high |
| Chainlink ETH/USD updates on 0.5% deviation or 3600s heartbeat; publishes median with round id + timestamp | https://data.chain.link/feeds/ethereum/mainnet/eth-usd (via search snapshot) + https://docs.chain.link/data-feeds | Chainlink | medium |
| Curve fees are collected weekly, swapped to crvUSD, distributed to veCRV **on Thursday**; Week 32 2026 distribution $71.5k (+4.6%), Week 16 2026 $78k, July 2026 avg $105k vs June $124k | https://news.curve.finance/curve-best-yields/ , https://news.curve.finance/curve-monthly-recap-july-2026/ | Curve Finance news | medium |
| Curve `FeeDistributor` at `0xD16d5eC345Dd86Fb63C6a9C43c517210F1027914`; checkpoint tracks distributor balance, updatable at most once per 24h | https://etherscan.io/address/0xD16d5eC345Dd86Fb63C6a9C43c517210F1027914 , https://docs.curve.finance/fees/FeeDistributor/ (search snapshot) | Etherscan / Curve Docs | medium |
| Ethena computes APY weekly and distributes the following week in multiple smaller payments to prevent arbitrage | https://docs.ethena.fi/solution-overview/protocol-revenue-explanation/susde-rewards-mechanism | Ethena Docs | high |
| sUSDe StakedUSDe ERC-4626 at `0x9d39a5de30e57443bff2a8307a4256c8797a3497` | https://etherscan.io/token/0x9d39a5de30e57443bff2a8307a4256c8797a3497 | Etherscan | high |
| Sky SBE launched Feb 2025; ran ~$1M USDS/day; **March 2026** daily allocation cut 300,000 → 37,600 USDS (-87.5%) | https://tokenomics.com/articles/sky-tokenomics-how-the-smart-burn-engine-destroys-102m-in-sky-per-year | Tokenomics.com (aggregator) | low |
| SBE BEAM module launched on-chain letting a trusted operator retune SBE params without a core spell | https://forum.skyeco.com/t/smart-burn-engine-bounded-external-access-module-sbe-beam-launch/28149 | Sky Forum | low |
| Aave ~$12.2B TVL, 82.46% utilisation Aug 2026; ETH +18% on 2026-08-20 → ~$3B crypto-wide liquidations; March 2026 stale-oracle event → $26–27M wstETH liquidations | https://crypto.news/ethereum-aave-defi-liquidation-risk/ , https://cryptorank.io/news/feed/dd516-aave-v3-records-285-million-of-liquidation | crypto.news / CryptoRank | medium |

## Dead ends & not-found

- **Curve gauge-weight weekly epoch (`NewGaugeWeight`, Thursday 00:00 UTC) — DISQUALIFIED on rule 6.** Weights at the epoch boundary are a deterministic function of votes already cast on-chain before the boundary. Fully simulatable in advance. Same failure mode as the product owner's gas-cost example.
- **Sky/MakerDAO collateral auctions (Clipper `Kick`/`Take`) — no 2026 frequency data found.** Sky collateral is now dominated by RWA/stablecoin/LST positions; collateral auctions appear rare and irregular. Not a continuous-supply source.
- `developers.sky.money/core-protocol/smart-burn-engine/` 301s to `developers.skyeco.com/...` which returns **404** — could not obtain a primary Flapper address, `kick` signature, or `hop` interval.
- `data.chain.link/feeds/ethereum/mainnet/eth-usd` returned **429** — no primary ≤3-month on-chain update evidence, no verified aggregator address, no verified `AnswerUpdated` topic0.
- `docs.curve.finance/fees/FeeDistributor/` **404**, `resources.curve.finance/vecrv/fee-collection-distribution/` **403** — `CheckpointToken` signature and the crvUSD-era distributor address remain unverified.
- No Etherscan tx-level evidence retrieved for any candidate (all liveness here is docs/forum/news-grade). A blind-verify pass should pull one recent tx hash per top-3 candidate.
- **Lido V3 / Staking Router v3 risk:** a 2026 Staking Router v3 incident and post-mortem exist, and the master source carries new accounting events. Confirm `TokenRebased` is still the emitted rebase event in the latest report tx.

## Recommendation to the parent

Ship the demo on **Lido `TokenRebased`**. It is the only ending in this slice that is daily, single-tx, receipt-decodable, un-simulatable, effectively un-manipulable, and demonstrably alive within the last month. Take `ETHDistributed` from the *same transaction* as a free second market — one proof, two cards, which is a nice thing to say on stage. Hold Chainlink ETH/USD as the "everyone understands this instantly" card, but only with the snapshot-keeper and an explicit trusted-publisher disclaimer. Do not build on Curve, Sky, or Aave liquidations for a judged demo: donation attacks, sandwichable kicks, and absence proofs respectively.
