# Verifier verdicts: builder-reality

- **VERIFIED** — The official USC SDK is published on npm as @gluwa/usc-sdk at version 0.18.0, developed in gluwa/cc-next-query-builder (TypeScript), with 30 GitHub releases from 0.0.6 (2025-10-17) through 0.18.0 (2026-06-22) and last push 2026-08-20 — actively maintained but pre-1.0.
  - independent source: npm public registry API (registry.npmjs.org/@gluwa%2Fusc-sdk and /latest) — registry-held publish metadata, independent of Gluwa's own docs/marketing; cross-checked against the GitHub REST API (api.github.com/repos/gluwa/cc-next-query-builder, /releases, /readme) as the primary repo source. (Gluwa (GitHub))
  - note: Substantively verified, with one numeric correction.

CONFIRMED by primary/registry sources:
- npm registry: package @gluwa/usc-sdk exists; dist-tags.latest = 0.18.0; description "Typescript SDK for the USC (Universal Smart Contracts) ecosystem on the Gluwa Creditcoin Network"; repository = git+https://github.com/gluwa/cc-next-query-builder.git.
- GitHub API: repo gluwa/cc-next-query-builder is public, not archived, language = TypeScript, created_at 2025-08-20T23:28:28Z, pushed_at 2026-08-20T19:23:21Z (matches "last push 2026-08-20").
- Release 0.18.0 published 2026-06-22T13:23:13Z on GitHub; npm publish of 0.18.0 at 2026-06-22T13:22:54Z — consistent within one minute.
- Pre-1.0 and actively maintained: highest version is 0.18.0 and the repo was pushed 2 days before the check date (2026-08-22), though the most recent tagged release is ~2 months old.
- Code-example consistency: repo README instructs `npm install @gluwa/usc-sdk` and documents working examples (examples/proof-generation.ts, examples/proof-validation.ts, examples/supported-chains-attestation-information.ts) using PrecompileChainInfoProvider, ProofBuilder, PrecompileBlockProver.

CORRECTION (sub-claim is wrong): the repo has 33 GitHub releases, not 30, and the earliest is 0.0.1 published 2025-08-25T17:10:35Z, not 0.0.6 (2025-10-17). 0.0.3 (2025-10-13) and 0.0.2 (2025-10-10) also predate 0.0.6. The error looks like a pagination artifact: GitHub's /releases endpoint defaults to per_page=30, and the 30th-newest release is exactly 0.0.6 (2025-10-17T19:17:38Z) — i.e. the claim was built from an unpaginated first page.

ADDITIONAL NUANCE: npm's publish history for this package begins at 0.9.0 (registry "created" = 2026-03-23T19:31:12Z); GitHub releases 0.0.1 through 0.8.0 have no npm counterpart under this package name, and 0.10.0 and 0.14.0 also have GitHub releases with no npm publish. Only 11 versions are live on npm (0.9.0, 0.11.0, 0.12.0, 0.12.1, 0.12.2, 0.13.0, 0.14.1, 0.15.0, 0.16.0, 0.17.0, 0.18.0). This does not contradict the claim (which scopes the count to GitHub releases) but means "30" is not a valid npm-version count either.

