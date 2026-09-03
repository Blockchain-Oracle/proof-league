import { and, eq } from "drizzle-orm";
import type { SignedPick } from "../src/pickset.js";
import { pendingPicks } from "./schema.js";
import type { Db } from "./index.js";

// The two intake operations both planes share (CONVENTIONS §4: the db package owns how
// its tables are touched): the web's server route stores signed picks here in Epic 3, the
// worker reads them back at commit time, and verify:commit drives EXACTLY these functions
// so the evidence run exercises the production intake path, not a parallel one.

export type PendingPickRow = SignedPick & {
  readonly verifyingContract: string;
  readonly receivedAtSec: number;
};

/// First-write-wins per (core, market, player, nonce): the unique index turns a replayed
/// or re-submitted signature into a no-op, reported honestly so the caller can tell a
/// fresh store from a duplicate. Addresses are lowercased at the door — the canonical
/// sort is numeric, and one casing per row keeps the unique index honest about identity.
export const insertPendingPick = async (db: Db, pick: PendingPickRow): Promise<"stored" | "duplicate"> => {
  const inserted = await db
    .insert(pendingPicks)
    .values({
      verifyingContract: pick.verifyingContract.toLowerCase(),
      marketId: pick.marketId.toString(),
      player: pick.player.toLowerCase(),
      nonce: pick.nonce,
      optionIndex: pick.optionIndex,
      stake: pick.stake,
      utcDay: pick.utcDay,
      stakedSoFarInDay: pick.stakedSoFarInDay,
      signature: pick.signature.toLowerCase(),
      receivedAtSec: pick.receivedAtSec,
    })
    .onConflictDoNothing()
    .returning({ id: pendingPicks.id });
  return inserted.length > 0 ? "stored" : "duplicate";
};

/// Every stored draft for one (core, market), as shared SignedPick values (bigint
/// marketId, typed hex). No ordering promise: canonicalization is pickset.ts's job.
export const listPendingPicks = async (
  db: Db,
  verifyingContract: string,
  marketId: bigint,
): Promise<SignedPick[]> => {
  const rows = await db
    .select()
    .from(pendingPicks)
    .where(
      and(
        eq(pendingPicks.verifyingContract, verifyingContract.toLowerCase()),
        eq(pendingPicks.marketId, marketId.toString()),
      ),
    );
  return rows.map((row) => ({
    player: row.player as `0x${string}`,
    marketId: BigInt(row.marketId),
    optionIndex: row.optionIndex,
    stake: row.stake,
    nonce: row.nonce,
    utcDay: row.utcDay,
    stakedSoFarInDay: row.stakedSoFarInDay,
    signature: row.signature as `0x${string}`,
  }));
};
