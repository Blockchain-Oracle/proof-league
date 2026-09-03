import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

export * from "./schema.js";
export * from "./picks.js";
// The sanctioned query operators, re-exported so consumers never grow their own
// drizzle-orm dependency (one pinned version, owned here with the schema — §4).
export { and, eq } from "drizzle-orm";

export type Db = ReturnType<typeof createDb>["db"];

/// The one way a service opens the projection database (CONVENTIONS §4): consumers get
/// typed query builders over the owned schema, never a raw connection of their own.
/// `prepare: false` because Supabase's pooled connections reject prepared statements.
export const createDb = (databaseUrl: string): { db: ReturnType<typeof drizzle<typeof schema>>; end: () => Promise<void> } => {
  const client = postgres(databaseUrl, { prepare: false });
  return { db: drizzle(client, { schema }), end: () => client.end() };
};
