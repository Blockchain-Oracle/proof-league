# Slice: Recurring on-chain auctions & sales (Ethereum mainnet) — liveness audit, 2026-08-22

**Headline: the anchor is broken.** The Nouns daily auction is still running mechanically (a settlement
transaction every 24h, contract not paused), but it has been settling at **0 ETH with no bidder for
~115 consecutive days**. Nouns Prop 955 (April 2026) set the on-chain reserve price to **2.8 ETH**,
which is above what anyone will pay, so every auction now ends unsold. As a *price* market the anchor
has zero uncertainty. Lil Nouns on mainnet has been dormant since July 2024. The only genuinely alive,
legible, price-uncertain recurring-sale source I could verify in this slice is the **CryptoPunks native
marketplace** (~2.6 sales/day, 30–140 ETH).

All on-chain facts below were pulled this run from Ethereum mainnet JSON-RPC (drpc.org / publicnode)
at block **25,813,747** (2026-08-22T22:43:59Z).

---

## Candidate table

| # | Source | Question | Settlement event | Cadence | Uncertain? | Single-tx? | Alive? | Fit |
|---|--------|----------|------------------|---------|-----------|-----------|--------|-----|
| 1 | Nouns daily auction (price) | "What will tonight's Noun sell for?" | `AuctionSettled(uint256 indexed nounId, address winner, uint256 amount)` @ `0x830BD73E4184ceF73443C15111a1DF14e495C706` | daily, 24h `duration()` = 86400 | **NO** — 0 ETH × 115 days | YES | mechanically yes, economically no | **2** |
| 2 | Nouns daily auction (binary bid) | "Does tonight's Noun get a bidder at all?" | same event, `winner != address(0)` | daily | technically yes, base rate ≈ 0/115 | YES (no-bid is *positively* emitted) | yes | **2** |
| 3 | CryptoPunks native marketplace | "What will the next CryptoPunk sell for?" | `PunkBought(uint256 indexed punkIndex, uint256 value, address indexed from, address indexed to)` @ `0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB` | ~2.6/day, irregular | **YES** — 30–140 ETH observed | YES | **YES** | **3** |
| 4 | ENS .eth registration | "What premium will the next name pay?" | `NameRegistered(string,bytes32 indexed,address indexed,uint256 baseCost,uint256 premium,uint256 expires)` @ `0x253553366Da8546fC250F225fe3d25d0C782303b` | ~12–25/day | **NO** — premium = 0 in 47/47 | YES | YES | **2** |
| 5 | ENS .eth renewal | "How much ETH will the next renewal cost?" | `NameRenewed(string,bytes32 indexed,uint256 cost,uint256 expires)`, same controller | ~380/day | partly (human duration × Chainlink ETH/USD) | YES | YES | **2** |
| 6 | Lil Nouns mainnet 15-min auction | — | `AuctionSettled` @ `0x55e0F7A3bB39a28Bd7Bcc458e04b3cF00Ad3219E` | **frozen** | n/a | n/a | **NO** — last auction ended 2024-07-12 | **1** |

---

## Evidence detail

### 1–2. Nouns DAO daily auction — ALIVE BUT PRICE-DEAD

Auction House proxy `0x830BD73E4184ceF73443C15111a1DF14e495C706` (V3, `settleCurrentAndCreateNewAuction`
pattern — one tx both settles and starts the next, so a settlement tx is *guaranteed* daily).

Live state read at block 25,813,747 via `auction()` (`0x7d9f6db5`):

```
nounId    = 1999
amount    = 0
startTime = 0x6a890977 -> 2026-08-22T02:29:11Z
endTime   = 0x6a8a5af7 -> 2026-08-23T02:29:11Z
bidder    = 0x0000...0000
settled   = false
```

Control reads: `paused()` = **false**, `duration()` = `0x15180` = **86400 s**,
`reservePrice()` = `0x26db992a3b180000` = **2.8 ETH** (matches Prop 955 reported by Bankless).

Every `AuctionSettled` in the last ~90k blocks (Nouns 1988–1998, 11 consecutive days):

```
1988..1998   amount = 0.0000 ETH   winner = 0x0000000000000000000000000000000000000000
```

Full-log sweep of the proxy over the last 9,990 blocks (~33h) returned exactly **two** events:
`AuctionSettled(1998, 0x0, 0)` and `AuctionCreated(1999, ...)` — i.e. **zero `AuctionBid` events**.

Historical sampling of `AuctionSettled` (10k-block windows, same RPC):

| lookback | Noun(s) | amount |
|---|---|---|
| −15d | 1985 | 0 ETH |
| −30d | 1970, 1971 | 0 ETH |
| −45d | 1956 | 0 ETH |
| −60d | 1942 | 0 ETH |
| −90d | 1913 | 0 ETH |
| **−105d** | 1898, 1899 | **0 ETH** |
| **−120d** | 1884 | **1.02 ETH** |
| −135d | 1869 | 0.48 ETH |
| −150d | 1854 | 0.53 ETH |
| −165d | 1839 | 0.51 ETH |
| −180d | 1824, 1825 | 0.40 / 0.55 ETH |
| −365d | 1621, 1622 | 1.55 / 1.16 ETH |

