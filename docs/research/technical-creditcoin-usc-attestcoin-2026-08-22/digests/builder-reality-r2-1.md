# Digest: builder-reality (round 2)

**Summary:** Yes, someone has shipped on USC — and won. The completed Feb–Mar 2026 BUIDL CTC edition had 76 BUIDLs / 189 hackers and exactly three winners, one of which (HashCredit, github.com/inchyangv/ctc-hashcredit) is explicitly USC-based: it proves Bitcoin mining-pool payouts with SPV and converts them into a USDT credit line on Creditcoin EVM. A second winner, SnowBall, mentions USC 4 times. But adoption was otherwise near-zero: only 1 of the 24 page-1 gallery cards mentioned USC at all, and the rest are conventional EVM lending/ROSCA/RWA dApps, one of which advertised the legacy testnet RPC and chain ID 102030. The current Fall edition (submissions 2026/08/13 → 2026/09/06, 115 hackers, 14 days left) has zero public submissions as of today and now carries "Attestcoin Protocol" as an explicit platform-technology tag — the sponsor has re-centred this edition on the stack nobody used last time. Two build-relevant gaps closed hard: @gluwa/usc-contracts IS published on npm (v0.2.0, 2026-08-17, Foundry-first Solidity source including EvmV1Decoder.sol, pinned to @openzeppelin/contracts 5.1.0), and the cc3-testnet explorer is https://creditcoin-testnet.blockscout.com — verified by matching eth_chainId 0x18e8f (102031) and a head block 2 blocks behind the RPC. The faucet gap remains open: faucet.cc3-testnet.creditcoin.network has no service behind it, confirming round 1.

## Claims
1. The completed BUIDL CTC edition (submission 2026/02/01–2026/03/08, 15,000 USD prize pool) received 76 BUIDLs from 189 hackers; its platform-technology tags were Creditcoin, CTC, EVM with no Attestcoin or USC tag. **[LOAD-BEARING]**
   - source: https://dorahacks.io/hackathon/buidl-ctc/buidl | publisher: DoraHacks | pub: 2026-03-08 | conf: high | class: primary-observed
2. The BUIDL CTC winners page lists exactly three winning projects: /buidl/40170 (CrediKye), /buidl/40363 (HashCredit), and /buidl/39899 (SnowBall). **[LOAD-BEARING]**
   - source: https://dorahacks.io/hackathon/buidl-ctc/winner | publisher: DoraHacks | pub: ? | conf: high | class: primary-observed
3. HashCredit, a winner, is built on USC: 'Turn BTC mining payouts into on-chain USDT credit lines via USC powered by CTC.' Its page states pool payouts are proven with SPV and converted into a USDT credit limit on Creditcoin EVM, with repayment automatically withheld from subsequent payouts. The page mentions 'USC' 17 times; repo github.com/inchyangv/ctc-hashcredit. **[LOAD-BEARING]**
   - source: https://dorahacks.io/buidl/40363 | publisher: DoraHacks | pub: ? | conf: high | class: primary-observed
4. SnowBall, another winner, mentions USC 4 times and is a full-stack DeFi protocol on Creditcoin (CDP, lending, concentrated-liquidity DEX, auto-compounding vaults, sbUSD stablecoin minted against CTC); repo github.com/hypurrquant/snowball.
   - source: https://dorahacks.io/buidl/39899 | publisher: DoraHacks | pub: ? | conf: high | class: primary-observed
5. Of the 24 project cards on page 1 of the 76-project gallery, exactly one (HashCredit) matched a keyword scan for USC / Universal Smart Contract / Attestcoin / attestation / cc3-testnet / readability / prover — the remaining 23 are conventional EVM dApps, heavily clustered on ROSCA savings circles and credit-scoring/undercollateralized lending. **[LOAD-BEARING]**
   - source: https://dorahacks.io/hackathon/buidl-ctc/buidl | publisher: DoraHacks | pub: ? | conf: high | class: primary-observed
