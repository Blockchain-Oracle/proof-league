import { createPublicClient, http, type Address } from "viem";
import { creditCoin3Testnet, DEPLOYED, proofGatewayAbi, readEndpoints } from "@proof-league/chain";
import { and, createDb, eq, markets, type Db } from "@proof-league/shared/db";

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

const dbOrUndefined = (): Db | undefined => {
  const url = process.env.DATABASE_URL;
  if (url === undefined) return undefined;
  globalRef.__plDb ??= createDb(url);
  return globalRef.__plDb.db;
};

/// The gateway deployed its own core, so the core is derived, never configured (the
/// wiring decision that makes the resolver unforgeable). Memoized per server process.
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

const MARKET_COLUMNS = {
  marketId: markets.marketId,
  leagueDay: markets.leagueDay,
  lockTime: markets.lockTime,
  sourceWindowOpen: markets.sourceWindowOpen,
  voidDeadline: markets.voidDeadline,
  state: markets.state,
  payoutN: markets.payoutN,
} as const;

export type FeaturedMarket = {
  readonly marketId: string;
  readonly leagueDay: number;
  readonly lockTime: number;
  readonly sourceWindowOpen: number;
  readonly voidDeadline: number;
  readonly state: "Created" | "Committed" | "Resolved" | "Voided";
  readonly payoutN: number;
};

/// The next market to lock, for the hero's live evidence slot.
export const nextMarketToLock = async (): Promise<FeaturedMarket | undefined> => {
  const db = dbOrUndefined();
  const core = await coreAddress();
  if (db === undefined || core === undefined) return undefined;
  try {
    const rows = await db
      .select(MARKET_COLUMNS)
      .from(markets)
      .where(and(eq(markets.core, core.toLowerCase()), eq(markets.state, "Created")))
      .orderBy(markets.lockTime)
      .limit(1);
    return rows[0];
  } catch {
    return undefined; // an unreachable projection is an empty state, never an error page
  }
};

/// The board's rows, earliest lock first, capped; the Markets story adds real filters.
export const listBoardMarkets = async (): Promise<FeaturedMarket[]> => {
  const db = dbOrUndefined();
  const core = await coreAddress();
  if (db === undefined || core === undefined) return [];
  try {
    return await db
      .select(MARKET_COLUMNS)
      .from(markets)
      .where(eq(markets.core, core.toLowerCase()))
      .orderBy(markets.lockTime)
      .limit(50);
  } catch {
    return [];
  }
};
