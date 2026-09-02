# Liveness verdicts

## Lido daily rebase (stETH accounting-oracle report) — VERIFIED
- source: Direct on-chain eth_getLogs against public Ethereum RPC (eth.drpc.org / ethereum-rpc.publicnode.com), blocks 25,773,828–25,813,827; locally computed keccak-256 topic hash (Transfer control hash matched, proving the implementation); openchain.xyz signature database for selector 0x11a78d23; docs.lido.fi/contracts/lido for stated cadence. (Lido DAO — stETH 0xae7ab96520de3a18e5e111b5eaab095312d7fe84, AccountingOracle 0x852deD011285fe67063a08005c71a85690503Cee (Ethereum mainnet))
- note: VERIFIED end-to-end on-chain, not just by docs.

SIGNATURE: keccak256("TokenRebased(uint256,uint256,uint256,uint256,uint256,uint256,uint256)") = 0xff08c3ef606d198e316ef5b822193c489965899eb4e3c248cea1a4626c3eda50. Every observed log has exactly 2 topics (topic0 + indexed reportTimestamp) and 192 bytes of data = 6 words — matching 1 indexed + 6 non-indexed exactly as claimed. Field ORDER confirmed empirically by decode: word0=86400 (timeElapsed), word1/3 ~7.7e24 (shares), word2/4 ~9.58e24 (ether, larger => rate ~1.242), word5 ~5e19 (~50 shares of fees). Decoder needs no external data. CONFIRMED.

EMITTER: all sampled logs came from txs sent to 0x852deD011285fe67063a08005c71a85690503Cee (Lido AccountingOracle), selector 0x11a78d23 = submitReportData(ReportData,uint256). CONFIRMED.

ONE CORRECTION to the claim's provenance line ("signatures verified from lidofinance/lido-dao master"): TokenRebased itself is unchanged, but the AccountingOracle side has moved on. Live mainnet selector is 0x11a78d23, whose ReportData struct is (uint256,uint256,uint256,uint256,uint256[],uint256[],uint256[],uint256[],uint256,uint256,uint256,uint256[],uint256,bool,bytes32,string,uint256,bytes32,uint256) — Lido V3 shape with added bytes32+string (vaults data tree root/CID) fields. The pre-V3 selectors 0xfc7377cd and 0x4490a12a do NOT match live txs. Harmless for a log-only decoder, but any code that keys on the oracle FUNCTION ABI/selector from an older repo checkout will break.

CADENCE: 6 consecutive daily events, zero gaps, over blocks 25,774,768–25,810,661:
2026-08-17, -18, -19, -20, -21, -22 — all with reportTimestamp pinned to exactly 12:00:11 UTC and timeElapsed exactly 86400 every single time. Very clean daily frame boundary. Docs still say "usually (but not guaranteed) once a day", so the claim's "NEXT TokenRebased after time T" positive-only phrasing remains the right defensive framing, but empirically the cadence is metronomic.

3 RECENT ACTUAL OUTCOMES (daily APR via ((postE/postS)/(preE/preS)-1)*365d/timeElapsed):
1) 2026-08-22 12:00:11Z, block 25810661, tx 0x50c4ee805902fd3bf9fa0dbd4aa0f0c818e35a758cfc86ab4d8b3e29869efe68 — postShareRate 1.242271090726, sharesMintedAsFees 55.77, APR = 2.3785%
2) 2026-08-21 12:00:11Z, block 25803485, tx 0x9cba6988d16e04578207cb1458de17edc71e78778d5066f0640c3567808ef53e — postShareRate 1.242190142783, fees 52.56, APR = 2.2408%
3) 2026-08-20 12:00:11Z, block 25796297, tx 0x004275a4f1a2c0f0dfa931d46e8591ae35eb1a42a0d34d9cb116304e8bbfe809 — postShareRate 1.242113888677, fees 55.63, APR = 2.3806%
(also 08-19: 2.1841%, 08-18: 2.1786%, 08-17: 2.1723%)

