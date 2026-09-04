import { and, committedPicks, eq, sql, transparencyObservations } from "@proof-league/shared/db";
import { deployedCore, projectionDb, type TransparencyRow } from "./market-data.js";

// The table's own reads (design frame A: the seats arc and the settlement lamps), over the
// same connection and the same derived core as the board. Server Components only; a
// failed read is an empty arc or dark lamps, never an invented seat.

export type Seat = {
  readonly player: string;
  readonly optionIndex: number;
  readonly stake: number;
};

/// The seats around a Market: every player whose Call was committed at lock, folded to
/// the one Call the contract will score (latest nonce, zero stake is a cancellation).
/// Only committed picks are seats. Intake drafts are class 2 and private, so before lock
/// the arc shows empty seats and says when they fill, rather than naming who has drafted.
export const seatsFor = async (marketId: string, optionCount: number): Promise<Seat[]> => {
  const db = projectionDb();
  const core = await deployedCore();
  if (db === undefined || core === undefined) return [];
  try {
    const rows = await db
      .select({
        marketId: committedPicks.marketId,
        player: committedPicks.player,
        nonce: committedPicks.nonce,
        optionIndex: committedPicks.optionIndex,
        stake: committedPicks.stake,
      })
      .from(committedPicks)
      .where(and(eq(committedPicks.core, core.toLowerCase()), eq(committedPicks.marketId, marketId)));
    // The same fold as shared effectivePickCounts (latest nonce wins per player, a zero
    // stake is a cancellation, an out-of-range option is dropped), kept per seat instead of
    // per option because the arc needs who sat where, not how many sat there.
    const latest = new Map<string, (typeof rows)[number]>();
    for (const row of rows) {
      const key = row.player.toLowerCase();
      const held = latest.get(key);
      if (held === undefined || row.nonce > held.nonce) latest.set(key, row);
    }
    return [...latest.values()]
      .filter((row) => row.stake > 0 && row.optionIndex >= 0 && row.optionIndex < optionCount)
      .map((row) => ({ player: row.player, optionIndex: row.optionIndex, stake: row.stake }));
  } catch {
    return [];
  }
};

/// The worker's phase log for one Market: the rows whose market_ids contain it, on its own
/// source key (the log is not core-scoped and market ids restart per deployment, so the
/// key pairing is what keeps a verify run's rows off a product card). Oldest first, so the
/// lamps light in the order the pipeline lit them.
export const phaseRowsFor = async (marketId: string, sourceKey: string): Promise<TransparencyRow[]> => {
  const db = projectionDb();
  if (db === undefined) return [];
  try {
    return await db
      .select()
      .from(transparencyObservations)
      .where(
        and(
          eq(transparencyObservations.sourceKey, sourceKey),
          sql`${transparencyObservations.marketIds} @> ${JSON.stringify([marketId])}::jsonb`,
        ),
      )
      .orderBy(transparencyObservations.id);
  } catch {
    return [];
  }
};

/// The three lamps, derived from the phase log. A lamp is lit only by a row of its phase;
/// "attested" rows are the worker's own account (observed), "proven" rows carry a
/// Creditcoin transaction, and the sub-line keeps that difference visible.
export type Lamp = {
  readonly name: "EVENT SEEN" | "ATTESTED" | "PROVEN";
  readonly lit: boolean;
  readonly txHash: string | null;
  readonly atSec: number | undefined;
  readonly evidence: "observed" | "proven" | undefined;
};

/// A resolution is class-1 truth and outranks the log: once the chain holds the proof, all
/// three lamps are lit whatever the worker wrote down on the way, and PROVEN carries the
/// Creditcoin transaction the resolution recorded.
export const lampsOf = (
  rows: readonly TransparencyRow[],
  resolution?: { readonly occurredAt: number; readonly resolvedAt: number; readonly proofTxHash: string | null },
): Lamp[] => {
  const first = (phase: TransparencyRow["phase"]) => rows.find((row) => row.phase === phase);
  const event = first("event");
  const attested = first("attested");
  const proven = first("proven");
  const lamp = (name: Lamp["name"], row: TransparencyRow | undefined, fallback?: Partial<Lamp>): Lamp => ({
    name,
    lit: row !== undefined || fallback !== undefined,
    txHash: row?.txHash ?? fallback?.txHash ?? null,
    atSec: row?.atSec ?? fallback?.atSec,
    evidence: row?.evidenceClass ?? fallback?.evidence,
  });
  const settled = resolution === undefined ? undefined : resolution;
  return [
    lamp("EVENT SEEN", event, settled === undefined ? undefined : { atSec: settled.occurredAt, evidence: "proven" }),
    lamp("ATTESTED", attested, settled === undefined ? undefined : { atSec: settled.resolvedAt, evidence: "proven" }),
    lamp("PROVEN", proven, settled === undefined ? undefined : { atSec: settled.resolvedAt, txHash: settled.proofTxHash, evidence: "proven" }),
  ];
};
