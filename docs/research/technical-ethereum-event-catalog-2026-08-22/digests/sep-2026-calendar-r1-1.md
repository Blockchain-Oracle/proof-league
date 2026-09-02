# Slice digest: September 2026 Ethereum calendar (demo week Sep 1–18, 2026)

**Run date:** 2026-08-22 · **Chain reference point:** mainnet block **25,813,753**, timestamp **2026-08-22 22:45 UTC**
**Method note:** etherscan.io returns **HTTP 403** to WebFetch. All on-chain facts below were read **live this run** by direct JSON-RPC (`eth_call` / `eth_getBalance`) against `https://ethereum-rpc.publicnode.com`. Historical/archive reads are blocked on that endpoint ("Archive requests require a personal token"), which is why no growth *rates* are claimed.

---

## TL;DR

The Sep 1–18 window has **one genuinely excellent, daily, alive, single-tx source** (Nouns), **two round-number milestones that are real and imminent** (beacon deposit contract at 90M ETH / deposit #2,550,000), and **one piece of narrative spice with date risk** (Glamsterdam). The classic "hackathon calendar" hunts — a marquee NFT drop, a famous ENS expiry, a scheduled DAO vote — all came back **empty for this specific window**, and I verified the ENS one on-chain rather than guessing.

The single best find: **Noun #2020 is auctioned Sep 12→13, 2026**, and the whole demo week is covered by Nouns **#2008 (Sep 1) → #2025 (Sep 18)**. One auction ends every day at ~02:29 UTC, each settles in exactly one transaction that emits the winning bid. That is a fresh, legible, uncertain ending every single day of the demo, with a round-number milestone landing mid-week.

---

## Candidate table

| # | Candidate | Date(s) in window | Settlement tx / event | Single-tx? | Fit |
|---|---|---|---|---|---|
| 1 | **Nouns daily auction** (#2008–#2025) | every day, ~02:29 UTC | `AuctionSettled(uint256 indexed nounId, address winner, uint256 amount)` | YES | **5** |
| 2 | **Noun #2020 round-number milestone** | Sep 12 → **Sep 13** | same event, `nounId == 2020` | YES | 4 |
| 3 | **The 2,550,000th beacon deposit** | ~early Sep (rate unmeasured) | `DepositEvent(...)` `index` field | YES | 4 |
| 4 | **Deposit contract crosses 90,000,000 ETH** | imminent — likely **before** Sep 1 | keeper reads `address.balance`, emits | ONLY-VIA-SNAPSHOT | 3 |
| 5 | **Glamsterdam fork activation** (Sepolia in window; mainnet later) | unannounced | new-opcode probe tx returns `status=1` | ONLY-VIA-SNAPSHOT (probe) | 3 |
| 6 | **stETH supply crosses 10,000,000** | unlikely in window | keeper reads `totalSupply()`, emits | ONLY-VIA-SNAPSHOT | 2 |
| 7 | **On-chain DAO proposal resolution** | opportunistic | `ProposalQueued` / `ProposalExecuted` | YES (for PASS only) | 2 |

---

## 1. Nouns daily auction — the spine of the demo week ⭐ fit 5

**Live evidence read this run.** `auction()` on the Nouns Auction House proxy `0x830BD73E4184ceF73443C15111a1DF14e495C706` at block 25,813,753 returned:

```
nounId    = 1999
amount    = 0              (no bids yet at time of read)
startTime = 2026-08-22 02:29 UTC
endTime   = 2026-08-23 02:29 UTC
bidder    = 0x0000...0000
settled   = false
```

An auction is **running right now**. `NounsToken.totalSupply()` = **1974** (lower than the current id because of Nouns Fork burns — expected, not an error).

**The Nounders reward is over.** `NounsToken.mint()` hard-codes `if (_currentNounId <= 1820 && _currentNounId % 10 == 0)` — every-10th-Noun founder mints stopped at Noun 1820. Since then ids increment **exactly 1 per day**, so the projection below is arithmetic, not a guess.

| Noun | Auction ends (UTC) |
|---|---|
| #2000 | 2026-08-24 02:29 |
| #2008 | 2026-09-01 02:29 |
| **#2010** | **2026-09-03 02:29** |
| **#2020** | **2026-09-13 02:29** |
| #2025 | 2026-09-18 02:29 |
| #2026 ("Noun 2026 in 2026") | 2026-09-19 02:29 — *one day past the window* |

**Settlement.** Anyone calls `settleCurrentAndCreateNewAuction()`; that one transaction emits
`AuctionSettled(uint256 indexed nounId, address winner, uint256 amount)`
topic0 = `0xc9f72b276a388619c6d185d146697036241880c36654b1a3ffdad07c24038d99` (computed this run with `cast keccak`).
`nounId` is topic1; `winner` is data word 0; **`amount` (data word 1) is the winning bid in wei** — the answer. The same tx also emits `AuctionCreated` for the next Noun, so one receipt both settles today and opens tomorrow.

**Why it clears every bar.** Legible in four words ("what will it sell for"). Genuinely uncertain — an English auction with a 5-minute anti-snipe extension; not simulatable. Continuous supply forever, no curation. Alive: verified by mainnet read, not by an article.

**The real risk — endogeneity.** A bettor can *be* the bidder. Whoever bets "over 30 ETH" can bid 31 ETH and win both. Cost of manipulation = the marginal bid, which is small in absolute terms. Mitigations: wide over/under bands, cap position size relative to historical clearing prices, or shift the question to something the bidder doesn't control alone (number of distinct bidders, whether the auction goes into extension, last-two-digits of the wei amount). **I did not verify recent clearing prices this run** — do that before setting bands.

---

## 2. Noun #2020 — the mid-week milestone ⭐ fit 4

Same mechanism as #1, but the demo gets a round number on **Sep 13** and a second one on **Sep 3 (#2010)**. Purely a framing win: "the 2,020th Noun, on day 13 of the hackathon." Same settlement, same manipulation caveat.

---

## 3. The 2,550,000th beacon-chain deposit ⭐ fit 4 — the cleanest single-tx milestone here

`get_deposit_count()` on the beacon deposit contract `0x00000000219ab540356cBB839Cbe05303d7705Fa` returned `0x83ce260000000000` this run. That's a **little-endian uint64** → **2,543,235 deposits**. The next round number, 2,550,000, is **6,765 deposits away**.

**Why this is the prettiest settlement in the whole slice:** the deposit contract's `DepositEvent(bytes pubkey, bytes withdrawal_credentials, bytes amount, bytes signature, bytes index)` carries the **running deposit index in the event itself**. So the transaction containing the `DepositEvent` whose decoded `index` equals `2549999` (0-indexed) **is** the proof. No keeper, no aggregation, no snapshot — one receipt, one field, done. `index` is an ABI-encoded `bytes` holding a little-endian uint64; decode accordingly.

**Uncertainty:** which day/hour it lands depends on validator entry demand — future human behavior, not computable. **Manipulation:** a whale could push the counter by depositing, but 6,765 deposits × 32 ETH ≈ 216k ETH of capital to move it meaningfully; front-running the *exact* index is possible for one motivated actor if the market is "who wins the 2,550,000th slot," so keep the question on **which day**, not who.

⚠️ **Open gap:** I could not measure the deposit rate (archive reads blocked), so I cannot date the crossing. Measure `get_deposit_count()` twice, 24h apart, before committing to a date.

---

## 4. Deposit contract crosses 90,000,000 ETH — fit 3, and probably too early

`eth_getBalance(0x00000000219ab540356cBB839Cbe05303d7705Fa)` = `0x4a71435d1eed59162ea086` = **89,995,380.71 ETH**. That is **4,619 ETH** short of ninety million.

This is a beautiful headline ("the ETH staking contract is about to hold 90 million ETH") and the balance is **monotonic** — post-Merge withdrawals are paid by the beacon chain, nothing ever leaves this contract. But 4,619 ETH is roughly 145 deposits; it will very likely cross **days from now, before the demo window opens**. The reusable version is "which day does it cross 91M / 92M."

Note this number is *cumulative lifetime deposits*, not current stake — aggregators put actual staked ETH near 42.1M as of Aug 17, 2026. Do not conflate the two on stage; the gap is exits, re-deposits and 0x02 consolidations.

**Settlement: ONLY-VIA-SNAPSHOT.** No single tx emits the contract's total balance. Needs a keeper contract anyone can poke at/after the deadline that reads `address(DEPOSIT).balance` and emits it. Trivial to write, and it makes a good demo of the snapshot-keeper pattern itself.

---

## 5. Glamsterdam — real spice, real date risk — fit 3

**Status as of this run:** the Ethereum Foundation announced the **Platåberget** testnet on **2026-08-17**, with "the Glamsterdam fork on the testnet scheduled for **20th August**." Sepolia and Hoodi fork after the devnets stabilise; **mainnet has no announced date**, and EIP-7773 (the Glamsterdam meta EIP) still shows activation rows unfilled: "rows in the table above will be filled as activation times are decided by client teams." Secondary reporting is contradictory — some sources say end of August 2026, others Q3, others Q4 — which is itself the tell that no date exists yet. Realistically mainnet is **after** the demo window; **Sepolia inside the window is plausible**, and Sepolia is explicitly allowed by the referee.

**How to make a fork tx-provable — this is the interesting part.** Glamsterdam ships **new EVM opcodes**: `SLOTNUM` (EIP-7843) and backward-compatible `SWAPN`/`DUPN`/`EXCHANGE` (EIP-8024). So deploy a probe contract whose function executes `SLOTNUM` and emits `ForkLive(uint256 slot)`. **Pre-fork that transaction reverts (`status = 0`); post-fork it succeeds (`status = 1`) and emits.** One receipt, decodable status, decodable event — the fork becomes a positive settlement transaction rather than an absence proof. Anyone can poke it; the first successful poke is the answer.

Caveat: this is a **probe**, i.e. the snapshot-keeper pattern applied to consensus state, and the market must be framed positively ("will a `SLOTNUM` probe succeed on Sepolia by date D") with a settlement poke *at* the deadline, not "the fork didn't happen."

---

## 6. stETH crosses 10,000,000 — fit 2

`stETH.totalSupply()` = **9,579,678.13 ETH** this run. Ten million is a famous round number and only ~4.4% away, but that's ~420k ETH of net inflow in under four weeks — unlikely inside Sep 1–18. Good as a longer-dated market, weak as demo-week content. **ONLY-VIA-SNAPSHOT** (keeper reads `totalSupply()`, emits).

---

## 7. On-chain DAO proposal resolution — fit 2, opportunistic only

No major on-chain governance vote is *scheduled* into Sep 1–18; DAO calendars are ad hoc, so this can't be planned into a calendar — but if a Nouns/ENS/Compound proposal happens to be in its voting window during the demo, `ProposalQueued` / `ProposalExecuted` is a clean single-tx PASS proof.

⚠️ **Asymmetry that bites:** a proposal that *fails* emits nothing. "Will it pass?" is half an absence proof. Fix it by asking for the **final FOR tally** and settling with a keeper that reads `governor.proposalVotes(id)` after the deadline and emits it — one tx, positive, and more interesting to bet on anyway.

The one governance item with a verified 2026 footprint is Uniswap's **UNIfication** (passed Dec 2025, ~100M UNI burn, protocol fee switch). Note `UNI.totalSupply()` still reads **exactly 1,000,000,000** this run — UNI has no burn function, so burns are transfers to a dead address and never move `totalSupply`. Any UNI-burn market must watch `Transfer(to = 0x…dEaD)`, not supply. Liveness of the burn cadence in 2026 is **unverified**.

---

## Dead ends — things I hunted and did *not* find

**No marquee ENS expiry in the window — verified on-chain, not assumed.** For a name to hit its 21-day premium Dutch auction during Sep 1–18, it must have *expired* around Jun 3–20, 2026 (90-day grace first). I read `nameExpires()` on the ENS base registrar `0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85` for 21 marquee labels (vitalik, nike, google, apple, casino, crypto, eth, nft, 888, 007, 420, web3, defi, openai, tesla, amazon, poker, bank, money, king, queen). **Every one is renewed past the window.** Nearest expiries: `420.eth` ≈ Feb 2027, `nft.eth`/`king.eth` ≈ Apr 2027, `eth.eth` ≈ Aug 2027. Finding a *sleeper* name expiring in mid-June 2026 needs an indexer (ENS subgraph / ens.vision), which I did not have budget for. The mechanism itself is excellent — `NameRegistered(..., uint256 cost, uint256 expires)` puts the Dutch-auction clearing price directly in one event — so this is worth a dedicated indexer pass, just not a Sep-2026 calendar item today.

**No scheduled Ethereum-mainnet NFT drop or marquee auction for Sep 2026.** NFT drop calendars surfaced nothing mainnet-specific; that activity has largely moved to L2s, which the referee excludes.

**No Glamsterdam mainnet fork date announced** as of 2026-08-22.

**No dated Sep 1–18 mainnet token-unlock cliff** verified. Unlock trackers surfaced nothing Ethereum-mainnet-specific for the window.

**No scheduled major DAO vote** dated into the window.

**Rate data unavailable:** the public RPC blocks archive reads, so deposit-contract growth rate, Nouns recent clearing prices, and `AuctionSettled` history are all **unmeasured this run**. Etherscan's 403 removed the obvious fallback. A builder should run these against an Alchemy/Infura key before locking dates or over/under bands.

**Offchain-only conference anchors** (useful for narrative, not settleable): NFT.NYC Sep 1–3, UN Blockchain Week Sep 10–19 (NYC), CONF3RENCE Sep 15–16 (Dortmund), Korea Blockchain Week Sep 29–Oct 1.

*Unverified this run:* the Merge's 4th anniversary falls on Sep 15, 2026 — attractive demo framing (pair it with a keeper snapshot at the anniversary block), but I did not retrieve a source for the Merge date in this run, so treat it as unconfirmed.

---

## Recommendation for the demo week

Build the demo spine on **Nouns** — it is the only thing in this slice that is alive, daily, legible, uncertain and single-tx-settleable *today*, verified by a live mainnet read rather than an article. Use **Noun #2010 (Sep 3)** and **Noun #2020 (Sep 13)** as the "milestone" beats. Add the **2,550,000th deposit** as the second market to show a different settlement shape (an event field carrying a running counter). Add a **`SLOTNUM` fork probe on Sepolia** as the third, because it demonstrates the snapshot-keeper/probe pattern and turns "did the fork happen" into a positive settlement — even if Sepolia's date slips, the probe contract is the point. Treat the 90M ETH deposit-contract crossing as a headline that will most likely have already happened before Sep 1.

Before locking anything: measure Nouns clearing prices and the deposit rate against a keyed RPC, and design the Nouns market to survive bettors who can also bid.