MARKET-DESIGN NOTES (important, non-obvious):
(a) 6-day observed band is only 2.1723%–2.3806% (~21 bp wide). A binary strike must sit inside ~2.25–2.30% to be genuinely uncertain; anything at 2.0% or 2.5% resolves deterministically. Consider a scalar/range market or 5 bp buckets instead of a single threshold.
(b) postTotalEther < preTotalEther AND postTotalShares < preTotalShares in EVERY observed report — withdrawal finalization burns shares/ether inside the same report. So you cannot read "did stETH grow" from this event, and naive (postTotalEther/preTotalEther - 1) would resolve NEGATIVE every day. The claim's rate-ratio formula is not just convenient, it is the only correct reading. Use it verbatim.
(c) preShareRate(report N) == postShareRate(report N-1) exactly, even though the raw totals do NOT chain (e.g. 08-21 postTotalEther 9,577,391.87 ETH vs 08-22 preTotalEther 9,581,388.84 ETH, differing from intraday deposits). So the share-rate series is continuous and gap-free — safe for a chained/rolling market.
(d) reportTimestamp is indexed (topic1), so it is available for cheap on-chain filtering/settlement keying without touching data bytes.
(e) Integer-math warning for a Solidity-side decoder: compute as (postE*preS*365d) vs (preE*postS*timeElapsed) cross-multiplied in a scaled fixed-point form; the per-day rate delta is only ~6.5e-5 relative, so naive uint division to fewer than ~12 decimals destroys the signal.
## Nouns daily auction settlement price (AuctionSettled) — DISPUTED
- source: Direct on-chain eth_getLogs via Tenderly public mainnet gateway (gateway.tenderly.co/public/mainnet) and ethereum-rpc.publicnode.com; keccak topic0 recomputed locally with `cast sig-event`; cross-checked against Yahoo Finance "Nouns Is Dead, Long Live Nouns" (2026-04-23) and the nouns.sh live auction tracker, which independently attribute the zero-bid regime to Prop 955 setting a 2.8 ETH reserve price. (Nouns DAO — Nouns Auction House proxy 0x830BD73E4184ceF73443C15111a1DF14e495C706 (Ethereum mainnet; EIP-1967 impl 0xbae451a53c5162d8847490a043dd60baaef44c0b))
- note: EVERY MECHANICAL DETAIL IS CORRECT — BUT THE SIGNAL IS DEAD. Split the verdict:

VERIFIED (structure/plumbing):
- Contract exists and is live. Code present at 0x830BD73E...C706, EIP-1967 proxy → impl 0xbae451a5...4c0b. auction() returns an active auction: nounId 1999, startTime 1787365751 (2026-08-22T02:29:11Z), endTime 1787452151 (+86400s = 2026-08-23T02:29:11Z), settled=false. The 24h auction clock is intact.
- topic0 is exact. Locally recomputed keccak256("AuctionSettled(uint256,address,uint256)") = 0xc9f72b276a388619c6d185d146697036241880c36654b1a3ffdad07c24038d99. Byte-for-byte match.
- ABI layout is exact. nounId in topic1; data = 64 bytes: word0 = winner (address), word1 = amount (uint256). Confirmed by decoding historical events to sane values (Noun 1286 → 2.92 ETH, Noun 1592 → 1.05 ETH, Noun 1822 → 0.44 ETH).
- Event count is exact. Precisely 27 AuctionSettled events in blocks 25,597,769–25,813,769 (216,000 blocks), nounIds 1972→1998, fully contiguous, no gaps. Inter-settlement gaps 7,212–10,343 blocks (median 7,589 ≈ 25.3h) — "roughly daily with drift," since settlement waits for someone to call settleCurrentAndCreateNewAuction after the 24h end. 27-in-30-days is self-consistent with the claim.

DISPUTED (the thing that actually matters for market design): the field the claim calls "the price" has been IDENTICALLY ZERO for the entire window. All 27 events in the stated 30-day range carry winner = 0x0000...0000 and amount = 0. These are no-bid settlements hitting the documented `if (_auction.bidder == address(0)) { nouns.burn(nounId); }` path — the Noun is burned, not sold.

REGIME CHANGE PINPOINTED: I scanned blocks 25,100,000–25,620,000 (70 settlements). Exactly ONE was nonzero: Noun 1918 at 2.8 ETH on 2026-05-29T14:27:59Z. Every settlement since has been 0 ETH — a streak of 80+ consecutive zero-price settlements (56 within that scan window plus all 27 in the claim window, continuous). The last real price, 2.8 ETH, equals the reserve price exactly, which independent reporting confirms: Prop 955 set the auction reserve to 2.8 ETH ("book value"), passed by ~10 voters, and bidding stopped dead.

