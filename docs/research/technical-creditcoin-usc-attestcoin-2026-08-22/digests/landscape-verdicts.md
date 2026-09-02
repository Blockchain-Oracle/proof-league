# Verifier verdicts: landscape

- **VERIFIED** — Creditcoin's cross-chain verification layer is documented as the "Attestcoin Protocol", and the docs overview page explicitly states it was "formerly called USC" — so Attestcoin is an official Creditcoin/Gluwa product name for the same thing as Universal Smart Contracts, not a separate project.
  - independent source: Primary source: official Gluwa/Creditcoin docs at docs.creditcoin.org — overview page https://docs.creditcoin.org/attestcoin-protocol.md ("Attestcoin Protocol (formerly called USC)"), the docs index https://docs.creditcoin.org/llms.txt (entire /attestcoin-protocol/* tree, incl. page titled "Attestcoin SDK (USC SDK)"), and https://docs.creditcoin.org/attestcoin-protocol/dapp-builder-infrastructure/attestcoin-sdk-usc-sdk.md, which expands the acronym and carries a working code example. Corroborated by the live docs routing: the old https://docs.creditcoin.org/usc and /creditcoin-usc paths now 404 and point readers to "Attestcoin Protocol". (Creditcoin (Gluwa) official documentation)
  - note: VERIFIED against the primary source, with an important operational caveat.

