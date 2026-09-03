import { bigint, bigserial, boolean, jsonb, pgTable, text } from "drizzle-orm/pg-core";

// The Drizzle schema home (CONVENTIONS §4): nobody else defines a table. Story 2.8 seeds
// it with the ONE class-2 table it owns — the phase-timestamp transparency log (AD-7:
// event/attested/proven written as each phase completes). Story 1.3/2.9 add the class-1
// truth tables and the remaining class-2 operational tables beside it.
//
// Class-2 law (AD-18): rows here are worker OBSERVATIONS, labelled observed-not-proven
// where displayed; a 'proven' row carries the Creditcoin transaction that IS proven. This
// table never feeds a class-1 value and is excluded from the rebuild diff.

export const transparencyObservations = pgTable("transparency_observations", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  atSec: bigint("at_sec", { mode: "number" }).notNull(),
  sourceKey: text("source_key").notNull(),
  marketIds: jsonb("market_ids").$type<readonly string[]>().notNull(),
  phase: text("phase").$type<"event" | "attested" | "proven" | "note">().notNull(),
  evidenceClass: text("evidence_class").$type<"observed" | "proven">().notNull(),
  txHash: text("tx_hash"),
  overCliff: boolean("over_cliff"),
  note: text("note"),
});
