import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { pino } from "pino";
import postgres from "postgres";

// The migration runner (CONVENTIONS §4): applies db/migrations/*.sql in filename order.
// Every migration is written idempotent (IF NOT EXISTS / duplicate_object guards), so
// re-running the whole directory is always safe — no ledger table until one earns its keep.
// Run: pnpm --filter @proof-league/shared run db:migrate  (DATABASE_URL required)

const logger = pino({ base: null });

const url = process.env.DATABASE_URL;
if (url === undefined) {
  logger.error("db:migrate: DATABASE_URL is not set — refusing to guess a database");
  process.exit(1);
}

const dir = fileURLToPath(new URL("./migrations", import.meta.url));
const sql = postgres(url, { max: 1, prepare: false });
try {
  for (const file of readdirSync(dir).sort()) {
    if (!file.endsWith(".sql")) continue;
    await sql.unsafe(readFileSync(join(dir, file), "utf8"));
    logger.info(`db:migrate: applied ${file}`);
  }
} finally {
  await sql.end();
}
