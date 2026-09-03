# packages/shared/db

Sole owner of the Drizzle schema, migrations and RLS policy files (CONVENTIONS §4).
Story 2.8 seeded it with the class-2 `transparency_observations` table (the worker's
phase-timestamp log, AD-7/AD-18); Story 1.3/2.9 add the class-1 truth tables and the
remaining class-2 operational tables here — nobody defines a table anywhere else.

- `schema.ts` — the Drizzle tables (the eslint drizzle-placement rule makes this the one
  legal home for `pgTable`).
- `migrations/*.sql` — idempotent, applied in filename order by `pnpm --filter
  @proof-league/shared run db:migrate` (needs `DATABASE_URL`; local dev points at the
  local Supabase stack, `postgresql://postgres:postgres@127.0.0.1:54322/postgres`).
- `index.ts` — `createDb(databaseUrl)`: the one way a service opens this database.
