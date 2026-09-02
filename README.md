# Proof League

A prediction league where the matches are real things happening on Ethereum and the referee is
cryptographic proof. Players spend a small daily allowance of free points on Picks; the real
event settles on Ethereum; Creditcoin's **Attestcoin Protocol** proves the result; the contract
scores everyone. No human judgment anywhere in the loop, and no money: points are free, records
are public, and every settled Card links the Ethereum transaction that decided it and the
Creditcoin transaction that proved it.

Built in the open for **Creditcoin BUIDL 2026 Fall** (DoraHacks).

## Monorepo

```
contracts/        Foundry: settlement contracts (LeagueCore, ProofGateway, ContestSource)
apps/web/         Next.js product (App Router)
apps/worker/      settlement worker: watch -> attest-wait -> prove -> submit -> project
packages/shared/  canonical domain: seven checks, payout math, EIP-712 pick schema, states
packages/chain/   chain identity, endpoints, deployed addresses (the only legal home of chain ids)
docs/             research + planning corpus copies, spike measurements, evidence
```

## Development

```
nvm use              # Node 24 (.nvmrc)
pnpm install
pnpm check           # lint laws + raw-line caps + types + secret/overclaim scans
pnpm build           # web + worker
cd contracts && forge build
```

Commit policy: conventional commits, pushed daily; evidence data (pick-set mirrors) will live on
a dedicated data branch so post-freeze commits never read as development.

## License

MIT — see [LICENSE](LICENSE).
