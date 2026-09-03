import { createDb, eq, markets, type Db } from "@proof-league/shared/db";

// Server-side class-1 reads (AD-8/AD-18): the web is a WINDOW on the projection, never a
// computer of outcomes. Absent DATABASE_URL (or any read failure) surfaces as an honest
// empty state upstream, never a fabricated market (FR-2). Server components only.

type Database = { db: Db; end: () => Promise<void> };
const globalRef = globalThis as { __plDb?: Database };

const dbOrUndefined = (): Db | undefined => {
  const url = process.env.DATABASE_URL;
  if (url === undefined) return undefined;
  globalRef.__plDb ??= createDb(url);
  return globalRef.__plDb.db;
};

export type FeaturedMarket = {
  readonly marketId: string;
  readonly leagueDay: number;
  readonly lockTime: number;
  readonly sourceWindowOpen: number;
  readonly voidDeadline: number;
  readonly state: "Created" | "Committed" | "Resolved" | "Voided";
  readonly payoutN: number;
};

/// The next market to lock, for the hero's live evidence slot. Scoped to the deployed
/// core once Story 5.4 records it; until then any projected core is real evidence of the
/// machine, clearly labelled by the caller.
export const nextMarketToLock = async (): Promise<FeaturedMarket | undefined> => {
  const db = dbOrUndefined();
  if (db === undefined) return undefined;
  try {
    const rows = await db
      .select({
        marketId: markets.marketId,
        leagueDay: markets.leagueDay,
        lockTime: markets.lockTime,
        sourceWindowOpen: markets.sourceWindowOpen,
        voidDeadline: markets.voidDeadline,
        state: markets.state,
        payoutN: markets.payoutN,
      })
      .from(markets)
      .where(eq(markets.state, "Created"))
      .orderBy(markets.lockTime)
      .limit(1);
    return rows[0];
  } catch {
    return undefined; // an unreachable projection is an empty state, never an error page
  }
};

/// The board's rows, newest lock first, capped; the Markets story adds real filters.
export const listBoardMarkets = async (): Promise<FeaturedMarket[]> => {
  const db = dbOrUndefined();
  if (db === undefined) return [];
  try {
    return await db
      .select({
        marketId: markets.marketId,
        leagueDay: markets.leagueDay,
        lockTime: markets.lockTime,
        sourceWindowOpen: markets.sourceWindowOpen,
        voidDeadline: markets.voidDeadline,
        state: markets.state,
        payoutN: markets.payoutN,
      })
      .from(markets)
      .orderBy(markets.lockTime)
      .limit(50);
  } catch {
    return [];
  }
};

export const marketCounts = async (): Promise<{ open: number; settled: number } | undefined> => {
  const db = dbOrUndefined();
  if (db === undefined) return undefined;
  try {
    const open = await db.select({ id: markets.marketId }).from(markets).where(eq(markets.state, "Created"));
    const settled = await db.select({ id: markets.marketId }).from(markets).where(eq(markets.state, "Resolved"));
    return { open: open.length, settled: settled.length };
  } catch {
    return undefined;
  }
};
