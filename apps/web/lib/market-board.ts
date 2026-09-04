import { effectivePickCounts } from "@proof-league/shared";
import {
  and,
  committedPicks,
  eq,
  inArray,
  markets,
  pendingPicks,
  resolutions,
  type Db,
} from "@proof-league/shared/db";
import { deployedCore, projectionDb } from "./market-data.js";
import { marketViewOf, type MarketPickCounts, type MarketView } from "./market-view.js";

// The board's one read (Story 3.4): markets, their resolutions and their pick
// distributions, assembled into canonical views. Every Markets surface calls this and
// filters the result, so Featured, Today, Upcoming and Settled are four views of one
// query rather than four queries that can disagree about the same Market.
//
// Server Components only. Any read failure is an empty board, never an error page and
// never a placeholder Market (FR-2).

const BOARD_LIMIT = 60;

/// Distribution over the population that actually exists at this point in a Market's
/// life (AD-18's two classes). Once a set is committed the published document is the
/// truth and the class-1 leaves are counted; before that only the intake drafts exist,
/// which are class 2 and labelled as observations wherever they render. Both are folded
/// through the shared `effectivePickCounts`, so what is shown is the position the
/// contract would score, not a leaf tally.
const pickCountsFor = async (
  db: Db,
  core: string,
  rows: readonly { marketId: string; payoutN: number; committedAt: number | null }[],
): Promise<Map<string, MarketPickCounts>> => {
  const counts = new Map<string, MarketPickCounts>();
  if (rows.length === 0) return counts;
  const committedIds = rows.filter((row) => row.committedAt !== null).map((row) => row.marketId);
  const openIds = rows.filter((row) => row.committedAt === null).map((row) => row.marketId);
  const optionCountOf = new Map(rows.map((row) => [row.marketId, row.payoutN]));

  const fold = (
    kind: "committed" | "intake",
    picks: readonly { marketId: string; player: string; nonce: number; optionIndex: number; stake: number }[],
  ): void => {
    const byMarket = new Map<string, typeof picks[number][]>();
    for (const pick of picks) {
      const held = byMarket.get(pick.marketId) ?? [];
      held.push(pick);
      byMarket.set(pick.marketId, held);
    }
    for (const [marketId, marketPicks] of byMarket) {
      const { byOption } = effectivePickCounts(marketPicks, optionCountOf.get(marketId) ?? 0);
      counts.set(marketId, { kind, byOption });
    }
  };

  if (committedIds.length > 0) {
    fold(
      "committed",
      await db
        .select({
          marketId: committedPicks.marketId,
          player: committedPicks.player,
          nonce: committedPicks.nonce,
          optionIndex: committedPicks.optionIndex,
          stake: committedPicks.stake,
        })
        .from(committedPicks)
        .where(and(eq(committedPicks.core, core), inArray(committedPicks.marketId, committedIds))),
    );
  }
  if (openIds.length > 0) {
    // Intake is scoped by the EIP-712 verifying contract, which is the core: market ids
    // restart at 1 on every deployment, so an unscoped read would mix in another league's
    // drafts (the same reason every class-1 read here is core-scoped).
    fold(
      "intake",
      await db
        .select({
          marketId: pendingPicks.marketId,
          player: pendingPicks.player,
          nonce: pendingPicks.nonce,
          optionIndex: pendingPicks.optionIndex,
          stake: pendingPicks.stake,
        })
        .from(pendingPicks)
        .where(and(eq(pendingPicks.verifyingContract, core), inArray(pendingPicks.marketId, openIds))),
    );
  }
  return counts;
};

/// The same distribution fold for one Market, so the detail page shows the real spread the
/// board shows rather than an empty one. Undefined means the projection could not be read;
/// the caller renders the Market without a distribution rather than an invented zero.
export const marketPickCounts = async (
  marketId: string,
  payoutN: number,
  committedAt: number | null,
): Promise<MarketPickCounts | undefined> => {
  const db = projectionDb();
  const core = await deployedCore();
  if (db === undefined || core === undefined) return undefined;
  try {
    const counts = await pickCountsFor(db, core.toLowerCase(), [{ marketId, payoutN, committedAt }]);
    return counts.get(marketId);
  } catch {
    return undefined;
  }
};

export const boardMarketViews = async (nowSec: number): Promise<MarketView[]> => {
  const db = projectionDb();
  const core = await deployedCore();
  if (db === undefined || core === undefined) return [];
  const scoped = core.toLowerCase();
  try {
    const rows = await db
      .select()
      .from(markets)
      .where(eq(markets.core, scoped))
      .orderBy(markets.lockTime)
      .limit(BOARD_LIMIT);
    if (rows.length === 0) return [];
    const ids = rows.map((row) => row.marketId);
    const [settled, counts] = await Promise.all([
      db
        .select()
        .from(resolutions)
        .where(and(eq(resolutions.core, scoped), inArray(resolutions.marketId, ids))),
      pickCountsFor(db, scoped, rows),
    ]);
    const settledBy = new Map(settled.map((row) => [row.marketId, row]));
    return rows.map((row) => marketViewOf(row, nowSec, settledBy.get(row.marketId), counts.get(row.marketId)));
  } catch {
    return []; // an unreachable projection is an empty board, never an error page
  }
};
