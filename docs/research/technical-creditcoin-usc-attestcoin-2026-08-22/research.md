---
title: 'technical research: Creditcoin USC Attestcoin'
type: 'technical'
topic: 'Creditcoin USC Attestcoin'
decision: "Verify the technical foundation Proof League's architecture rests on: USC/Attestcoin capabilities, proof latency, SDK maturity"
source: 'native run (web fan-out, 3 dimensions × 2 rounds + 6 blind verifications + adversarial red-team pass)'
status: complete
preset: 'standard'
validation: 'high'
created: '2026-08-22'
updated: '2026-08-22'
---

# technical research: Creditcoin USC Attestcoin

**Decision this research serves:** Verify the technical foundation Proof League's architecture rests on: USC/Attestcoin capabilities, proof latency, SDK maturity.

## Executive summary

**The evidence says: build it — the core Proof League loop (prove an Ethereum transaction, decode its event values on Creditcoin, settle a prediction) is supported by shipped, documented, CI-tested infrastructure today.** Three findings drive that answer:

1. **Receipt and event data are provable and decodable.** The proven payload is "transaction + receipt data" [6]; Gluwa's own `EvmV1Decoder.sol` decodes receipt status, `gasUsed`, and full event logs (`address`, `topics`, `data`) plus transaction-level `from/to/value/calldata` contract-side [12]. Settling a market on an emitted event value (e.g. an auction's final price) is exactly the documented pattern.
2. **Latency is ~9–12 minutes end-to-end, dominated by attestation.** ~8–10 min for a recent Ethereum/Sepolia block to be attested (verified verbatim in the official tutorial, corroborated by shipped code that expects ~8 min with a 20-min ceiling) [8][25], proof generation seconds-to-minutes, then synchronous verification inside one ~15 s Creditcoin transaction [10][13]. Live-tick markets are out; settlement-event markets are comfortably in. UI must carry an explicit "awaiting attestation" state.
3. **The constraint that will actually bite is operational, not cryptographic:** the testnet faucet is Discord-only at 100 CTC/24h ≈ **9 oracle queries per day per account** (testnet oracle fees are deliberately inflated) [8][17], the naming is mid-rebrand (USC → Attestcoin → also "CCNext"), docs and repos drift, and the SDK is pre-1.0 with unpublished commits ahead of the npm release [15][26].

**Biggest caveat:** no team-independent production usage exists — external traction on the builder repos is ~1 GitHub star total [17], and one of the two official example repos is a stale upstream with obsolete latency guidance [9]. The happy path is real but narrow; step off it and you are the first person there.

## Dimension: landscape & terminology