Not marked disputed because the sources do not disagree with each other — npm and GitHub corroborate; the claim itself simply undercounts releases relative to both.
- **VERIFIED** — EvmV1Decoder.sol and USCProofVerifier.sol both exist in gluwa/USC-Builder-Examples at contracts/UseCases/SourceDestinationLoanRecording/, alongside DestinationLoanRecording.sol, SourceLoanHelper.sol, SourceLoanRegistry.sol, USCLoanReadabilityManager.sol and abstract/{ILoanReadabilityTarget,LoanRegisterEIP712,LoanTypes}.sol — demonstrating one fleshed-out use case: cross-chain loan recording across 2 chains, with matching TS scripts under scripts/loan-readability/.
  - independent source: Primary repo re-checked through two different access paths, both bypassing whatever listing the original publisher used: (1) GitHub git-trees API via authenticated `gh api repos/gluwa/USC-Builder-Examples/git/trees/HEAD?recursive=1` (full recursive tree, unfiltered); (2) raw.githubusercontent.com direct file fetches of EvmV1Decoder.sol (HTTP 200, 9418 bytes) and USCProofVerifier.sol (HTTP 200, 5509 bytes) on branch `main`; (3) the in-repo design doc contracts/UseCases/SourceDestinationLoanRecording/CROSSCHAIN_LOAN_RECORDING_2_CHAINS.md, which independently corroborates the file inventory and the 2-chain topology. Per the official-docs rule, primary repo + consistency with the working code example constitutes verification. (Gluwa (GitHub API))
  - note: VERIFIED in full — no discrepancies found on any sub-claim.

File existence (recursive tree, exact paths):
- contracts/UseCases/SourceDestinationLoanRecording/EvmV1Decoder.sol — present
- .../USCProofVerifier.sol — present
- .../DestinationLoanRecording.sol — present
- .../SourceLoanHelper.sol — present
- .../SourceLoanRegistry.sol — present
- .../USCLoanReadabilityManager.sol — present
- .../abstract/ILoanReadabilityTarget.sol, .../abstract/LoanRegisterEIP712.sol, .../abstract/LoanTypes.sol — all three present
That is 9/9 named files, all in the exact directory claimed.

Non-stub confirmation: both headline contracts are real implementations, not placeholders. EvmV1Decoder.sol (9418 bytes) is a Solidity library decoding ABI-encoded EVM transactions types 0-4 and receipts from prover txBytes, with a header noting it is "Adapted from usc-testnet-bridge-examples/contracts/sol/EvmV1Decoder.sol". USCProofVerifier.sol (5509 bytes) implements IUSCProofVerifier and does "CC3 query proof verification via native precompile 0xFD2", importing BlockProverTypes, INativeQueryVerifier/NativeQueryVerifierLib and QueryProofVerificationLib from contracts/abstract/ — and all four of those imported files exist in the tree, so the example actually compiles as a coherent unit rather than dangling.

"One fleshed-out use case": confirmed. contracts/UseCases/ contains exactly one subdirectory, SourceDestinationLoanRecording — there is no second use-case folder in the repo.

"Cross-chain loan recording across 2 chains": confirmed by the co-located design doc CROSSCHAIN_LOAN_RECORDING_2_CHAINS.md (a file the claim did not mention, so this is corroborating rather than circular). It specifies Sepolia as source chain and CC3 testnet as destination, mirroring loan state via attested block proofs, and enumerates the same nine .sol files. Key line: "Each loan lifecycle step on the source chain produces an event that can be proved to the destination chain. The destination never holds ERC20 — it only records loan state mirrored from that one source."

"Matching TS scripts under scripts/loan-readability/": confirmed, 7 TypeScript files, all .ts, none .js — 1_sourceLoanExecution.ts, 2_cc3ReadabilityExecution.ts, deploy.ts, env.ts, prover.ts, setup_readability.ts, shared.ts. The numbered 1_/2_ prefixes map onto the doc's Phase 1 (source) / Phase 2 (cc3) execution flow, and the doc's named npm targets (deploy:source, deploy:cc3, setup, source, cc3) correspond to deploy.ts, setup_readability.ts and the two phase scripts.

Method caveats worth recording: the unauthenticated api.github.com path was rate-limited (HTTP 403 via WebFetch, rate-limit JSON via curl) from this IP, so the tree was pulled with the authenticated gh CLI instead; that is the same primary source, not a third-party mirror. The tree was read at HEAD of the default branch (main) as of 2026-08-22 — this is a snapshot claim about a mutable repo, so it is true as of that commit and could drift if the repo is restructured. No independent non-Gluwa publisher exists for a claim about the contents of a Gluwa-owned repository; verification here rests on the primary source plus internal consistency of the code example, which the stated rules allow.