6. A prior-edition project (TrustCircle) advertised 'Chain ID: 102030' and 'RPC: https://rpc.testnet.creditcoin.org' — the legacy Creditcoin EVM testnet, not cc3-testnet, evidencing that most of the field never used the USC stack.
   - source: https://dorahacks.io/hackathon/buidl-ctc/buidl | publisher: DoraHacks | pub: ? | conf: medium | class: primary-observed
7. The current 'BUIDL CTC 2026 Fall' edition runs 2026/08/13 05:00 to 2026/09/06 04:59 with a 15,000 USD prize pool, shows '14 days left for submission', has 115 registered hackers, and adds Tracks and Announcements tabs. **[LOAD-BEARING]**
   - source: https://dorahacks.io/hackathon/buidl-ctc-2026-fall/buidl | publisher: DoraHacks | pub: ? | conf: high | class: primary-observed
8. The Fall edition gallery HTML contains zero /buidl/NNNN project links, indicating no public submissions yet as of 2026-08-22. **[LOAD-BEARING]**
   - source: https://dorahacks.io/hackathon/buidl-ctc-2026-fall/buidl | publisher: DoraHacks | pub: ? | conf: medium | class: primary-observed
9. The Fall edition lists 'Attestcoin Protocol' among its hackathon tags and platform technology (26 occurrences of 'Attestcoin' in page HTML), versus 0 occurrences on the prior edition's page — the sponsor has explicitly re-centred this edition on Attestcoin/USC. **[LOAD-BEARING]**
   - source: https://dorahacks.io/hackathon/buidl-ctc-2026-fall/buidl | publisher: DoraHacks | pub: ? | conf: high | class: primary-observed
10. @gluwa/usc-contracts is published on npm; latest version 0.2.0 published 2026-08-17T21:38:41Z, with prior versions 0.1.0 (2026-06-29), 0.1.1 (2026-06-29), 0.1.2 (2026-07-03). **[LOAD-BEARING]**
   - source: https://registry.npmjs.org/@gluwa/usc-contracts | publisher: npm registry / Gluwa Inc. | pub: 2026-08-17 | conf: high | class: primary-observed
11. The package is described as 'Solidity contracts and libraries for the USC (Universal Smart Contracts) ecosystem on the Gluwa Creditcoin Network. Distributed as source for consumption by Foundry/forge.' It has no main, types, or exports fields — it is a pure Solidity source drop, Foundry-first, and unusable as a TS/Hardhat import. **[LOAD-BEARING]**
   - source: https://registry.npmjs.org/@gluwa/usc-contracts | publisher: npm registry / Gluwa Inc. | pub: 2026-08-17 | conf: high | class: primary-observed
12. The 0.2.0 tarball (61 files, 338,692 bytes unpacked) ships contracts/write-ability/common/EvmV1Decoder.sol and UscSdkV1TxBytesLib.sol, so EvmV1Decoder is consumable as an npm dependency rather than copy-pasted Solidity. **[LOAD-BEARING]**
   - source: https://registry.npmjs.org/@gluwa/usc-contracts/-/usc-contracts-0.2.0.tgz | publisher: npm registry / Gluwa Inc. | pub: 2026-08-17 | conf: high | class: primary-observed
13. @gluwa/usc-contracts depends on @openzeppelin/contracts pinned to exactly 5.1.0, constraining the OpenZeppelin version of any consuming project. **[LOAD-BEARING]**
   - source: https://registry.npmjs.org/@gluwa/usc-contracts | publisher: npm registry / Gluwa Inc. | pub: 2026-08-17 | conf: high | class: primary-observed
14. The package README documents a publish -> attest -> deliver -> acknowledge flow plus a relayer-assisted fee-payment flow, with sequence/class diagrams in docs/ARCHITECTURE.md; EvmV1Decoder is 'the shared decoder that both USC's readability side and the write-ability contracts use to turn a raw proven transaction into structured data.' **[LOAD-BEARING]**
   - source: https://registry.npmjs.org/@gluwa/usc-contracts | publisher: npm registry / Gluwa Inc. | pub: 2026-08-17 | conf: high | class: primary-observed
