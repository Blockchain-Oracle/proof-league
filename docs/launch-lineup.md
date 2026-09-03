# Launch lineup — Series admission checklists (Story 5.1, FR-6)

Every Market that goes live is minted by the on-chain Market Engine from a registered
Series template (AD-21). The admission checklist is therefore written once per
**template**, not per Market: the template's rules bind every instance the engine mints,
and `pnpm rebuild` re-derives each instance's parameters from the template plus
chain-resident observations, so a Market that violated its template could not exist
without the rebuild diff going red.

Registered on Creditcoin 3 testnet against `LeagueCore`
`0xFe8C5438781f8c8392a49e20502920Ba41027493` (gateway `0x4549fbd1..40ec`).

---

## Series 1 — Lido daily rate-ratio APR

| Field | Value |
|---|---|
| Source | Ethereum mainnet (`sourceChainKey` 3, Mainnet-Read-Gate verdict OPEN, Story 1.2) |
| Emitter | stETH `0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84` |
| Event | `TokenRebased(uint256,uint256,uint256,uint256,uint256,uint256,uint256)` |
| Subject filter | none (zero) — the indexed subject is the report timestamp, which changes daily |
| Decoder | `decoderId` 1, `LidoRateRatioDecoder` (annualized share-rate ratio, 1e18 scale) |
| Cadence | daily; `sourceWindowOpen` 12:00:00 UTC, lock 11:00 UTC, void deadline +24 h |
| First slot | 2026-09-04T12:00:00Z |
| Options | 5 (4 boundaries), anchored to the previous day's decoded value |

### Rule 1 — Genuine uncertainty

The answer is the annualized share-rate ratio of Lido's next daily oracle report. It is
produced by the oracle quorum from beacon-chain rewards accrued after Lock Time, so at
lock it is not computable or simulable from on-chain state by anyone, including us. The
measured band below shows it genuinely moves day to day.

### Rule 2 — Manipulation-priced

Moving the reported APR by even one basis point requires changing the aggregate
consensus-layer rewards of Lido's whole validator set inside one report window, or
compromising the oracle quorum. Both cost orders of magnitude more than any winnings,
which are free points with no monetary value at all. The market is not forceable at any
plausible price.

### Rule 3 — Determinism horizon

Lock Time is 11:00 UTC, one hour before the source window opens at 12:00:00 UTC and
about one hour before the report lands at 12:00:11 UTC. The outcome starts becoming
computable only when the oracle report is assembled, which is after lock.
`determinismHorizon` equals the source window open, and the chain refuses any config
whose lock is not strictly before it, so this rule is structural rather than procedural.

### Rule 4 — Positive settlement only

The Market settles on an event that happens: the `TokenRebased` log. No absence
predicate is representable, because settlement is only ever driven by a proof of a real
log; if the report never lands, the Market voids on its deadline and stakes return.

### Rule 5 — Framing locks are binding

The question is "what will the reported APR be", which is a value bucket, never a
"who" or a "will X not happen". The event-catalog research's dead-end list is respected:
this is a first-class emitted value with a verified decoder, not a derived or absent
quantity. Naive total-ether growth is explicitly not used — withdrawal finalization
burns shares and ether inside every observed report, which makes that reading resolve
negative daily. The share-rate ratio is the only correct derivation (research note (b)).

### Decode feasibility (checked once per template)

The decoder is registered on the live gateway as id 1, and its derivation was
re-verified independently against 12 consecutive real reports on 2026-09-03 (script:
`apps/worker/spike/lido-band.ts`). The 2026-08-22 report decodes to **2.3785%**, matching
the blind-verified reference figure in `docs/spike-day1.md` to four decimal places, from
a separate implementation. Decode feasibility is therefore demonstrated, not assumed.

### Measured band (the pre-launch re-sample)

Twelve consecutive daily reports read from mainnet on 2026-09-03:

| Date (UTC) | APR | Date (UTC) | APR |
|---|---:|---|---:|
| 2026-08-21 | 2.2408% | 2026-08-28 | 2.2202% |
| 2026-08-22 | 2.3785% | 2026-08-29 | 2.2089% |
| 2026-08-23 | 2.2139% | 2026-08-31 | 2.2640% |
| 2026-08-24 | 2.2840% | 2026-09-01 | 2.2112% |
| 2026-08-25 | 2.2591% | 2026-09-02 | 2.1813% |
| 2026-08-26 | 2.2002% | | |
| 2026-08-27 | 2.1936% | | |

Distribution: min 2.1813, p20 2.2002, p40 2.2112, p60 2.2408, p80 2.2640, max 2.3785.

**Boundaries are anchored, not static.** Each instance's boundaries are the previous
in-window resolved instance's decoded value plus fixed offsets, computed on-chain by the
engine. This is what keeps "no option is a foregone conclusion" true even as the APR
drifts: the band re-centres itself every day on the last observed value, so a slow trend
cannot park the answer permanently in one bucket.

Offsets are `[-0.050, -0.015, +0.015, +0.050]` percentage points
(`[-5e14, -1.5e14, +1.5e14, +5e14]` on the 1e18 scale). Against the eleven observed
day-over-day changes those five buckets take 3 / 2 / 2 / 1 / 3 of the sample, so every
option is reachable and none is close to certain. The offsets are deliberately symmetric:
an asymmetric band fitted to the recent downward drift would encode a directional
prediction of our own, which is not our job.

Base boundaries `[2.200%, 2.215%, 2.235%, 2.260%]` apply only to the first instance,
which has no prior observation to anchor on. They are the observed quintile cuts, which
split the twelve samples 2 / 3 / 2 / 2 / 3.

### Named constraint — 16 instances

Every instance shares one `sourceKey`, because the subject filter is zero (the daily
report timestamp cannot be fixed at registration). `MAX_MARKETS_PER_SOURCE_KEY` is 16, so
this template mints at most 16 Markets in its lifetime: 2026-09-04 through 2026-09-19,
which covers the whole judging window with a day to spare. The 17th slot would be
refused at admission by name (`SourceKeyFull`), the market-supply probe would alert, and
the remedy is registering a successor template against a fresh deployment. This is a
known limit with a known date, written down rather than discovered later.

### Liveness note

`preCreateLeadSec` is 6 hours, not days. Anchored Series trade pre-creation for boundary
freshness by design (AD-21): a slot is minted only once its observation window is
terminal, so a stuck previous day delays the next mint rather than minting stale
boundaries. If a day is ever missed entirely, the engine skips that dead slot and
continues, since void makes every stalled Market terminal on its deadline.