**Bidding died between Noun 1884 and Noun 1898, i.e. ~mid-May 2026** — consistent with the 2.8 ETH
reserve landing above a market that was clearing at 0.4–1.0 ETH.

Product read-through:
- The proof mechanics are *perfect*: one tx, receipt-decodable, indexed id, no aggregation, no absence
  proof needed (a no-bid day still emits `AuctionSettled(id, 0x0, 0)`).
- The *uncertainty* is gone. "What will it sell for?" has been 0 ETH for 115 straight days.
- Salvage framings, in decreasing honesty: (a) long-shot "will Nouns wake up tonight?" binary — proof-clean
  but ~0% and boring; (b) "who calls the settle tx tonight?" — legible-ish, uncertain, but a keeper race
  that any bot can win for gas, so trivially manipulable; (c) drop Nouns as the anchor.
- **Governance risk for a Sept-2026 demo:** the same whale coalition that set the 2.8 ETH reserve can
  `pause()` the auction house by proposal, which would stop the daily settlement tx entirely. The contract
  is unpaused today, but this is a live single-point-of-failure for any Nouns-anchored market.

### 3. CryptoPunks native marketplace — ALIVE, GENUINELY UNCERTAIN, MANIPULABLE

`PunkBought` topic0 `0x58e5d5a525e3b40bc15abaa38b5882678db1ee68befd2f60bafe3a7fd06db9e3`,
value in `data[0:32]`, punkIndex in `topics[1]`.

Last ~90k blocks (~12.5 days): **33 `PunkBought` events**, 30 with non-zero value.
Non-zero range **30.0 – 140.0 ETH**, median **33.39 ETH**. Recent tail:

```
blk 25791213  punk 9799  115.000 ETH
blk 25792791  punk 5067   32.200 ETH
blk 25796786  punk 9546   40.000 ETH
blk 25798906  punk 2547   36.480 ETH
blk 25803982  punk 1326   51.000 ETH
blk 25804583  punk 5151   38.500 ETH
blk 25813248  punk 5942    0.000 ETH   <- private/wrapper flow
```

Product read-through:
- Legible in seconds ("will the next punk sell over 35 ETH?"), continuous supply, no curation, one tx.
- **Cadence hazard:** ~2.6/day and irregular. A "today's punk sale" market needs an explicit void rule
  (resolve on first `PunkBought` after T; void if none within 24h) or it becomes an absence proof.
- **Settlement-quality hazard:** ~9% of `PunkBought` events carry `value = 0` (punk offered to a specific
  address at 0, wrapper/private flows). A naive over/under would settle "under" on a fake 0.
  Mitigation: require `value > 0` and treat `value == 0` as void.
- **Manipulation is cheap and endogenous:** a punk holder can list to a specific address and self-buy at any
  price for ~gas. Anyone holding one punk can print an arbitrary settlement print. This is the strongest
  argument against using punk *prices* as a settlement source without an outlier/self-deal filter.

### 4–5. ENS — ALIVE, BUT NOT WHERE THE UNCERTAINTY IS

Controller `0x253553366Da8546fC250F225fe3d25d0C782303b` over the last 7,000 blocks (~23h):
**379 `NameRenewed` + 24 `NameRegistered`**. Legacy controller `0x283Af0B28c62C092C9727F1Ee09c02CA627EB7F5`:
21 `NameRegistered` + 6 `NameRenewed` in the same window. BaseRegistrar
`0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85` shows ~1,040 registrar-level events/23h. ENS on mainnet is
unambiguously alive.

Decoded all 47 `NameRegistered(...baseCost, premium...)` over ~30k blocks (~4 days):

```
1917.eth  base=0.004857  premium=0.000000
9986.eth  base=0.004857  premium=0.000000
...
avataros.eth   base=0.001988  premium=0.000000
gweix.eth      base=0.002066  premium=0.000000
blockchainporn.eth base=0.002210 premium=0.000000
nonzero premium: 0 / 47
```

- The 21-day post-expiry **Dutch-auction premium is 0 in every observed registration** → "what premium will
  the next name pay?" is a constant. Dead as a market. (Also note most volume is bot bulk-registration of
  4-digit numeric names — 15 registrations in 12 consecutive blocks.)
- `baseCost` drifts (0.004857 → 0.004851 → 0.005616 ETH for 4-char names) purely because ENS prices in USD
  and converts through a Chainlink ETH/USD feed. That is an ETH-price market wearing an ENS costume —
  belongs to a price/oracle slice, not here, and fails the legibility bar.
