# Operations handoff — what needs an account I do not have

Everything in this file is blocked on a credential, a payment method or a key that lives
only in Abu's password manager. Each item says what it unblocks and roughly what it costs,
in the order that matters. Dates assume the Sep 4 code freeze and the Sep 6 submission.

## 1. Host the worker (blocks: the league running at all)

Nothing mints, commits, proves or settles while no worker is running. The first Lido
Series slot is due to mint at **2026-09-04 06:00 UTC** and locks at 11:00 UTC, so the
worker needs to be up before then or that day's Market is skipped as a dead slot.

The container and Fly config are written and tested: the image builds, boots, derives the
core from the live gateway and serves `/health`. From the repo root:

```
fly launch --no-deploy --dockerfile apps/worker/Dockerfile --config apps/worker/fly.toml
fly secrets set WORKER_PRIVATE_KEY_1=... WORKER_PRIVATE_KEY_2=... WORKER_PRIVATE_KEY_3=... \
                DATABASE_URL=... SUPABASE_URL=... SUPABASE_SERVICE_KEY=... \
                OPERATOR_WEBHOOK_URL=...
fly deploy --config apps/worker/fly.toml --dockerfile apps/worker/Dockerfile
```

Needs: a Fly account with a payment method. Note the secrets list has no escrow key in it,
and should not.

If Fly is not happening in time, the honest fallback is running
`pnpm --filter @proof-league/worker dev` with `.env.local` sourced on a machine that stays
awake. That is worse in every way except that it works today.

## 2. Provision the hosted database (blocks: the product showing anything to a judge)

The projection currently runs on the local Supabase stack, which is on Abu's laptop and
not reachable from a deployed web app or worker. A hosted Supabase project with the same
migrations applied (`pnpm --filter @proof-league/shared run db:migrate` against its
`DATABASE_URL`) makes the same code work unchanged.

Needs: a Supabase project on new-format keys. Then `DATABASE_URL`, `SUPABASE_URL` and
`SUPABASE_SERVICE_KEY` go to Fly secrets, and the two `NEXT_PUBLIC_*` values to Vercel.

There is a second consequence worth knowing about. Pick-set publication writes to
`SUPABASE_URL`, so every commitment made from a laptop records a `http://127.0.0.1:54321`
URI on-chain. That hash and those bytes are real and they verify, but only against the
local stack, which is why publication is dual-homed: the durable public copy is the
content-addressed file under `docs/pick-sets/` on the data branch, and `loadPickSet`
falls back to it when the URI is unreachable. Once the hosted project exists, commitments
made after that point carry a publicly fetchable URI. The earlier ones stay honest and
verifiable through the mirror, and they should be pushed to the data branch.

## 3. Deploy the web app (blocks: judges seeing the product at a URL)

`pnpm --filter @proof-league/web run build` passes today and the app is a normal Next
build. It needs the Vercel project plus the environment variables in CONVENTIONS §9.
Without item 2 it will render its honest empty states, which is correct behaviour but
shows a judge nothing.

## 4. Fund the season escrow (blocks: the payout paying anything)

`fundSeason` is escrow-only, one-time, and payable. It must be sent from
`0xC1396D0bEF413959A759b3b1b43013CF3f124757`, whose key is offline in the password manager
by design. Until then the pool reads 0 on-chain and the banner renders that honestly.

This is deliberately the last step on the pre-window checklist: the placeholder pool is
1,000 testnet CTC and the account holds 10,000.

## 4b. Finish the payout evidence (timed, needs nothing but a terminal)

`verify:payout` stage 1 passed earlier on a minutes-long test Season. Stage 2 drives
expiry into pull-payment and can only run once the real 6-hour challenge window closes,
at **20:15 UTC on 2026-09-03**. After that, with `.env.local` sourced:

```
pnpm verify:payout
```

It resumes from the pointer in `.worker-state/verify-payout/`, so do not clean that
directory. Until the window closes it exits 1 by design rather than pretend.

## 5. Privy application (blocks: players signing in)

Story 3.3's sign-in needs `NEXT_PUBLIC_PRIVY_APP_ID` and `PRIVY_APP_SECRET`. Nothing in
the settlement machine depends on it; it gates the player-facing half only.

## Already done, needing nothing

The contracts are live on Creditcoin 3 testnet, both decoders are registered, Series 1 is
registered with its written admission checklist, and the ContestSource is live on Sepolia.
`packages/chain/src/contracts.ts` records all of it. Redeploying would orphan that state
and lose the history window, which is why the deploy script refuses to run twice without
`DEPLOY_REPLACE=1`.
