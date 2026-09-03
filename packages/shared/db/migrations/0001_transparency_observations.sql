-- Story 2.8: the class-2 phase-timestamp transparency log (AD-7, AD-18). Idempotent so
-- the tiny migrate runner can re-apply the whole directory on every run.
create table if not exists transparency_observations (
  id bigserial primary key,
  at_sec bigint not null,
  source_key text not null,
  market_ids jsonb not null,
  phase text not null check (phase in ('event', 'attested', 'proven', 'note')),
  evidence_class text not null check (evidence_class in ('observed', 'proven')),
  tx_hash text,
  over_cliff boolean,
  note text
);

-- RLS per AD-13: public read (the transparency page renders this), no anon writes, no
-- deletes; the worker writes through its direct connection, which bypasses RLS.
alter table transparency_observations enable row level security;
do $$ begin
  create policy transparency_observations_public_read
    on transparency_observations for select using (true);
exception when duplicate_object then null; end $$;