Creditcoin (Gluwa) is an EVM-compatible Substrate L1 (Solidity deploys as-is; Hardhat/Remix/ethers guides exist) [27]. The cross-chain verification layer has three concurrent names: **Universal Smart Contracts (USC)**, its official rebrand **Attestcoin Protocol** ("formerly called USC" [1], confirmed by the docs' own SDK page: "The term USC was replaced with the term Attestcoin Protocol. But repository names and other resources have yet to be updated" [5]), and **CCNext** in some repo descriptions [24]. Verifier outcome: the rebrand claim is VERIFIED; treat all three names as one technology when searching, and expect dead `docs.creditcoin.org/usc/*` and `/creditcoin-usc/*` links — the live tree is `/attestcoin-protocol/*` [28]. Do not expect an `@gluwa/attestcoin-*` package; tooling still ships as `usc-*`.

Status: **readability** (Creditcoin contracts reading/verifying source-chain transactions) is live — on testnet since 2025-09-09 [22] and on mainnet since ~2026-06-18 (multi-source: blog post [2], runtime release notes "3.125/Launched USC protocol layer" [7], and the hackathon AMA; one blind verifier could not locate the June 2026 blog post via search and overturned that claim's sub-details, so the launch *date* carries medium confidence while the *live-on-mainnet fact* is corroborated three ways). **Writability is NOT shipped anywhere** — "undergoing 3rd party testing and audits", not even on testnet [7] — and is explicitly out of hackathon scope. Design nothing that requires Creditcoin to cause an action on Ethereum.

Source chains are **Ethereum only**: CC3 Testnet reads Sepolia (chainKey 1) and **Ethereum mainnet (chainKey 3)** [6][7]; CC3 Mainnet reads Ethereum mainnet (chainKey 1). The testnet-reads-mainnet path means a demo can prove *real* Ethereum mainnet events while paying testnet gas. `chainKey` is a Creditcoin-internal identifier, explicitly NOT the EVM chainId, and differs per environment for the same chain — resolve it at runtime via the ChainInfo precompile (`0x…0fd3`), never hardcode [7][14].

Chain facts: testnet chainId **102031**, RPC `rpc.cc3-testnet.creditcoin.network`, explorer `creditcoin-testnet.blockscout.com` (found by probing, verified by chainId match; absent from all official docs) [20][21]. Block time ~15 s (spec table [7], empirically confirmed via Blockscout stats [20]), finality 1–3 blocks, 75M block gas limit, base gas 0.5 gwei [7].

## Dimension: proof pipeline & latency (claim verification)

The thoughts.md claims this run set out to verify, with outcomes:

| Claim | Outcome | Evidence |
|---|---|---|
| (a) Fresh Ethereum/Sepolia block takes ~8–10 min to attest | **VERIFIED verbatim** (blind verifier pulled the repo tarball; shipped code expects ~8 min, hard-codes a 20-min ceiling) | [8][25] |
| (b) Verification ≈ one Creditcoin block (~15 s) | **VERIFIED, with correction**: verification is *synchronous inside* the submitting transaction via the `0x0FD2` precompile — 15 s is just tx inclusion | [10][13] |
| (c) Provable fields: sender, target, value, calldata, status, gas, event logs+values | **VERIFIED** — round 2 read `EvmV1Decoder.sol` directly: `receiptStatus`, `receiptGasUsed`, `receiptLogs[]{address,topics,data}`, `logsBloom`, plus tx `from/to/value/nonce/gasLimit/data`. Caveat: `from` is pre-extracted from the attested payload, not ecrecover'd on-chain — attestation-trusted | [12] |
| (d) Native verifier proves only inclusion; app contract must validate status/address/event itself | **VERIFIED** — "does not validate if a transaction was successful… MUST check the status field (0x1)" | [3][4] |
| (e1) Cannot prove absence of a transaction | **Supported by strong negative evidence**: both verifier interfaces read in full, `ProofKind` has a single variant `BinaryMerkle`, no absence primitive anywhere. Model "X did not happen" as a Creditcoin-side deadline/timeout, never a proof | [11][13] |
| (e2) Cannot aggregate many transactions | **REFUTED as stated**: SDK batches ≤10 proofs/1000 blocks as *client convenience*; on-chain you may loop `verifyAndEmit` over N transactions in one Creditcoin tx, bounded only by gas | [5][11] |

Pipeline shape: attestors reach consensus on Ethereum history (aggregated off-chain via P2P gossip) → an off-chain proof-builder service caches attested heights and generates Merkle (tx-in-block) + continuity (block-to-attestation) proofs → your contract calls `INativeQueryVerifier.verifyAndEmit(chainKey, height, encodedTransaction, merkleProof, continuityProof)` at `0x0FD2` → decodes the returned-true blob with `EvmV1Decoder` and applies its own checks [3][11][12].

**The settlement contract's mandatory checklist** (each item is an exploit if skipped): tx status == 0x1; log emitted by the approved contract address; correct event signature (first topic); correct subject id in the event; tx hash not already consumed (replay guard); market was open when the source tx landed.

Latency budget (synthesis, medium confidence): ~8–10 min attestation + proof build + one ~15 s Creditcoin tx ≈ **9–12 min** from Ethereum event to settled market [8][10][25]. The 16–30 min figure circulating in `ccnext-testnet-bridge-examples` is stale-upstream documentation — that repo is the abandoned parent of the current fork, and the blind verifier corrected our own round-1 framing: the two numbers describe different phases, and the "STARK-era" attribution is unsubstantiated [9].

## Dimension: builder reality

**The happy path is CI-tested.** `gluwa/usc-testnet-bridge-examples` ships four ordered tutorials (hello-bridge → custom contracts → off-chain worker → loan flow), each exercised by its own GitHub Actions workflow — the strongest DX signal found [8][23]. Prerequisites are narrow: yarn, Foundry pinned v1.2.3. Pre-deployed Sepolia/CC3 contracts exist for hello-bridge; the flow is `cast send` a Sepolia tx → `yarn hello_bridge:submit_query <tx_hash>` → poll every 15 s until attested → proof → submit (~420k gas observed) [8].

**Consumable building blocks:** `@gluwa/usc-sdk` 0.18.0 on npm (TS: ProofBuilder, PrecompileBlockProver, QueryBuilder; ethers v6) [15][26] — blind-verified against npm + GitHub (correction: 33 GitHub releases, not 30; npm carries only 11 of them). **`@gluwa/usc-contracts` 0.2.0 (npm, 2026-08-17)** ships `EvmV1Decoder.sol` as a Foundry-consumable dependency, pinned to OpenZeppelin 5.1.0 [16]. `USC-Builder-Examples` contains the full loan-recording use case incl. `USCProofVerifier.sol` — blind-verified file-by-file, 9/9 present and compiling as a coherent unit [17].

**The four real frictions:**
1. **Faucet rationing** — Discord-only `/faucet`, 100 CTC/24h ≈ 9 oracle queries/day ("testnet oracle fees are artificially high to prevent DOS") [8]. The advertised HTTP faucet host has no service behind it (probed; open issue #36) [17]. Plan multiple funded accounts from day one.
2. **Prove promptly** — verification cost rises >10× for transactions proven ~24 h after finality (attestation checkpoints thin to 1-per-1000-blocks) [18]. The worker should prove as soon as attestation lands.
3. **Docs/naming drift** — dead links inside official READMEs, stale `networks.json` (no cc3-testnet entry, conflicting chainKeys), two hostnames for the proof-builder service, `USC-Builder-Examples` deploying against a legacy network with `--chainkey 102033` [14][17][19]. Treat the Solidity source and the environments docs page as authoritative; re-derive chainKey at runtime.
4. **Pre-1.0 churn + unreviewed examples** — SDK repo is ~2 months ahead of the npm release [26]; example contracts carry four open, unanswered security issues (queryId replay, arbitrary-prover trust, unbounded-loop DoS) [17]. Do not copy them blind — fixing exactly those classes in our settlement contract is both necessary and demo-able.

External traction is near zero (~1 star across all USC builder repos [17]) — but not literally zero: the Spring 2026 hackathon winner **HashCredit** shipped a real USC readability dApp (BTC mining payouts → credit lines), the single best third-party reference implementation [see domain report].

## Cross-dimension insights

- **Testnet-proves-mainnet (chainKey 3) + receipt-level event decoding** combine into a demo unlock no isolated dimension shows: a hackathon build could settle predictions against *real Ethereum mainnet events* (a live Nouns auction, a real protocol settlement) with zero mainnet spend. *Red-team-gated: confirm chainKey 3 live via the ChainInfo precompile before depending on it; Sepolia is the committed path.*
- **The latency constraint and the faucet constraint point at the same architecture:** an off-chain settlement worker (tutorial 3's pattern) that batches, waits out attestation, proves promptly (cost cliff), and spends the rationed CTC deliberately — settlement as a background process the UI narrates, not a click the user waits on.
- **The naming fragmentation is a judge-facing hazard**: a submission that says "Attestcoin" where the AMA says "Attestcoin" and cites the current docs tree signals depth; one that copy-pastes dead `/usc/` links signals a tutorial fork.

## Contrary evidence (red-team pass)

A fresh-context skeptic (no access to this run's evidence) attacked the feasibility conclusion. **Verdict: survives with caveats.** Two attacks failed outright — the skeptic independently re-derived from the `@gluwa/usc-contracts` 0.2.0 tarball that receipts (status, gasUsed, logs, logsBloom) are genuinely in the proven payload for tx types 0–4 including blob and 7702 transactions, and that the `0x0FD2` precompile surface is exactly as described — independent confirmation that *strengthens* [12][11]. Live probes found the proof-builder (HTTP 200, Swagger UI) and RPC (chainId 102031) healthy, and no outage reports, Discord complaints, or rate-limit evidence anywhere [21].

**What it surfaced that this report must carry:**

1. **Funding is the top schedule risk, not the cryptography.** The HTTP faucet host has no backend (25 days unanswered on issue #36); the only route is a Discord slash command behind phone-verification; there is no zero-gas path. If Discord funding fails, the build dies on logistics. *Fund 2–3 accounts on day 1, before any architecture is frozen.* (Caveat the skeptic itself flagged: issue #36 self-discloses as filed by an AI agent preparing a Fall entry, so it is not independent third-party corroboration — but its probe measurements are reproducible and the maintainer silence is independent evidence.) [17]
2. **`@gluwa/usc-contracts` 0.1.2→0.2.0 (2026-08-17) is a breaking release**, verified by tarball diff: `contracts/decoding/` no longer exists — `EvmV1Decoder.sol` moved to `contracts/write-ability/common/`; `Simple{Inbox,Outbox,OutboxFactory}` renamed. Pre-Aug-17 tutorials fail to compile. **Footgun:** 0.2.0 ships two files named `INativeQueryVerifier.sol`; only `write-ability/common/INativeQueryVerifier.sol` declares `verifyAndEmit`. [16]
3. **Decode-side ceilings are real:** July 2026 SDK commits enforce failure when decode gas crosses 70% of block gas limit, add per-transaction gas limits, and document a specific oversized transaction that does not fit; a separate commit skips "super new" source blocks (recency floor, magnitude unstated). *Choose demo transactions with few logs and modest calldata; don't prove seconds-old blocks.* [26]
4. **Assume zero upstream support:** 25 open issues on the examples repo, the four May-2026 security issues at zero comments after ~3 months, no maintainer activity found in any thread; the machine-readable network registry points at hosts that no longer resolve. [17][14]

**Two disputes weighed (skeptic vs. this run's verifiers):**
- *"The ~8–10 min attestation figure has no retrievable source."* Rejected as stated: this run's blind verifier pulled the current fork's repo tarball and found the figure verbatim at `hello-bridge/README.md:192`, corroborated by shipped code expecting ~8 min with a 20-min ceiling ([8][25]); the same README carries the 100 CTC / ~9-queries faucet numbers the skeptic also couldn't locate. The skeptic's underlying point survives in weakened form: the figure is *documentation from the tutorial repo, not a measurement*, and post-dates an architecture migration — so it stays medium-confidence until measured on day 1.
- *"Ethereum mainnet as a CC3-testnet source chain (chainKey 3) is unsubstantiated."* Downgraded, not dropped: two independent researchers cited the current official docs (environments table and llms-full.txt) for Sepolia=1 / mainnet=3 on CC3 Testnet [6][7], while the skeptic found only the stale 2026-04 registry. Docs beat dead registry — but the disagreement itself means: **verify live via the ChainInfo precompile (`getSupportedChains`) before any demo depends on mainnet reads; treat Sepolia as the committed path and mainnet-reads as a verified-stretch goal.**

## Recommendations (downstream bindings)

1. **Architecture spine:** three components — Ethereum source event (existing mainnet contract via chainKey 3, or our own Sepolia contract), an off-chain worker (watch → wait for attestation → fetch proof from hosted proof-builder → submit), and one Creditcoin settlement contract (verifyAndEmit → EvmV1Decoder → the six-item validation checklist → settle). Basis: high-confidence, primary-source code [11][12][8].
2. **Product constraint into PRD/UX:** settlement latency is a *feature surface* — "awaiting Ethereum attestation → proof verified, block N, view on Blockscout" is the product's hero moment, not a spinner. Basis: verified latency figures [8][10].
3. **Day-1 spike, in priority order (de-risk):** (a) obtain Discord faucet CTC for 2–3 accounts — the red-team's #1 schedule risk, no fallback exists; (b) run hello-bridge end-to-end and *measure* real attestation lag (supersedes the documented 8–10 min); (c) query the ChainInfo precompile live to confirm supported chainKeys — commit to Sepolia, treat mainnet-reads as verified-stretch; (d) decode one representative tx and check gas headroom. Basis: red-team repricing; medium-confidence latency synthesis.
4. **Dependency policy:** consume `@gluwa/usc-contracts` 0.2.0 + `@gluwa/usc-sdk` 0.18.0, pinned exactly; OZ 5.1.0; Foundry v1.2.3. Import `EvmV1Decoder` and `INativeQueryVerifier` from `contracts/write-ability/common/` — 0.2.0 moved the decoder there and ships a second, incomplete `INativeQueryVerifier.sol` elsewhere. Keep demo transactions small (few logs, modest calldata — decode gas ceilings are enforced). Fix the example repo's known vulnerability classes (replay, prover trust) in our contract and say so in the Attestcoin integration summary. Assume zero upstream support. Basis: high-confidence, tarball-diffed [16][17][26].
5. **Never promise:** absence proofs, sub-minute settlement, non-Ethereum source chains, or writability. Basis: high-confidence negative evidence [11][13][7].

## Open questions

- Real-world attestation wall-clock on cc3-testnet *this week* (docs say ~8–10 min; only empirical measurement settles it) → first-48h spike.
- Gas/fee for `verifyAndEmit` with a large receipt (many logs) — no benchmark exists; measure during the spike.
- Whether the hosted proof-builder rate-limits or requires auth under load → observe during spike; fallback is `RawProofBuilder` (local computation, same interface) [26].
- Who computes the pre-extracted `from` address and under what trust assumption (attestor-asserted vs protocol-derived) — matters only if settlement logic keys on tx sender; prefer keying on event contents [12].

## Source appendix

| [n] | Supports | Publisher | Pub | Accessed | Conf |
|---|---|---|---|---|---|
| [1] | Attestcoin = USC rebrand | [Creditcoin docs — attestcoin-protocol.md](https://docs.creditcoin.org/attestcoin-protocol.md) | — | 2026-08-22 | high |
| [2] | USC readability live on mainnet | [Creditcoin blog — USC live on mainnet](https://creditcoin.org/blog/universal-smart-contracts-are-live-on-creditcoin-mainnet/) | 2026-06-18 | 2026-08-22 | med |
| [3] | Pipeline architecture; inclusion-only precompile | [Creditcoin docs — architecture.md](https://docs.creditcoin.org/attestcoin-protocol/architecture.md) | — | 2026-08-22 | high |
| [4] | MUST check status 0x1 | [Creditcoin docs — attestcoin-smart-contracts.md](https://docs.creditcoin.org/attestcoin-protocol/dapp-builder-infrastructure/attestcoin-smart-contracts.md) | — | 2026-08-22 | high |
| [5] | SDK surface; batch limits; USC→Attestcoin naming | [Creditcoin docs — attestcoin-sdk-usc-sdk.md](https://docs.creditcoin.org/attestcoin-protocol/dapp-builder-infrastructure/attestcoin-sdk-usc-sdk.md) | — | 2026-08-22 | high |
| [6] | Chains/environments; payload = tx + receipt | [Creditcoin docs — chains & environments](https://docs.creditcoin.org/attestcoin-protocol/attestcoin-protocol-chains-environments.md) | — | 2026-08-22 | high |
| [7] | Chain spec; chainKey registry; writability unshipped | [Creditcoin docs — llms-full.txt](https://docs.creditcoin.org/llms-full.txt) | — | 2026-08-22 | high |
| [8] | 8–10 min attestation; faucet; dev flow; gas sample | [Gluwa — usc-testnet-bridge-examples hello-bridge README](https://raw.githubusercontent.com/gluwa/usc-testnet-bridge-examples/main/hello-bridge/README.md) | — | 2026-08-22 | high |
| [9] | Stale 16–30 min guidance (superseded upstream) | [Gluwa — ccnext-testnet-bridge-examples README](https://raw.githubusercontent.com/gluwa/ccnext-testnet-bridge-examples/main/hello-bridge/README.md) | — | 2026-08-22 | high |
| [10] | One-block (~15 s) verification | [Creditcoin blog — next-gen USC](https://creditcoin.org/blog/the-next-generation-universal-smart-contracts-are-coming/) | 2025-12-19 | 2026-08-22 | high |
| [11] | verifyAndEmit interface; hasPrecompile chain IDs | [Gluwa — INativeQueryVerifier.sol](https://raw.githubusercontent.com/gluwa/USC-Builder-Examples/main/contracts/abstract/INativeQueryVerifier.sol) | — | 2026-08-22 | high |
| [12] | Decodable receipt/log/tx fields | [Gluwa — EvmV1Decoder.sol](https://raw.githubusercontent.com/gluwa/USC-Builder-Examples/main/contracts/UseCases/SourceDestinationLoanRecording/EvmV1Decoder.sol) | — | 2026-08-22 | high |
| [13] | ProofKind=BinaryMerkle; no absence primitive | [Gluwa — BlockProverTypes.sol / QueryProofVerificationLib.sol](https://raw.githubusercontent.com/gluwa/USC-Builder-Examples/main/contracts/abstract/BlockProverTypes.sol) | — | 2026-08-22 | high |
| [14] | Per-environment chainKeys; stale config | [Gluwa — creditcoin-usc-networks networks.json](https://raw.githubusercontent.com/gluwa/creditcoin-usc-networks/master/networks.json) | 2026-04-23 | 2026-08-22 | high |
| [15] | @gluwa/usc-sdk 0.18.0 | [npm registry — @gluwa/usc-sdk](https://registry.npmjs.org/@gluwa/usc-sdk) | 2026-06-22 | 2026-08-22 | high |
| [16] | @gluwa/usc-contracts 0.2.0 (EvmV1Decoder as dependency) | [npm registry — @gluwa/usc-contracts](https://registry.npmjs.org/@gluwa/usc-contracts) | 2026-08-17 | 2026-08-22 | high |
| [17] | Security issues #30–33; faucet issue #36; traction; loan example verified | [Gluwa — USC-Builder-Examples repo/issues/tree](https://github.com/gluwa/USC-Builder-Examples) | 2026-08-05 | 2026-08-22 | high |
| [18] | 10× cost cliff for late proving | [Creditcoin docs — gas-costs.md](https://docs.creditcoin.org/attestcoin-protocol/attestcoin-readability/gas-costs.md) | — | 2026-08-22 | high |
| [19] | Testnet chainId/RPC | [Creditcoin docs — environments/testnet](https://docs.creditcoin.org/environments/testnet) | — | 2026-08-22 | high |
| [20] | Explorer verified; ~15 s empirical block time | [Blockscout — creditcoin-testnet API](https://creditcoin-testnet.blockscout.com/api/v2/stats) | 2026-08-22 | 2026-08-22 | high |
| [21] | eth_chainId 102031 | [Creditcoin testnet RPC](https://rpc.cc3-testnet.creditcoin.network) | 2026-08-22 | 2026-08-22 | high |
| [22] | USC testnet launch | [Creditcoin blog — universal-smart-contracts](https://creditcoin.org/blog/universal-smart-contracts/) | 2025-09-09 | 2026-08-22 | high |
| [23] | Four guided tutorials, CI-tested | [Creditcoin docs — guided-tutorials.md](https://docs.creditcoin.org/attestcoin-protocol/guided-tutorials.md) | — | 2026-08-22 | high |
| [24] | Repo inventory; CCNext naming | [GitHub — gluwa org repositories](https://github.com/orgs/gluwa/repositories?q=usc&sort=updated) | 2026-08-22 | 2026-08-22 | high |
| [25] | Code corroboration: ~8 min expected, 20-min ceiling | [Gluwa — usc-testnet-bridge-examples utils/index.ts](https://github.com/gluwa/usc-testnet-bridge-examples) | — | 2026-08-22 | high |
| [26] | SDK repo 2 months ahead of npm; RawProofBuilder | [Gluwa — cc-next-query-builder](https://github.com/gluwa/cc-next-query-builder) | 2026-08-20 | 2026-08-22 | high |
| [27] | EVM compatibility | [Creditcoin docs — evm-compatibility.md](https://docs.creditcoin.org/evm-compatibility.md) | — | 2026-08-22 | high |
| [28] | Docs tree migration, dead /usc/ paths | [Creditcoin docs — sitemap.md](https://docs.creditcoin.org/sitemap.md) | — | 2026-08-22 | high |

## Staleness map

Fastest-aging claims (technical pack bars: versions/compatibility ≤1 mo, ecosystem ≤6 mo): **@gluwa/usc-contracts 0.2.0** (published 5 days ago — re-check on every `npm i` through Sep 6), **@gluwa/usc-sdk 0.18.0 vs repo HEAD** (re-check ~2026-09-22, sooner if the tutorial breaks), **faucet/proof-builder availability** (operational, not documentary — re-verify at spike time and again before judging), **testnet runtime releases** (runtime migrations shipped twice this summer; watch gluwa/creditcoin3 releases weekly through Sep 6). Earliest re-check: **the 48-hour empirical spike is itself the refresh** — treat measured values as superseding documented ones.
