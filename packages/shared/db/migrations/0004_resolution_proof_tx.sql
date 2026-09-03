-- Story 3.2: a settled Card links the Creditcoin transaction that proved it, so the
-- proof transaction is class-1 truth read from the MarketResolved event, not an
-- observation. Nullable because rows projected before this column existed predate it and
-- backfill on the next projection of their market.
alter table resolutions add column if not exists proof_tx_hash text;