3 RECENT ACTUAL OUTCOMES (all zero — this IS the outcome):
- Noun 1996 — 2026-08-19T22:35:11Z, block 25,792,177 — 0 ETH, winner 0x0 (burned) — tx 0xc90c725db91f3723a2329c0dadc69ca4dc469ccd78fb5a4a251dbbe39f8cfd6a
- Noun 1997 — 2026-08-20T23:50:11Z, block 25,799,731 — 0 ETH, winner 0x0 (burned) — tx 0x0f72513300b762355721742a8cafc6b7610eab1c0cb77e9e4780edaeb7a9e81f
- Noun 1998 — 2026-08-22T02:29:11Z, block 25,807,698 — 0 ETH, winner 0x0 (burned) — tx 0xe1f7f1c8e44c758909a7e747664dc3970c8e610ebaeb022f303fb5001707509c
- Last nonzero for contrast: Noun 1918 — 2026-05-29T14:27:59Z, block 25,201,618 — 2.8 ETH.

MARKET-DESIGN IMPLICATION: do not use this as a price feed. A market on "tomorrow's Nouns settlement price" resolves to 0 with ~100% probability and has done so for ~85 days; it is a constant, not a variable, and carries no tradeable uncertainty. The event's LIVENESS is genuinely useful (a reliable, near-daily heartbeat with a monotonically incrementing nounId — good for timing/schelling-point or "did settlement happen by block N" mechanics), but its PRICE payload is degenerate. If a price signal is needed, the tradeable uncertainty has migrated to the secondary market (Nouns token 0x9c8ff314c9bc7f6e59a9d9225fb22946427edc03) or to whether a governance proposal lowers the reserve — not to AuctionSettled.amount. Note also the sibling event AuctionCreated (topic0 0xd6eddd1118d71820909c1197aa966dbc15ed6f508554252169cc3d5ccac756ca, data = startTime, endTime) fires in the same tx and is a cleaner heartbeat source if timing is what you want.

Status rationale: "disputed" rather than "verified" because the claim's headline framing — "auction settlement PRICE ... ALIVE and functioning as described" — asserts a live price signal that does not exist; and rather than "overturned" because the contract, topic0, decoding layout, and 27-event cadence are all precisely correct as stated.

