import { bigint, bigserial, boolean, integer, jsonb, pgTable, text, uniqueIndex } from "drizzle-orm/pg-core";

// The Drizzle schema home (CONVENTIONS §4): nobody else defines a table. Story 2.8 seeds
// it with the ONE class-2 table it owns — the phase-timestamp transparency log (AD-7:
// event/attested/proven written as each phase completes). Story 1.3/2.9 add the class-1
// truth tables and the remaining class-2 operational tables beside it.
//
// Class-2 law (AD-18): rows here are worker OBSERVATIONS, labelled observed-not-proven
// where displayed; a 'proven' row carries the Creditcoin transaction that IS proven. This
// table never feeds a class-1 value and is excluded from the rebuild diff.

// Story 2.2's intake home — class-2 BY DESIGN (AD-18: a Pick's pre-lock draft state is one
// of the three values authoritative off-chain). Rows are signed EIP-712 messages awaiting
// the market's commit window; the worker canonicalizes, publishes and commits them at
// lockTime, and after that the PUBLISHED FILE + chain root are the truth, never this table.
// (market_id, player, nonce) is unique with first-write-wins: a player changes their mind
// by signing a HIGHER nonce (latest-nonce-wins is resolved on-chain at scoring), so an
// intake overwrite of an existing nonce has no legal meaning.
export const pendingPicks = pgTable(
  "pending_picks",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    // The EIP-712 domain's contract, because marketIds restart at 1 on every deployment
    // (verify:* scripts deploy fresh cores against this same database): intake is scoped
    // (core, market), matching exactly what the signature binds a Pick to.
    verifyingContract: text("verifying_contract").notNull(), // lowercase 0x address
    marketId: text("market_id").notNull(), // uint256-safe decimal string
    player: text("player").notNull(), // lowercase 0x address
    nonce: bigint("nonce", { mode: "number" }).notNull(),
    optionIndex: integer("option_index").notNull(),
    stake: integer("stake").notNull(),
    utcDay: integer("utc_day").notNull(),
    stakedSoFarInDay: integer("staked_so_far_in_day").notNull(),
    signature: text("signature").notNull(),
    receivedAtSec: bigint("received_at_sec", { mode: "number" }).notNull(),
  },
  (table) => [
    uniqueIndex("pending_picks_market_player_nonce").on(
      table.verifyingContract,
      table.marketId,
      table.player,
      table.nonce,
    ),
  ],
);

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
