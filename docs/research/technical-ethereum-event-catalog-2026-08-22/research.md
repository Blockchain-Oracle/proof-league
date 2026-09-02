---
title: 'technical research: Ethereum event catalog for proof-settled markets'
type: 'technical'
topic: 'Ethereum event catalog for proof-settled markets'
decision: "Choose Proof League's launch market catalog: which recurring real-Ethereum events make good proof-settled prediction markets"
source: 'native run (6-slice web+RPC fan-out, 43 candidates, 3 blind liveness verifications with live on-chain decoding)'
status: complete
preset: 'standard'
validation: 'normal'
created: '2026-08-22'
updated: '2026-08-23'
---

# technical research: Ethereum event catalog for proof-settled markets

**Decision this research serves:** choose Proof League's launch market catalog. Evidence quality note: unusually strong — most liveness claims come from **direct JSON-RPC reads of Ethereum mainnet this run** (head block ~25,813,750, 2026-08-22 ~22:45 UTC), not articles.

## Executive summary

**The evidence says: build the daily engine on the Lido rebase, the fun on Uniswap v4 pool races, the weekly headliner on the Curve gauge war — and drop Nouns as a price market, because it is verifiably dead money.** Three findings drive this:

1. **The presumed flagship failed liveness.** Nouns' auction plumbing is textbook-perfect (one daily tx, price in one event — every byte verified [1]), but a blind verifier decoded the actual history: **80+ consecutive settlements at 0 ETH with zero bids since ~May 29**, caused by governance (Prop 955) setting a 2.8 ETH reserve above market; cadence has also drifted to ~26.1 h [2]. A price market on it is a constant, not a question.
2. **A better flagship passed with the strongest verification in the catalog.** The **Lido daily rebase**: one transaction every day at 12:00:11 UTC (six consecutive days decoded on-chain, metronomic, zero gaps) emits `TokenRebased` — the day's realized staking APR, computable entirely from one receipt. Real outcomes 2.17–2.38% across six days (crosses bucket boundaries), and manipulating it means moving ~a third of Ethereum's validator set [3][4]. Bonus: the same receipt carries `ETHDistributed` (the day's MEV harvest) — **one proof settles two markets** [4].
3. **Content supply is confirmed effectively infinite, at three rhythms.** Hours: Uniswap v4 emits ~344 new-pool events/day (~14/hour, measured) — race-framed markets neutralize the $10–30 forcing cost [5]. Daily: Lido. Weekly: Curve's gauge-weight flip every Thursday 00:00 UTC (71 votes in 8.4 days measured) via our snapshot keeper [6]. Plus calendar spice: the 2,550,000th beacon-chain deposit (running counter carried *inside* the event — cleanest settlement shape found; 6,765 away at scan time) [7] and a Glamsterdam-fork probe on Sepolia (new SLOTNUM opcode turns "did the fork activate" into a positive one-tx proof) [8].

**Biggest caveat:** every real-mainnet market hangs on the still-unverified chainKey-3 (testnet-reads-mainnet) capability — the day-1 live probe from the USC research remains the gate. Fallback demo path stays the Sepolia contest contracts.

## The launch lineup (recommendation)

| Slot | Market | Why | Settlement |
|---|---|---|---|
| **Daily flagship** | "What will Ethereum's staking yield print at today's Lido report?" (5 bp buckets around ~2.2–2.4%) | Metronomic daily; genuinely uncertain; unmanipulable; blind-verified live [3][4] | Native: one `TokenRebased` receipt, no keeper |
| **Daily bonus (same proof)** | "How much MEV will Lido validators book today?" | Free second market from the identical receipt — visible Attestcoin depth [4] | Native: `ETHDistributed`, same tx |
| **Hours-scale fun** | Uniswap v4 pool races: "which appears first after 14:00 — a new USDC pool or a new USDT pool?" | ~14 new pools/hour measured; race framing makes forcing self-defeating [5] | Native: first valid `Initialize` proof submitted wins |
| **Weekly headliner** | Curve gauge war: "which pool takes the biggest share of this week's CRV emissions?" (picks freeze early — see reconciliation note) | Fixed Thursday 00:00 UTC clock; five-to-six-figure manipulation cost [6] | Snapshot keeper: poke calls `gauge_relative_weight_write`, emits the weight |
| **Calendar spice** | "Which day does Ethereum record its 2,550,000th staking deposit?" | Running `index` inside `DepositEvent` — no keeper, no aggregation; ~216k ETH to force meaningfully [7] | Native: the receipt whose decoded index matches |
| **Tech showcase (stretch)** | Glamsterdam fork probe on Sepolia; base-fee daily average (the market Vitalik asked for in Dec 2025 [9]) | Narrative gold: converts a fork into a positive proof; TWAP defeats the $7k spot-attack [8][10] | Probe tx / accumulator keeper |

Two product primitives fall out of the catalog and both deepen the Attestcoin story:
- **The Settlement Snapshot keeper** — one small Ethereum contract, poke at/after the deadline, pure on-chain reads only, emits `SettlementSnapshot(marketId, value)`; ~30–60k gas ≈ $0.07 on 2026 mainnet, free on Sepolia; prior art Sky OSM poke / Uniswap v3 observe [10]. Rules learned: pin `block.timestamp >= deadline`, record the read block, never accept the value as a poke argument, and a missed poke is a stuck market, not a NO.
- **The race framing** — for cheap-to-force events (pool creation), ask which of two equally-forceable outcomes lands first: manipulation becomes self-defeating instead of profitable [5].

## Verified dead ends (do not revisit)

- **Nouns price markets** — 0-ETH regime; salvage only as heartbeat/timing or a "will any bid land" long-shot (endogenous: a YES-holder can bid the 2.8 ETH reserve) [1][2]. Watch item: a governance vote lowering the reserve would revive the best story in crypto ("bidding returns to Nouns") — leave a hook.
- **Per-transaction gas cost** — simulatable; the owner's own disqualifier. Seductive because it passes every referee rule and no quality bar [10].
- **ETH burned per day / block fullness** — structurally unreachable: no GASUSED opcode, nothing for any keeper to read; no on-chain publisher exists [10].
- **Blob base fee** — EIP-7918 pins it to ~1/16 of execution base fee at 20–30% utilization; a duplicate market with worse legibility [10].
- **Scheduled vesting unlocks** — computable from the on-chain schedule once the cliff passes [11].
- **ENS premium auctions** — premium was 0 in 47/47 decoded registrations; also no marquee expiry lands in the demo window (disproved on-chain across 21 famous names) [12][8].
- **Lil Nouns mainnet** — frozen since July 2024 despite marketing copy [1].
- **Spot base fee / spot DEX prices** — $7k forces a 10× base-fee spike for minutes; flash loans shove spot prices; only time-averages survive [10].
- **Aave "will a liquidation happen" / Sablier / Livo attribute markets** — absence-shaped NO branches or single-party self-settlement [11][13].

## Reconciliations (cross-slice contradictions resolved by the lead)

1. **Nouns (auctions slice & verifiers vs. governance/calendar slices):** the 5/5 scores came from researchers who verified mechanics but sampled ≤1 settlement's payload; the auctions researcher and both blind verifiers decoded the full history. **Resolution: mechanics verified, price signal dead — verifier evidence wins.** The calendar slice's id-to-date arithmetic also overstated precision (observed cadence ~26.1 h with unbounded drift, not 24 h) [2].
2. **Curve gauge weights (defi slice "simulatable" vs. governance slice 4/5):** both right at different times. At the Thursday boundary the weights are a deterministic function of votes already cast — but votes keep arriving until the flip and each voter can only move once per 10 days. **Resolution: usable IF picks freeze early in the week** (standard practice anyway); never let betting run to the boundary [6].
3. **Governance tallies:** only Aave Governance V3 puts final tallies in a terminal event (`ProposalQueued/Failed(id, votesFor, votesAgainst)` — live receipt decoded, proposal 509, ~383k FOR) [14]; Nouns/ENS/Uniswap/Compound require a keeper. Governance is ~monthly flavor, never the spine; sell **turnout and timing**, never direction on whale-decided DAOs [14].

## Open questions

- **chainKey 3 live probe** (inherited gate from the USC run) — everything mainnet-flavored depends on it; Sepolia contest contracts remain the fallback.
- **Lido V3 decoder detail:** `TokenRebased` unchanged, but the AccountingOracle function selector moved to `0x11a78d23` (V3 struct) — log-only decoding is safe; never key on the function ABI [4].
- Nouns bid-distribution history and Uniswap's current Governor address — only if those hooks are ever wanted.
- No live mainnet IDO with `SaleFinalized(totalRaised)` was found — the ideal event shape has no live emitter; worth one follow-up someday [13].

## Source appendix

| [n] | Supports | Publisher | Pub | Accessed | Conf |
|---|---|---|---|---|---|
| [1] | Nouns/Lil Nouns/Punks/ENS auction slice; live reads | [Ethereum mainnet JSON-RPC (eth.drpc.org), auctions digest](https://eth.drpc.org) | 2026-08-22 | 2026-08-22 | high |
| [2] | Nouns 80+ zero settlements; Prop 955 reserve; ~26.1 h drift | [Blind verifier: Tenderly public gateway + publicnode RPC decode](https://gateway.tenderly.co/public/mainnet) | 2026-08-22 | 2026-08-22 | high |
| [3] | Lido rebase variance; July incident | [Lido governance forum disclosure](https://research.lido.fi/t/security-disclosure-25-7-2026-minor-underreporting-of-total-protocol-cl-side-balances-in-accounting-oracle-report/11756) | 2026-07-25 | 2026-08-22 | high |
| [4] | TokenRebased/ETHDistributed decoded live: 6 daily reports, APRs 2.17–2.38%, tx hashes; V3 selector correction | [Blind verifier: on-chain eth_getLogs decode + lidofinance/lido-dao](https://github.com/lidofinance/lido-dao) | 2026-08-22 | 2026-08-22 | high |
| [5] | Uniswap v4 344 pools/day; v3 25/day; event layouts | [Ethereum mainnet JSON-RPC, launches digest](https://eth.drpc.org) | 2026-08-22 | 2026-08-22 | high |
| [6] | Curve Thursday flip; 71 VoteForGauge/8.4 d; no native finalize | [Curve Resources docs + mainnet RPC scan](https://resources.curve.finance/reward-gauges/gauge-weights) | 2026-08-22 | 2026-08-22 | high |
| [7] | Deposit counter in-event; 2,543,235 at scan; 90M-ETH balance read | [Beacon deposit contract via publicnode RPC](https://ethereum-rpc.publicnode.com) | 2026-08-22 | 2026-08-22 | high |
| [8] | Glamsterdam: Platåberget forked Aug 20; SLOTNUM probe design; ENS expiries disproved | [Ethereum Foundation blog](https://blog.ethereum.org/2026/08/17/plataberget-testnet) + [EIP-7773](https://eips.ethereum.org/EIPS/eip-7773) + RPC reads | 2026-08-17 | 2026-08-22 | high |
| [9] | Vitalik's basefee-market call; Hasu objection | [The Block](https://www.theblock.co/post/381677/vitalik-buterin-pushes-for-trustless-gas-futures-market-to-hedge-ethereum-fees-sparking-debate) | 2025-12-08 | 2026-08-22 | high |
| [10] | Network-quantities slice: opcode limits, EIP-7918 floor, keeper costs, manipulation math | [Ethereum Foundation](https://ethereum.org/latest/building-on-ethereum-in-2026/) + [EIP-7918](https://eips.ethereum.org/EIPS/eip-7918) + [EIP-7002](https://eips.ethereum.org/EIPS/eip-7002) | 2026 | 2026-08-22 | high |
| [11] | Sablier/vesting analysis; EIP-721 no-sellout-event | [Sablier docs](https://docs.sablier.com/guides/lockup/deployments) + [EIP-721](https://eips.ethereum.org/EIPS/eip-721) + RPC scans | 2026-08-22 | 2026-08-22 | high |
| [12] | ENS premium=0 in 47/47; renewal cadence | [ENS controllers via eth.drpc.org decode + ENS support docs](https://support.ens.domains/en/articles/7900612-temporary-premium) | 2026-08-22 | 2026-08-22 | high |
| [13] | Livo Launchpad (mainnet pump.fun): events, 2 graduations/30 d, $6–14k forcing | [LivoLaunchpad contracts + mainnet RPC](https://github.com/LivoLaunchpad/livo-contracts) | 2026-08-22 | 2026-08-22 | high |
| [14] | Aave Gov V3 tallies-in-event; live receipt proposal 509; Nouns/ENS Governor event sets | [aave-dao/aave-governance-v3 + nounsDAO/nouns-monorepo + RPC scans](https://github.com/aave-dao/aave-governance-v3) | 2026-08-22 | 2026-08-22 | high |

## Staleness map

This catalog ages fast — it describes live market regimes. **Lido APR band** (2.17–2.38% observed): re-sample the week before launch to set buckets. **Nouns 0-bid regime**: could flip any week via governance — check before demo day for the "bidding returns" story. **Uniswap v4 pool rate** (~344/day): re-measure at launch to calibrate race windows. **Glamsterdam Sepolia date**: unannounced — check blog.ethereum.org weekly. **Beacon deposit #2,550,000 timing**: re-poll `get_deposit_count()` twice 24 h apart to date it. Earliest re-check: all of the above in the day-1 technical spike (~Aug 24–25).
