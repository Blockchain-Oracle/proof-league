# Verifier verdicts: proof-pipeline

- **VERIFIED** — "With a comparatively slow source chain such as Ethereum or Sepolia, transactions in very recent blocks will take ~8-10 minutes to be attested." The README adds: "This delay is necessary to keep the USC protocol secure in the event of a source chain reversion." VERDICT: claim (a) VERIFIED verbatim, in exactly the repo the brief named.
  - independent source: Corroborating working code example in the same repo: `utils/index.ts`. This is not a different publisher — it qualifies under the stated official-docs rule (primary repo + consistency with a working code example). No genuinely third-party source was needed or sought, since the claim is purely about what text a specific named repo contains. (Gluwa — GitHub repo gluwa/usc-testnet-bridge-examples (default branch `main`, created 2026-01-14, last pushed 2026-08-12; confirmed live and public via GitHub API))
  - note: VERIFIED. I pulled the repo tarball directly from codeload.github.com (refs/heads/main) and grepped the full tree.

BOTH quoted sentences are present verbatim, contiguously, on a single line — `hello-bridge/README.md:192`:

"With a comparatively slow source chain such as Ethereum or Sepolia, transactions in very recent blocks will take ~8-10 minutes to be attested. This delay is necessary to keep the USC protocol secure in the event of a **source chain reversion**."

Two immaterial precision notes, neither of which undercuts the verdict:
1. LOCATION: the text is in the `hello-bridge/` tutorial README, NOT the repository root README. The claim says only "The README" unqualified; the root `README.md` does not contain this text (I checked it separately). If downstream work cites this, the correct path is `hello-bridge/README.md`, not the repo root.
2. FORMATTING: the source has "**source chain reversion**" with markdown bold emphasis. The claim's prose matches exactly once emphasis markers are stripped. "The README adds" slightly implies a separate passage; in fact it is the immediately following sentence in the same paragraph.

CONSISTENCY WITH WORKING CODE (satisfies the official-docs verification rule): `utils/index.ts` independently corroborates the latency figure in three places:
- L8-9 (docstring for `generateProofFor`): "Will also wait for the block to be attested on Creditcoin before generating the proof. May take several minutes depending on how fast the attestation happens."
- L48-49 (comment): "We wait for at most 20 minutes for the attestation to be available in the proof builder cache // In practice this should take about 8 minutes, but we're being conservative to make the examples robust."
- L50 (the actual call): `await proofBuilder.waitUntilHeightAttested(chainKey, blockNumber, 15_000, 1_200_000);` — 1,200,000 ms = exactly the 20-minute conservative timeout, with a 15-second poll interval. The arithmetic matches the comment.

So the README's "~8-10 minutes" is consistent with the shipped code's "about 8 minutes" expected case, and the code hard-codes a 20-minute ceiling as a robustness margin. That 20-minute timeout is a useful operational detail the claim does not mention: builders should plan for the observed case (~8-10 min) but the reference implementation tolerates up to 20 min before failing.

The README also shows a captured sample run at L183-190 ending "Block 11073054 attested! Generating proof... / Proof generation successful!", i.e. the quoted latency note is attached to real recorded output, not a hypothetical.

Budget used: 4 tool calls, 3 distinct sources (GitHub API metadata, raw root README, full repo tarball yielding hello-bridge/README.md + utils/index.ts).
- **VERIFIED** — The sibling/renamed example repo gluwa/ccnext-testnet-bridge-examples hello-bridge README gives materially different latency guidance: "This will take a while. Sit back, relax, and wait for the query to process. Proving should take ~16 minutes and no more than 30 minutes." This is STARK-era guidance and contradicts the ~8-10 minute figure; two live official repos disagree.
  - independent source: Primary sources, both fetched directly (official-docs rule): (1) https://raw.githubusercontent.com/gluwa/ccnext-testnet-bridge-examples/main/hello-bridge/README.md — quote confirmed verbatim; (2) https://raw.githubusercontent.com/gluwa/usc-testnet-bridge-examples/main/hello-bridge/README.md — the competing ~8-10 min figure confirmed verbatim; (3) https://github.com/gluwa/ccnext-testnet-bridge-examples repo page — public, NOT archived, 82 commits, 6 forks, no supersession/rename notice; (4) https://github.com/gluwa?tab=repositories&q=bridge-examples — establishes usc-testnet-bridge-examples is a FORK OF ccnext-testnet-bridge-examples, last updated 2026-08-12. (Gluwa (GitHub, gluwa/ccnext-testnet-bridge-examples))
  - note: QUOTE VERIFIED VERBATIM. ccnext-testnet-bridge-examples/hello-bridge/README.md (main) Step 4 reads: "This will take a while. Sit back, relax, and wait for the query to process (coffee emoji) Proving should take ~16 minutes and no more than 30 minutes." The repo is public, not archived, and carries no rename/superseded notice — so "two live official repos" holds.

I also confirmed the two READMEs are genuinely disjoint on this point: ccnext contains the ~16 min proving line and does NOT contain the ~8-10 min attestation line; usc-testnet-bridge-examples contains "With a comparatively slow source chain such as Ethereum or Sepolia, transactions in very recent blocks will take ~8-10 minutes to be attested" and does NOT contain the ~16 min proving line. So a builder reading only one README forms a materially different wall-clock expectation. That core is solid.

THREE CORRECTIONS the parent must not carry forward as written:

1. "Contradicts" is WRONG as stated. The two numbers measure DIFFERENT PHASES, not competing estimates of one quantity. ~8-10 min is the ATTESTATION WAIT (how long before a recent source-chain block is attested — the usc README attributes it to source-chain-reversion safety); ~16-30 min is the PROVING/query-processing duration that follows. They are sequential, not rival. What actually happened is that the newer repo DELETED the proving-duration guidance rather than revising it down to 8-10 min. Frame this as a documentation gap in the newer repo, not as two repos publishing conflicting numbers for the same thing.

2. "STARK-era" is UNSUBSTANTIATED. I found no evidence in either repo tying the ~16 min figure to a STARK proving system or to any proving-system migration. Drop this attribution unless independently sourced.

3. Fork direction is BACKWARDS. ccnext-testnet-bridge-examples is the PARENT/upstream; usc-testnet-bridge-examples is the FORK of it (per GitHub's own fork label), last updated 2026-08-12. So ccnext is the older predecessor that was left behind, not a "sibling/renamed" peer. This weakens "two live official repos disagree" somewhat: one is a stale, still-public upstream, which is the ordinary explanation for the divergence.

NET: cite the quote and the divergence with confidence; recast the mechanism as stale-upstream deletion, and drop the STARK claim.
