import { createPublicClient, http, type Address } from "viem";
import { creditCoin3Testnet, DEPLOYED, proofGatewayAbi, readEndpoints } from "@proof-league/chain";
import { and, createDb, desc, eq, markets, resolutions, transparencyObservations, type Db } from "@proof-league/shared/db";

// Server-side class-1 reads (AD-8/AD-18): the web is a WINDOW on the projection, never a
// computer of outcomes. Absent DATABASE_URL (or any read failure) surfaces as an honest
// empty state upstream, never a fabricated market (FR-2). Server components only.
//
// Every read is scoped to the DEPLOYED league's core. The projection also holds rows from
// the throwaway cores that verify:* runs deploy, and rendering those as the product would
// be showing judges a test fixture — so an unresolvable core yields an empty product
// rather than someone else's markets.

type Database = { db: Db; end: () => Promise<void> };
const globalRef = globalThis as { __plDb?: Database; __plCore?: Promise<Address | undefined> };

/// Exported so the board module can compose its own reads over the SAME connection and
/// the same derived core. A second opener would be a second answer to "which league is
/// this", which is the one question every read here is scoped by.
export const projectionDb = (): Db | undefined => dbOrUndefined();

const dbOrUndefined = (): Db | undefined => {
  const url = process.env.DATABASE_URL;
  if (url === undefined) return undefined;
  globalRef.__plDb ??= createDb(url);
  return globalRef.__plDb.db;
};

/// The gateway deployed its own core, so the core is derived, never configured (the
/// wiring decision that makes the resolver unforgeable). Memoized per server process.
export const deployedCore = async (): Promise<Address | undefined> => coreAddress();

const coreAddress = async (): Promise<Address | undefined> => {
  const gateway = DEPLOYED.proofGateway;
  if (gateway === undefined) return undefined;
  globalRef.__plCore ??= (async () => {
    try {
      const client = createPublicClient({
        chain: creditCoin3Testnet,
        transport: http(readEndpoints(process.env).CC3_RPC_URL),
      });
      return await client.readContract({ address: gateway, abi: proofGatewayAbi, functionName: "leagueCore" });
    } catch {
      return undefined;
    }
  })();
  return globalRef.__plCore;
};

// The board's own reads live in market-board.ts, which composes these helpers with the
// canonical view model. This file stays what it says it is: scoped class-1 reads.

/// One market with every field needed to explain how it settles, plus its resolution when
/// it has one. The whole row travels: the detail page shows the source identity and the
/// commitment, and `marketViewOf` reads the rest, so both halves of that page come from
/// one read of one row.
export type MarketDetail = typeof markets.$inferSelect & {
  readonly resolution: typeof resolutions.$inferSelect | undefined;
};

export const marketDetail = async (marketId: string): Promise<MarketDetail | undefined> => {
  const db = dbOrUndefined();
  const core = await coreAddress();
  if (db === undefined || core === undefined) return undefined;
  if (!/^[0-9]+$/.test(marketId)) return undefined;
  try {
    const [row] = await db
      .select()
      .from(markets)
      .where(and(eq(markets.core, core.toLowerCase()), eq(markets.marketId, marketId)))
      .limit(1);
    if (row === undefined) return undefined;
    const [resolution] = await db
      .select()
      .from(resolutions)
      .where(and(eq(resolutions.core, core.toLowerCase()), eq(resolutions.marketId, marketId)))
      .limit(1);
    return { ...row, resolution };
  } catch {
    return undefined;
  }
};

export type TransparencyRow = {
  readonly id: number;
  readonly atSec: number;
  readonly sourceKey: string;
  readonly marketIds: readonly string[];
  readonly phase: "event" | "attested" | "proven" | "note";
  readonly evidenceClass: "observed" | "proven";
  readonly txHash: string | null;
  readonly overCliff: boolean | null;
  readonly note: string | null;
};

/// The worker's phase log (class 2, AD-18). These are OBSERVATIONS, not truth: the page
/// labels them as such, and the only rows that carry proof are the ones whose Creditcoin
/// transaction is right there to check. Not scoped by core because the log is keyed by
/// source key rather than by deployment; the page says which markets each row is about.
export const transparencyLog = async (limit = 60): Promise<TransparencyRow[]> => {
  const db = dbOrUndefined();
  if (db === undefined) return [];
  try {
    return await db.select().from(transparencyObservations).orderBy(desc(transparencyObservations.id)).limit(limit);
  } catch {
    return [];
  }
};
