-- Story 2.9: the class-1 truth projections (AD-8/AD-18) — cache of the chain, sole
-- writer the projector, every row re-derivable by `pnpm rebuild`. Idempotent throughout.

create table if not exists markets (
  core text not null,
  market_id text not null,
  source_key text not null,
  source_chain_key text not null,
  emitter text not null,
  event_signature text not null,
  subject_filter text not null,
  decoder_id integer not null,
  payout_n integer not null,
  league_day integer not null,
  lock_time bigint not null,
  source_window_open bigint not null,
  void_deadline bigint not null,
  determinism_horizon bigint not null,
  boundaries jsonb not null,
  state text not null check (state in ('Created', 'Committed', 'Resolved', 'Voided')),
  commit_root text,
  commit_sha256 text,
  commit_uri text,
  committed_at bigint,
  primary key (core, market_id)
);

create table if not exists committed_picks (
  core text not null,
  market_id text not null,
  leaf_index integer not null,
  player text not null,
  nonce bigint not null,
  option_index integer not null,
  stake integer not null,
  utc_day integer not null,
  staked_so_far_in_day integer not null,
  signature text not null,
  primary key (core, market_id, leaf_index)
);

create table if not exists resolutions (
  core text not null,
  market_id text not null,
  value text not null,
  occurred_at bigint not null,
  resolved_at bigint not null,
  winning_option integer not null,
  primary key (core, market_id)
);

create table if not exists scores (
  core text not null,
  market_id text not null,
  leaf_index integer not null,
  player text not null,
  outcome text not null check (outcome in ('scored', 'OutOfOrder', 'Superseded', 'Tombstone', 'ForeignMarket', 'OverBudget')),
  correct boolean,
  points_awarded text,
  utc_day integer,
  tx_hash text not null,
  primary key (core, market_id, leaf_index)
);

create table if not exists season_standings (
  core text not null,
  player text not null,
  season_points text not null,
  streak integer not null,
  earliest_commit_ordinal bigint not null,
  rank integer not null,
  primary key (core, player)
);

-- Class-1 rows ARE the public product surface (the chain is public; its cache is too):
-- read for everyone, no anon writes — the projector writes through its direct
-- connection, which bypasses RLS.
alter table markets enable row level security;
alter table committed_picks enable row level security;
alter table resolutions enable row level security;
alter table scores enable row level security;
alter table season_standings enable row level security;
do $$ begin
  create policy markets_public_read on markets for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy committed_picks_public_read on committed_picks for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy resolutions_public_read on resolutions for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy scores_public_read on scores for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy season_standings_public_read on season_standings for select using (true);
exception when duplicate_object then null; end $$;

-- FR-15's realtime surface: one insert into scores per player-scored outcome IS the one
-- realtime event (Supabase Realtime streams the WAL of published tables). Standings ride
-- along so the Leaderboard updates without polling.
-- undefined_object: a bare Postgres without the supabase_realtime publication (CI, plain
-- docker) — realtime is a Supabase deployment feature, its absence must not fail truth.
do $$ begin
  alter publication supabase_realtime add table scores;
exception when duplicate_object then null; when undefined_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table season_standings;
exception when duplicate_object then null; when undefined_object then null; end $$;
