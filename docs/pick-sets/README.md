# Pick-set mirror (AD-5, Story 2.2)

The second home of every published pick-set: content-addressed JSON files named
`<marketId>-<sha256>.json`, byte-identical to the Supabase Storage object at the public
path `picksets/<marketId>-<sha256>.json` whose sha256 is recorded on-chain by
`commitPicks`. Each file contains every signed EIP-712 Pick for its market — superseded
nonces and zero-stake tombstones included, sorted (player asc, nonce asc) — because the
ordering is part of the commitment and latest-nonce-wins is resolved on-chain at scoring.

Data-vs-code commit policy: the JSON files are ignored on `main` and are committed by the
mirror step to the **dedicated data branch** (bot-authored, exempt from the code freeze),
so daily evidence commits through the judging window never read as post-freeze
development. `pnpm rebuild` re-verifies every signature, the AD-15 budget rule, and that
each file re-derives its on-chain root.
