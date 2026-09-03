# Proof League

A prediction league where the matches are real things happening on Ethereum and the referee is
cryptographic proof. Players spend a small daily allowance of free points on Picks; the real
event settles on Ethereum; Creditcoin's **Attestcoin Protocol** proves the result; the contract
scores everyone. No human judgment anywhere in the loop, and no money: points are free, records
are public, and every settled Card links the Ethereum transaction that decided it and the
Creditcoin transaction that proved it.

Built in the open for **Creditcoin BUIDL 2026 Fall** (DoraHacks).

## The claim, and why it is checkable

Most prediction products ask you to trust an operator who can see the answer before you can.
Proof League removes that position from the design rather than promising not to abuse it:

- **Picks commit before the answer can exist.** The pick-set is published in full, with every
  signature, and its hash goes on-chain inside a window the contract enforces: after Lock Time
  and strictly before the source event's window opens. Adding a winning Pick afterwards is not
  something we decline to do, it is something the chain refuses.
- **The operator never reports the outcome.** Settlement takes a proof of a real Ethereum log,
  checked on Creditcoin against seven conditions (right chain, right contract, right event,
  right subject, not replayed, not before the window, real prover path). The worker submits
  proofs; it cannot choose results.
- **Markets are minted by a formula, not by us.** Recurring Markets come from immutable
  on-chain Series templates whose boundaries derive from prior on-chain observations, so two
  callers at any two times mint byte-identical parameters.
- **The database is a cache of the chain.** `pnpm rebuild` reconstructs every truth row from
  chain events plus the published pick-sets, re-verifies every signature and the daily
  allowance rule, and fails if the cache disagrees.

## Live on Creditcoin 3 testnet

| Contract | Address |
|---|---|
| ProofGateway (the entry point) | [`0x4549fbd1acf45cf46f29b3adb6b052880c8040ec`](https://creditcoin-testnet.blockscout.com/address/0x4549fbd1acf45cf46f29b3adb6b052880c8040ec) |
| LeagueCore (deployed by the gateway's constructor) | [`0xFe8C5438781f8c8392a49e20502920Ba41027493`](https://creditcoin-testnet.blockscout.com/address/0xFe8C5438781f8c8392a49e20502920Ba41027493) |
| ContestSource (Sepolia, the Hosted Round source) | [`0x8334889B9c068e57078Da3376087ee2b7A7fd42B`](https://eth-sepolia.blockscout.com/address/0x8334889B9c068e57078Da3376087ee2b7A7fd42B) |

Registered decoders: `1` Lido rate-ratio, `2` Contest round. Off-chain config records the
**gateway only** and derives the core from `gateway.leagueCore()`: a core configured
independently could name any deployer as its resolver, and no constructor check could refuse it.

Series 1 (Lido daily rate-ratio APR) is registered and the engine mints from it on its own. The
written admission checklist, the twelve-report measured band the boundaries are sized from, and
the named limits are in [docs/launch-lineup.md](docs/launch-lineup.md).

## Verify it yourself

Each `verify:*` script is one focused evidence run against real chains. They exit non-zero
rather than print anything they did not observe.

```
pnpm verify:commit      # sign -> intake -> publish both homes -> commitPicks -> provably in set
pnpm verify:void        # both terminal void edges, and the early-void refusal, by name
pnpm verify:settlement  # a real Sepolia event -> attest -> prove -> submit -> resolved on CC3
pnpm verify:payout      # a minutes-long Season on the same bytecode, trigger to pull-payment
pnpm verify:hosted-round # a full round, create to proof verified, timed against the 30-min bound
pnpm rebuild            # reconstruct every truth row from chain + published pick-sets and diff
```

`pnpm rebuild` runs in CI on every push. With no deployment configured it exercises the diff
engine hermetically and proves a mutated row turns it red, because a gate that cannot fail is
not a gate.

## Monorepo

```
contracts/        Foundry: LeagueCore, ProofGateway, ContestSource, the Series engine, decoders
apps/web/         Next.js product (App Router)
apps/worker/      settlement worker: watch -> attest-wait -> prove -> submit -> project
packages/shared/  canonical domain: seven checks, payout math, EIP-712 pick schema, states, db
packages/chain/   chain identity, endpoints, deployed addresses (the only legal home of chain ids)
docs/             research + planning corpus copies, spike measurements, evidence
```

The worker is the only writer of truth projections and the only submitter of transactions. The
web app is a window on the projection and a collector of signed Picks; it computes no outcomes.

## Development

```
nvm use              # Node 24 (.nvmrc)
pnpm install
pnpm check           # lint laws + raw-line caps + UI grammar + types + secret/overclaim scans
pnpm build           # web + worker
cd contracts && forge test
```

The worker and the verify scripts read their configuration from `.env.local`; see
`CONVENTIONS §9` for the complete variable inventory and which store owns each one. The
season escrow key is never loaded by any service.

Commit policy: conventional commits, pushed daily; evidence data (pick-set mirrors) lives on a
dedicated data branch so post-freeze commits never read as development.

## License

MIT — see [LICENSE](LICENSE).
