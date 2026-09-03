import { bigint, bigserial, boolean, integer, jsonb, pgTable, primaryKey, text, uniqueIndex } from "drizzle-orm/pg-core";

// The Drizzle schema home (CONVENTIONS §4): nobody else defines a table.
//
// AD-18's two classes, drawn through this file:
// - CLASS 1 (truth projections, Story 2.9): markets, committed_picks, resolutions,
//   scores, season_standings — every row reconstructable from chain events/views plus
//   the published pick-set files, and `pnpm rebuild` diffs them clean on every push.
//   All are scoped by `core` because verify:* runs deploy fresh cores against this
//   same database.
// - CLASS 2 (operational observations): pending_picks (intake drafts) and
//   transparency_observations (the AD-7 phase log) here, plus the worker's on-disk
//   cursor/ledger state. Class 2 never feeds a class-1 value and is excluded from the
//   rebuild diff; displayed class-2 values are labelled observed-not-proven (a 'proven'
//   transparency row carries the Creditcoin transaction that IS proven).

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

// -- class-1 truth projections (Story 2.9, AD-8/AD-18) ---------------------------------
// Cache of the chain, nothing more: the projector is the sole writer, `pnpm rebuild`
// re-derives every row from chain + published pick-sets and diffs. uint256/int256 values
// travel as decimal strings; second-resolution chain times fit JS numbers.

export const markets = pgTable(
  "markets",
  {
    core: text("core").notNull(), // lowercase LeagueCore address
    marketId: text("market_id").notNull(),
    sourceKey: text("source_key").notNull(),
    sourceChainKey: text("source_chain_key").notNull(),
    emitter: text("emitter").notNull(),
    eventSignature: text("event_signature").notNull(),
    subjectFilter: text("subject_filter").notNull(),
    decoderId: integer("decoder_id").notNull(),
    payoutN: integer("payout_n").notNull(),
    leagueDay: integer("league_day").notNull(),
    lockTime: bigint("lock_time", { mode: "number" }).notNull(),
    sourceWindowOpen: bigint("source_window_open", { mode: "number" }).notNull(),
    voidDeadline: bigint("void_deadline", { mode: "number" }).notNull(),
    determinismHorizon: bigint("determinism_horizon", { mode: "number" }).notNull(),
    boundaries: jsonb("boundaries").$type<readonly string[]>().notNull(),
    state: text("state").$type<"Created" | "Committed" | "Resolved" | "Voided">().notNull(),
    // The commitment half (null until commitPicks): root/sha pin the published file.
    commitRoot: text("commit_root"),
    commitSha256: text("commit_sha256"),
    commitUri: text("commit_uri"),
    committedAt: bigint("committed_at", { mode: "number" }),
  },
  (table) => [primaryKey({ columns: [table.core, table.marketId] })],
);

// One row per leaf of a committed set, exactly the published file's order (leaf order IS
// the commitment, AD-5); signatures kept so the web never needs the file for display.
export const committedPicks = pgTable(
  "committed_picks",
  {
    core: text("core").notNull(),
    marketId: text("market_id").notNull(),
    leafIndex: integer("leaf_index").notNull(),
    player: text("player").notNull(),
    nonce: bigint("nonce", { mode: "number" }).notNull(),
    optionIndex: integer("option_index").notNull(),
    stake: integer("stake").notNull(),
    utcDay: integer("utc_day").notNull(),
    stakedSoFarInDay: integer("staked_so_far_in_day").notNull(),
    signature: text("signature").notNull(),
  },
  (table) => [primaryKey({ columns: [table.core, table.marketId, table.leafIndex] })],
);

export const resolutions = pgTable(
  "resolutions",
  {
    core: text("core").notNull(),
    marketId: text("market_id").notNull(),
    value: text("value").notNull(), // int256, 1e18 scale
    occurredAt: bigint("occurred_at", { mode: "number" }).notNull(),
    resolvedAt: bigint("resolved_at", { mode: "number" }).notNull(),
    winningOption: integer("winning_option").notNull(),
  },
  (table) => [primaryKey({ columns: [table.core, table.marketId] })],
);

// One row per leaf outcome from the scoring events (PickScored / PickSkipped) — a
// 'scored' row is FR-15's player-scored outcome, and its insert is the one realtime
// event per outcome (the scores table is in the supabase_realtime publication).
export const scores = pgTable(
  "scores",
  {
    core: text("core").notNull(),
    marketId: text("market_id").notNull(),
    leafIndex: integer("leaf_index").notNull(),
    player: text("player").notNull(),
    outcome: text("outcome")
      .$type<"scored" | "OutOfOrder" | "Superseded" | "Tombstone" | "ForeignMarket" | "OverBudget">()
      .notNull(),
    correct: boolean("correct"),
    pointsAwarded: text("points_awarded"), // uint256; null on skips
    utcDay: integer("utc_day"),
    txHash: text("tx_hash").notNull(),
  },
  (table) => [primaryKey({ columns: [table.core, table.marketId, table.leafIndex] })],
);

// The leaderboard's truth row (FR-18/FR-19): points, streak and the tie-break key from
// the chain's own views, rank recomputed over the core's standings in the same
// transaction that lands the scores (AC: score/streak/rank in ONE Postgres transaction).
export const seasonStandings = pgTable(
  "season_standings",
  {
    core: text("core").notNull(),
    player: text("player").notNull(),
    seasonPoints: text("season_points").notNull(), // uint256
    streak: integer("streak").notNull(),
    earliestCommitOrdinal: bigint("earliest_commit_ordinal", { mode: "number" }).notNull(),
    rank: integer("rank").notNull(),
  },
  (table) => [primaryKey({ columns: [table.core, table.player] })],
);
