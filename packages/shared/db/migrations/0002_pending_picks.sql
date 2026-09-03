-- Story 2.2: the signed-pick intake (class-2, AD-18 — a Pick's pre-lock draft state).
-- Idempotent like every migration here (the runner re-applies the whole directory).
-- verifying_contract scopes intake per deployment: marketIds restart at 1 on every fresh
-- core (verify:* scripts deploy them against this same database), and the EIP-712 domain
-- is what a signature actually binds a Pick to.
create table if not exists pending_picks (
  id bigserial primary key,
  verifying_contract text not null,
  market_id text not null,
  player text not null,
  nonce bigint not null,
  option_index integer not null,
  stake integer not null,
  utc_day integer not null,
  staked_so_far_in_day integer not null,
  signature text not null,
  received_at_sec bigint not null
);

-- First write wins per (core, market, player, nonce): replacing a mind means a HIGHER
-- nonce (latest-nonce-wins is the chain's job at scoring), so nonce reuse has no legal meaning.
create unique index if not exists pending_picks_market_player_nonce
  on pending_picks (verifying_contract, market_id, player, nonce);

-- RLS with NO policies: drafts are not a public surface (unlike the transparency log) —
-- only the worker's and the web server's direct/service connections, which bypass RLS,
-- may touch intake. The published pick-set file is the public artifact, not this table.
alter table pending_picks enable row level security;