- `NameRenewed(name, label, cost, expires)` at ~380/day is the highest-frequency single-tx price event I
  found in this slice; `cost` encodes human-chosen duration × oracle price. Uncertain, but a newcomer
  cannot read "how much ETH will the next .eth renewal cost?" as a fun question.

### 6. Lil Nouns (mainnet) — DEAD

`auction()` on `0x55e0F7A3bB39a28Bd7Bcc458e04b3cF00Ad3219E` returns:

```
nounId    = 7982
amount    = 0.15 ETH
startTime = 0x6691977b -> 2024-07-12T20:52:11Z
endTime   = 0x66919aff -> 2024-07-12T21:07:11Z
bidder    = 0x225e9b54f41f44f42150b6aaa730da5f2d23faf2
settled   = true
```

Terminal state: last auction settled, **no successor auction created**. The mainnet 15-minute auction has
been frozen for >2 years (Lil Nouns activity moved off mainnet). Any "one NFT every 15 minutes forever"
copy found in search results is marketing text, not current mainnet state.

---

## Dead ends / not found this run

- **Lil Nouns mainnet** — frozen since 2024-07-12 (verified on-chain, above).
- **Nouns Builder (nouns.build) mainnet DAO auctions** — not verified this run. Most Builder DAOs deployed
  to Zora/Base, and I did not obtain a mainnet auction-house address with recent activity within budget.
  Worth one targeted probe if the parent wants a Nouns-shaped daily auction that is not Nouns itself.
- **ENS auctions proper** — no auction mechanism exists anymore; the 2017-era Vickrey registrar is long
  retired. Only the post-expiry premium decay is auction-like, and it is currently always 0.
- **Art Blocks / SuperRare / Foundation scheduled auctions** — not probed within budget; all are
  curation-dependent (fail the continuous-supply bar) even if alive.
- **Sky/MakerDAO collateral (Clipper) auctions** — irregular, liquidation-driven, not a scheduled cadence.
- Etherscan HTML is 403 to WebFetch from this environment; everything on-chain here was verified by direct
  JSON-RPC `eth_getLogs` / `eth_call`, which is a stronger primary source anyway.

## Claims ledger

| Claim | Source | Publisher | Confidence |
|---|---|---|---|
| Nouns auction house is unpaused, 24h duration, currently auctioning Noun 1999 ending 2026-08-23T02:29:11Z | `eth_call auction()/paused()/duration()` @ blk 25813747 | Ethereum mainnet RPC (drpc.org) | high |
| Nouns 1988–1998 all settled at 0 ETH with winner `0x0`; zero `AuctionBid` events in last 33h | `eth_getLogs` on `0x830BD73E…` | Ethereum mainnet RPC | high |
| Nouns bidding stopped between Noun 1884 (1.02 ETH, ~−120d) and Noun 1898 (0 ETH, ~−105d) | sampled `eth_getLogs` windows | Ethereum mainnet RPC | high |
| `reservePrice()` = 2.8 ETH, matching Prop 955 | `eth_call 0xdb2e1eed` | Ethereum mainnet RPC | high |
| Prop 955 set the reserve to 2.8 ETH ("book value") and effectively freezes the auction as an income stream | https://finance.yahoo.com/markets/crypto/articles/nouns-dead-long-live-nouns-204135459.html | Bankless via Yahoo Finance, 2026-04-23 | medium |
| Lil Nouns mainnet auction house terminal: last auction 7982 settled 2024-07-12 | `eth_call auction()` @ `0x55e0F7A3…` | Ethereum mainnet RPC | high |
| CryptoPunks: 33 `PunkBought` in ~12.5 days, 30–140 ETH, median 33.39 ETH | `eth_getLogs` on `0xb47e3cd8…` | Ethereum mainnet RPC | high |
| ENS controller `0x2535…303b`: 379 `NameRenewed` + 24 `NameRegistered` in ~23h; premium 0 in 47/47 registrations | `eth_getLogs` + ABI decode | Ethereum mainnet RPC | high |

## Recommendation to the parent

1. **Do not ship a Nouns clearing-price market.** It is a constant. If Nouns must appear in the demo for
   narrative reasons, use it as the *proof-plumbing* showcase (a guaranteed daily settlement tx with a
   clean indexed event) and not as the uncertainty source — and disclose the pause risk.
2. **CryptoPunks `PunkBought` is the only live, legible, price-uncertain recurring sale in this slice**,
   but it needs a void rule for no-sale days and a `value > 0` guard, and it is wash-tradeable by any
   single punk holder. Treat it as a demo candidate, not a launch market.
3. This slice does not produce a 5. If the product needs a daily, uncurated, human-driven ending on
   mainnet, the answer is more likely to come from the DeFi-rhythm / blockspace slices than from
   auctions — the 2021-era auction cohort on mainnet has either died or migrated to L2s.
