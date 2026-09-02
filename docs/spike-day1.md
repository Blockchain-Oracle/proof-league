# Day-1 spike record (Story 1.2)

Run started: 2026-09-02. Every gate below is a measurement or a named blocker, never an
assumption. Placeholders in planning documents are superseded by the figures here as they land.

## Gate 1 — Funding and provisioning

- Worker accounts generated 2026-09-02 (keys in gitignored `.env.local`, testnet value only):
  - worker1 `0xC8D9da124DCB6759da625461AA96BB74abbEF02b`
  - worker2 `0x66854F3093086BabBFb725cC4f753BF4Da31f6A1`
  - worker3 `0xcc79Ffb5a93a62C4CdD90d8C5016cDFa6134f392`
- Escrow account `0xC1396D0bEF413959A759b3b1b43013CF3f124757` — key written to
  `.env.escrow.offline` for transfer to the owner's password manager; never loaded by services.
  Owner decision 2026-09-02: the file stays local for now — `git check-ignore` confirms the
  `.env.*` rule covers it (testnet value only; the password-manager transfer remains on Abu).
- **FUNDED 2026-09-02 (owner, Discord `/faucet`):** on-chain balances verified via
  `cast balance` against `rpc.cc3-testnet.creditcoin.network` at 19:31 UTC —
  worker1/worker2/worker3/escrow each hold **10,000 CTC**.
- **Research correction (measured beats researched):** the Aug-22 recon recorded the faucet at
  100 CTC/24h (~9 proof queries/day/account). The live faucet dispensed 10,000 CTC per address.
  Funding drops from top schedule risk to routine; the AD-7 budget ledger stays (proof units and
  gas are still metered), but the "9 queries/day" ceiling in planning docs is superseded.
- Fly payment method / Supabase project: deliberately deferred (owner decision 2026-09-02);
  wired when the first slice needs them.

## Gate 2 — hello-bridge attestation wall-clock and recency floor: **MEASURED**

- Read-only bound recorded 2026-09-02 18:21 UTC: latest attested Sepolia height trailed the live
  Sepolia head by 34 blocks (~408 s at 12 s blocks). This is a freshness bound, NOT the FR-12
  wall-clock figure.
- Full measurement run 2026-09-02 19:34–19:43 UTC (`spike/attestation-clock.ts` — marks a fresh
  head block on each source chain, polls CC3 `latestAttested` until it covers that block):

  | chain   | watched block | start lag | wall-clock to coverage | event age at first provability |
  |---------|---------------|-----------|------------------------|--------------------------------|
  | sepolia | 11,621,650    | 40 blocks | 7.0 min                | **7.3 min**                    |
  | mainnet | 25,891,734    | 44 blocks | 8.4 min                | **8.5 min**                    |

- **The FR-12 attestation-lag figure is ~7–9 min** (event age at first provability). This is the
  number product copy and the resolution scheduler build on: a source-chain event becomes provable
  on CC3 roughly 7–9 minutes after it happens. Matches the recon estimate (~8–10 min) from the
  favorable end.
- The ~15 s proof-verification leg is deliberately NOT claimed here — it gets measured when the
  first real verify lands (Story 2.3).

## Gate 3 — Mainnet-Read Gate probe: **OPEN**

Probe: `pnpm --filter @proof-league/worker exec tsx spike/chaininfo-probe.ts`
(SDK `PrecompileChainInfoProvider.getSupportedChains()` against
`https://rpc.cc3-testnet.creditcoin.network`, 2026-09-02T18:21:51Z):

```
chainKey=3 chainId=1        name=0x457468657265756d ("Ethereum")          encoding=1
chainKey=1 chainId=11155111 name=0x5365706f6c696120657468657265756d ("Sepolia ethereum") encoding=1
mainnet latestAttested=25891330 (attestations flowing)
```

- **Verdict: the launch lineup takes the mainnet branch** (both Lido Markets + Pool Races source
  Ethereum mainnet at chainKey 3). Sepolia (chainKey 1) stays the committed fallback and the
  Hosted Round home. chainKeys continue to be resolved at runtime — these numbers are evidence,
  not constants (AD-6).

## Gate 4 — Decode-gas headroom (read-only half complete)

- Today's real Lido report located on mainnet via public RPC:
  - tx `0xf59f8e356dcd7b75b4881df685a1ac6043d6abbd01836fdfa1203c9a6925d493`, block 25889579
  - `TokenRebased` from stETH `0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84`
  - `reportTimestamp = 1788350411 = 2026-09-02T12:00:11Z` — the documented 12:00:11 UTC cadence
    confirmed live; `timeElapsed = 86400` exactly.
- Reference derivation reproduced from raw event fields with 27-decimal fixed point (>= the
  12-decimal FR-13 floor): share-rate delta annualized = **2.1813051 % APR**, inside the
  researched 2.17-2.38 band. Derivation: `(postEther/postShares - preEther/preShares) /
  (preEther/preShares) * (365*86400/timeElapsed) * 100`.
- **PENDING:** on-chain decode-gas measurement through the registered decoder harness (lands
  with the Story 2.3 decoder slice; sets the `scoreBatch` size constant).

## Gate 5 — Privy x Creditcoin signing smoke (Story 1.4)

- **PENDING Privy app creation** (dashboard step, deferred with hosting). The narrow question
  stays: does the embedded wallet sign the EIP-712 Pick without a visible prompt. Fallback
  branch (passkey-first) remains pre-decided.

## Gate 6 — EVM target for Blockscout verification: **paris CONFIRMED**

- Deployed 2026-09-02 19:32 UTC by worker1: `SpikeProbe` at
  `0x8334889B9c068e57078Da3376087ee2b7A7fd42B`, tx
  `0x1d02d14ac040381ac02a6a827fe60e516fe897cd27e3fc2ea6f96a4c9bff89e0`.
- `forge verify-contract` against `creditcoin-testnet.blockscout.com` with the pinned profile
  (solc 0.8.28, `evm_version = paris`, optimizer 200): **"Pass - Verified"**. The provisional
  pin in `foundry.toml` is now confirmed evidence (comment updated same-day).
- Client quirk worth knowing before the worker ships: CC3's RPC omits `mixHash` from block
  JSON; alloy (forge's provider) logs deserialization errors while still succeeding. ethers v6
  (the worker's RPC lib) tolerated all reads in this spike, but treat block-shape strictness as
  a known hazard when adding new client code.

## Toolchain confirmation (kickoff re-check, supersedes stale planning pins)

- Node 24.19.0 (`.nvmrc`), pnpm 11.24.0, solc **0.8.28 exact** (foundry.toml).
- Foundry **1.7.1** confirmed as the kickoff toolchain (planning pin 1.2.3 was
  "re-confirm at kickoff"; solc exactness is the on-chain invariant and is pinned separately).
- Dependency sweep 2026-09-02 (plan §7): Next 16.3.4, Tailwind 4.3.x, viem 2.56.x, Privy 3.39.x
  (`verifyAccessToken` via `@privy-io/node`), Drizzle 0.45.x exact, AI SDK v7 Output API,
  OZ 5.1.0 exact, usc-contracts 0.2.0 / usc-sdk 0.18.0 (both registry-latest).