Caveats on my own work: block heights and the "as of" anchor line up (head was 25,813,811 when I checked, ~42 blocks past the claim's 25,813,769). Etherscan itself was not fetched directly — I used raw JSON-RPC against the chain, which is a strictly more primary source than a block explorer's rendering, plus two secondary press/tracker sources for the Prop 955 causal explanation. Several public RPCs (llamarpc, ankr, cloudflare, drpc, publicnode-over-urllib, 1rpc, mevblocker, flashbots) refused or throttled eth_getLogs; all log results reported here come from the Tenderly public gateway, so they rest on a single RPC provider — though the counts are internally corroborated by contiguous nounIds with no gaps, and the current-auction state was independently read via publicnode.
## Nouns daily auction — the September 2026 run (#2008 → #2025) — DISPUTED
- source: Primary: direct eth_call / eth_getLogs against Ethereum mainnet via public RPCs (ethereum-rpc.publicnode.com, gateway.tenderly.co/public/mainnet) at head block 25,813,813 / chain time 2026-08-22 22:57 UTC; topic0 recomputed locally with `cast keccak`. Corroborating: Nouns Center protocol docs and nouns.biz contract/event reference (no-bid Nouns are not sold), plus a Nouns auction tracker showing a Ξ0 bid on Noun 1895 in May 2026. Etherscan HTML was 403-blocked to WebFetch, so chain state was read directly instead — a stronger primary source. (Nouns DAO — Nouns Auction House proxy 0x830BD73E4184ceF73443C15111a1DF14e495C706 (impl 0xbae451a53c5162d8847490a043dd60baaef44c0b via EIP-1967 slot), Ethereum mainnet)
- note: MECHANISM: VERIFIED. PAYOUT VARIABLE: BROKEN. CADENCE: OVERSTATED.

What checks out exactly as stated:
- Contract is live. `auction()` on 0x830BD73E4184ceF73443C15111a1DF14e495C706 returns nounId 1999, startTime 1787365751 (2026-08-22 02:29:11 UTC), endTime 1787452151 (2026-08-23 02:29:11 UTC), bidder 0x0, amount 0, settled false. Duration is exactly 86400s. Implementation 0xbae451a53c5162d8847490a043dd60baaef44c0b.
- topic0 recomputed locally: `cast keccak "AuctionSettled(uint256,address,uint256)"` = 0xc9f72b276a388619c6d185d146697036241880c36654b1a3ffdad07c24038d99. Exact match.
- ABI layout as described: nounId = topic1, winner = data word 0, amount = data word 1.
- One tx settles + creates. In the last 25k blocks the auction house emitted exactly 3 AuctionSettled (nounIds 0x7cc/0x7cd/0x7ce) and 3 AuctionCreated (0x7cd/0x7ce/0x7cf) — perfectly paired settle(N)+create(N+1).
- Event fires reliably with no gaps: 27 consecutive AuctionSettled events over the last 30 days, nounIds 1972 (0x7b4) through 1998 (0x7ce), strictly sequential. Nounder-reward ID skips have ended (5-year window closed Aug 2026), so IDs now advance 1:1 per auction.

WHY IT IS DISPUTED — the resolution value is degenerate:
Every single one of those 27 settlements emitted `data` = 64 bytes of zeros, i.e. winner = 0x0000000000000000000000000000000000000000 and amount = 0 wei. There were ZERO AuctionBid events (topic0 0x1159164c56f277e6fc99c11731bd380e0347deb969b75523398734c252706ea3) on the contract in the sampled window. The auction house holds 0 ETH. Nouns token totalSupply is 1974 against a high ID of 1999. Unsold Nouns are being routed to the Nouns DAO treasury/executor 0xb1a32FC9F9D8b2cf86C068Cae13108809547ef71 — confirmed via ownerOf(1996), ownerOf(1997), ownerOf(1998), all three the treasury. Noun 1999's current auction has been open ~20 hours with 0 bids and ~3.5 hours left.

So the event fires, but "amount = winning bid in wei = the answer" resolves to 0 every day. For market design this is fatal: the outcome has no dispersion, zero entropy, and is trivially predictable weeks in advance. A "what will the winning bid be" market on this source is a constant function. Do not use as-is.

CADENCE IS ALSO WRONG. Observed settlement timestamps: Noun 1994 @ 2026-08-17 09:27 UTC, 1995 @ 08-18 12:00, 1996 @ 08-19 22:35, 1997 @ 08-20 23:50, 1998 @ 08-22 02:29. Intervals: 26.5h, 34.6h, 25.3h, 26.7h. Across the full 30-day sample (Noun 1972 @ 2026-07-24 18:55 → Noun 1998 @ 2026-08-22 02:29) that is 26 auctions in 28.3 days = ~26.1h mean, ~0.92 IDs/day. The "~02:29 UTC" figure is just the current cycle's timestamp, not a fixed slot — with no bids there is no economic incentive to settle promptly, so the start time ratchets forward ~2h/day and occasionally slips 10h. This is systematic drift, not the "slight" drift the claim concedes.

ID-TO-DATE MAPPING IS OFF. At the observed ~26.1h cadence from Noun 1999 (Aug 22), #2008 lands ~Sep 1 and #2025 lands ~Sep 19 — so "#2008 → #2025" covers roughly the first two-thirds of September, not the month. A full September run would end near #2035. And because the drift is unbounded (any unsettled auction just sits there), pinning a specific nounId to a specific calendar date 4+ weeks out is not reliable.

RECENT ACTUAL OUTCOMES (all 0 wei):
1. Noun 1998 — settled 2026-08-22 02:29 UTC, block 25807698, tx 0xe1f7f1c8e44c758909a7e747664dc3970c8e610ebaeb022f303fb5001707509c — winner 0x0, amount 0 wei → treasury.
2. Noun 1997 — settled 2026-08-20 23:50 UTC, block 25799731, tx 0x0f72513300b762355721742a8cafc6b7610eab1c0cb77e9e4780edaeb7a9e81f — winner 0x0, amount 0 wei → treasury.
3. Noun 1996 — settled 2026-08-19 22:35 UTC, block 25792177, tx 0xc90c725db91f3723a2329c0dadc69ca4dc469ccd78fb5a4a251dbbe39f8cfd6a — winner 0x0, amount 0 wei → treasury.
(4. Noun 1995 — 2026-08-18 12:00 UTC, block 25781834, tx 0x0f8a18373476459a604ddab73c442cf94c2889ad6e7938e18744e1fabc62b824 — also 0 wei.)

BOTTOM LINE: the plumbing described in the claim is real and correct down to the topic hash and word offsets — an indexer built to this spec will work. But the quantity it resolves on has been identically zero for at least 27 consecutive auctions, and the stated 24h/02:29-UTC cadence is empirically ~26h with a sliding start. If a market needs this source, the only non-degenerate signals available here are binary/timing ones (does ANY bid land, how many hours late is settlement, is the Noun burned-to-treasury), not the bid amount.