Verbatim evidence:
1. Overview page (https://docs.creditcoin.org/attestcoin-protocol.md) reads: "Attestcoin Protocol (formerly called USC)" — the exact phrase the claim asserts.
2. The SDK page (https://docs.creditcoin.org/attestcoin-protocol/dapp-builder-infrastructure/attestcoin-sdk-usc-sdk.md) closes the acronym loop the overview page leaves open: "The term USC (Universal Smart Contract) was replaced with the term Attestcoin Protocol. But repository names and other resources have yet to be updated." That sentence independently confirms both halves of the claim — official name, and same thing, not a separate project.
3. Structural corroboration: the entire docs tree has moved to /attestcoin-protocol/* (architecture, readability steps 1-2, continuity/Merkle proving, writability, dApp builder infrastructure, operator guides, whitepaper diagrams). The old /usc and /creditcoin-usc URLs — which search engines still index with titles like "USC Architecture Overview | Universal Smart Contracts" — now return "Page Not Found" and surface "Attestcoin Protocol" as the suggested replacement. That is a rename, not a parallel product.

Code-example consistency check (satisfied): the docs' own SDK example still installs and imports the OLD package name:
  npm install @gluwa/usc-sdk
  import { chainInfo, blockProver, proofProvider } from '@gluwa/usc-sdk';
  const prover = new blockProver.PrecompileBlockProver(creditcoinProvider);
  await prover.verifySingle(chainKey, headerNumber, txBytes, merkleProof, continuityProof);
This is consistent with the docs' own admission that repo/package names lag the rebrand.

CAVEAT for anyone acting on this (the one thing the claim understates): the rename is documentation-layer only so far. Tooling still ships under "usc" — npm @gluwa/usc-sdk, GitHub gluwa/creditcoin-usc-networks, the gluwa/creditcoin3 usc-dev branch, @gluwa/creditcoin-public-prover ("Provide Prover and Type contract for USC"). So "Attestcoin" and "USC" must be treated as interchangeable when searching repos, npm, or older blog posts (creditcoin.org/blog/universal-smart-contracts/), and any deep link to docs.creditcoin.org/usc/* is now dead and needs rewriting to /attestcoin-protocol/*. Do not write code expecting an @gluwa/attestcoin-sdk package — it is not what the official docs use.

Budget: 5 sources, 7 tool calls.
- **OVERTURNED** — Both names are live in Creditcoin's own materials: the June 2026 mainnet announcement uses "Universal Smart Contracts (USC)" exclusively and links to docs.creditcoin.org/creditcoin-usc, while the docs tree is rooted at /attestcoin-protocol. A third name, "CCNext", appears in Gluwa's own repo descriptions ("builders on the CCNext decentralized bridge", repo cc-next-query-builder).
  - independent source: Primary sources checked directly: docs.creditcoin.org (root + /creditcoin-usc), creditcoin.org/blog/creditcoin-mainnet/, and the GitHub REST API repo search over the gluwa org (github.com — different publisher, different underlying data, for the CCNext half). (Creditcoin (creditcoin.org blog))
  - note: The umbrella thesis survives but three of the four load-bearing specifics are contradicted by the primary sources.

WHAT HOLDS (verified against primaries):
1. Naming fragmentation is real. "Universal Smart Contracts (USC)", "Attestcoin Protocol", and "CCNext" all appear concurrently in Creditcoin/Gluwa material. docs.creditcoin.org describes USC as the Phase 2 layer; docs.creditcoin.org/attestcoin-protocol exists (surfaced by the docs 404 handler as a live suggested page and confirmed in creditcoin.org search results describing "a general-purpose cross-chain execution layer built into Creditcoin's runtime").
2. "CCNext" genuinely appears in Gluwa repo descriptions. GitHub API search (q=CCNext in:description user:gluwa) returns total_count=2: gluwa/ccnext-testnet-bridge-examples — "This repository contains a few scripts and instructions that demonstrate use of the CCNext decentralized bridge."; gluwa/USC-Builder-Examples — "Example smart contracts for builders on the CCNext decentralized bridge."
3. A repo named gluwa/cc-next-query-builder does exist (search q=cc-next user:gluwa, total_count=1).

WHAT IS CONTRADICTED:
1. No June 2026 mainnet announcement was findable on creditcoin.org. The mainnet post at https://creditcoin.org/blog/creditcoin-mainnet/ is dated August 28, 2024. A domain-restricted search of creditcoin.org/blog surfaced nothing from June 2026; most recent indexed posts are Dec 2025 / Oct 2025 / Jul 2025.
2. That mainnet post does NOT link to docs.creditcoin.org/creditcoin-usc. Its only docs links are `https://docs.creditcoin.org/?ref=creditcoin.org` (appearing twice). It does use "Universal Smart Contract (USC)" language, so only the terminology half of that sentence is right.
3. docs.creditcoin.org/creditcoin-usc returns a 404 ("The URL creditcoin-usc does not exist"). The live USC docs root is docs.creditcoin.org/usc (e.g. /usc, /usc/dapp-builder-infrastructure/universal-smart-contracts). A /creditcoin-usc URL is still in search indexes, i.e. it is a stale/dead path, not a currently-linked destination.
4. The docs tree is NOT "rooted at /attestcoin-protocol". The root is docs.creditcoin.org/ with top-level sections (Nominator Guides, Validator Guides, Wallets, Smart Contracts, EVM-compatibility, Creditcoin CLI, plus USC). /attestcoin-protocol is one page/section among several, not the tree root.
5. Repo-to-description mapping is conflated. The quoted string "builders on the CCNext decentralized bridge" belongs to gluwa/USC-Builder-Examples, not to gluwa/cc-next-query-builder. cc-next-query-builder's actual description is "SDK for Building and Submitting Proofs with USC" — which contains USC, not CCNext.

BOTTOM LINE for downstream use: keep the claim "Creditcoin ships at least three overlapping names for the same cross-chain layer — USC, Attestcoin Protocol, and CCNext — across its docs and Gluwa's repos", and cite docs.creditcoin.org/usc, docs.creditcoin.org/attestcoin-protocol, gluwa/USC-Builder-Examples, and gluwa/ccnext-testnet-bridge-examples. Drop the June 2026 announcement, the /creditcoin-usc link, the "rooted at /attestcoin-protocol" framing, and the cc-next-query-builder attribution.