15. The published contract surface is write-ability-centric: Outbox, Inbox, OutboxFactory, OutboxDeployer, AttestorRegistry, AttestorVault, AcknowledgementValidator, EOAValidator, FeeRegistry, RelayerContract(Lite), RelayerFeeVault, USCRelayingQuoter, TWAPReader, USCProofVerifier, QueryProofVerificationLib, plus ~20 interfaces. A readability-only dApp gains mainly EvmV1Decoder and UscSdkV1TxBytesLib from it. **[LOAD-BEARING]**
   - source: https://registry.npmjs.org/@gluwa/usc-contracts/-/usc-contracts-0.2.0.tgz | publisher: npm registry / Gluwa Inc. | pub: 2026-08-17 | conf: high | class: primary-observed
16. The cc3-testnet block explorer is https://creditcoin-testnet.blockscout.com (Blockscout v11.2.7). Verified: its /api/eth-rpc returns eth_chainId 0x18e8f (102031), identical to rpc.cc3-testnet.creditcoin.network, and its head block (0x51ba93) trails the RPC head (0x51ba95) by 2 blocks. **[LOAD-BEARING]**
   - source: https://creditcoin-testnet.blockscout.com/api/eth-rpc | publisher: Blockscout / Creditcoin | pub: ? | conf: high | class: primary-observed
17. cc3-testnet chain id is 102031 (0x18e8f), confirmed by eth_chainId against https://rpc.cc3-testnet.creditcoin.network. **[LOAD-BEARING]**
   - source: https://rpc.cc3-testnet.creditcoin.network | publisher: Creditcoin / Gluwa | pub: ? | conf: high | class: primary-observed
18. cc3-testnet average block time is approximately 15 seconds (average_block_time 1.5e4 ms), with gas prices slow 1.09 / average 1.3 / fast 1.3 as of 2026-08-22.
   - source: https://creditcoin-testnet.blockscout.com/api/v2/stats | publisher: Blockscout / Creditcoin | pub: 2026-08-22 | conf: high | class: primary-observed
19. https://faucet.cc3-testnet.creditcoin.network resolves to no service (connection failure), independently confirming round 1's report that there is no HTTP faucet endpoint. explorer.cc3-testnet, blockscout.cc3-testnet and cc3-testnet.creditcoin.network are likewise dead; dashboard.cc3-testnet.creditcoin.network returns 200. **[LOAD-BEARING]**
   - source: https://faucet.cc3-testnet.creditcoin.network | publisher: Creditcoin / Gluwa (infrastructure probe) | pub: ? | conf: high | class: primary-observed
20. https://docs.creditcoin.org/attestcoin-protocol/changelogs.md contains no changelog content; it redirects readers to https://github.com/gluwa/creditcoin3/releases.
   - source: https://docs.creditcoin.org/attestcoin-protocol/changelogs.md | publisher: Creditcoin (Gluwa) | pub: ? | conf: high | class: primary-observed
21. The gluwa/creditcoin3 releases page covers node/runtime releases only (3.132.0-devnet 2026-08-14 through 3.128.0-mainnet 2026-07-13) and contains no mention of USC, Attestcoin, or a rebrand; several releases flag 'Runtime definition changed' and pallet/precompile changes, and 3.128.0-testnet and 3.130.0-testnet required runtime migrations.
   - source: https://github.com/gluwa/creditcoin3/releases | publisher: Gluwa (GitHub) | pub: 2026-08-14 | conf: high | class: primary-observed
22. The USC -> Attestcoin rebrand is not pinned to a date by any primary source found, but naming is currently split across surfaces: the npm package still says 'USC (Universal Smart Contracts)' as of 2026-08-17 while the DoraHacks Fall page (opened 2026-08-13) is already branded 'Attestcoin Protocol'. Treat USC and Attestcoin as the same technology when reading sources. **[LOAD-BEARING]**
   - source: https://registry.npmjs.org/@gluwa/usc-contracts | publisher: npm registry / DoraHacks (cross-source inference) | pub: ? | conf: medium | class: inference
23. DoraHacks blocks non-browser HTTP clients with an AWS WAF human-verification challenge, and exposes no guessable public JSON API for hackathon/BUIDL listings — all /api/hackathon/* endpoint guesses returned Nuxt 404s. Gallery data requires a JS-capable browser.
   - source: https://dorahacks.io/hackathon/buidl-ctc/buidl | publisher: DoraHacks | pub: ? | conf: high | class: primary-observed

## Leads
- Read github.com/inchyangv/ctc-hashcredit (winning USC project) — the single best real-world reference implementation of a USC readability dApp. Check which USC contracts/SDK version it used, how it did SPV proof of Bitcoin pool payouts, and what it had to work around. Also its demo at hashcredit.studioliq.com and video youtu.be/7eLXbkI1l4s.
- Read github.com/hypurrquant/snowball (winning project, 4 USC mentions) to see how a full-stack DeFi protocol touched USC, and whether the USC usage was real or aspirational.
- Fetch docs.creditcoin.org/attestcoin-protocol/dapp-builder-infrastructure/attestcoin-sdk-usc-sdk.md and .../dapp-design-patterns-readability.md (round-1 lead 3, unchased). Now sharpened: compare the docs' recommended pattern against the actual @gluwa/usc-contracts 0.2.0 surface, which is write-ability-heavy and gives readability dApps only EvmV1Decoder + UscSdkV1TxBytesLib.
- Read github.com/gluwa/usc-contracts docs/ARCHITECTURE.md — excluded from the npm tarball but in the repo; contains the publish/attest/deliver/acknowledge and relayer fee sequence diagrams, i.e. the authoritative protocol flow.
- Enumerate gallery pages 2–4 of the 76 prior-edition BUIDLs to convert the 1-of-24 USC-adoption sample into a full census, and to complete the theme-saturation map before picking a Fall-edition idea.
- Check the Fall edition's Tracks and Announcements tabs (new vs prior edition) — tracks likely define prize categories and may explicitly reward Attestcoin/USC usage, which would be directly decision-relevant.
- Diff @gluwa/usc-contracts 0.1.2 (2026-07-03) against 0.2.0 (2026-08-17) to identify breaking changes in the ~6 weeks before the hackathon — the changelog doc is a stub, so the package diff is the only available source of protocol churn.
- Monitor the Fall gallery for submissions appearing between now and the 2026-09-06 deadline to gauge live competition and USC-vs-plain-EVM split.

## Not Found
- A primary-source date for the USC -> Attestcoin rebrand. The official changelog page is an empty stub redirecting to gluwa/creditcoin3 releases, which are node/runtime releases that never mention USC or Attestcoin. Only a mid-2026 bracket could be inferred cross-source.
- A programmatic/HTTP testnet CTC faucet. faucet.cc3-testnet.creditcoin.network confirmed to have no service behind it; Discord /faucet remains the only documented route. Gap unchanged from round 1.
- The BUIDL count for the Fall edition — the stat label rendered with no number, consistent with zero submissions, but not positively confirmed as a count of 0.
- Prize ranking among the three prior-edition winners (which was 1st/2nd/3rd) — the winners page lists three BUIDL ids without extractable rank labels.
- Any non-Gluwa written tutorial, blog post, or retrospective on building with USC. Not searched this round (budget); however two winning third-party repos are now identified as concrete substitutes.
- A maintainer/Gluwa response to USC-Builder-Examples issue #36 or security issues #30-#33. Not chased this round.
- A cc3-testnet explorer URL documented in any official Creditcoin source — the working explorer (creditcoin-testnet.blockscout.com) was found by probing and verified by chain-id match, but remains absent from networks.json, the environments doc, and the tutorial .env.

round2_needed: True
