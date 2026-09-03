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

export type SettledRecord = {
  readonly marketId: string;
  readonly value: string;
  readonly winningOption: number;
  readonly occurredAt: number;
  readonly resolvedAt: number;
  readonly proofTxHash: string | null;
  readonly payoutN: number;
  readonly boundaries: readonly string[];
};

/// The most recent proof-backed settlement, for the landing's exhibit. Returns nothing
/// when none exists yet, which is a structural empty state upstream and never a
/// fabricated one: the whole pitch is that this row is real (FR-2).
export const latestSettledRecord = async (): Promise<SettledRecord | undefined> => {
  const db = dbOrUndefined();
  const core = await coreAddress();
  if (db === undefined || core === undefined) return undefined;
  try {
    const rows = await db
      .select({
        marketId: resolutions.marketId,
        value: resolutions.value,
        winningOption: resolutions.winningOption,
        occurredAt: resolutions.occurredAt,
        resolvedAt: resolutions.resolvedAt,
        proofTxHash: resolutions.proofTxHash,
        payoutN: markets.payoutN,
        boundaries: markets.boundaries,
      })
      .from(resolutions)
      .innerJoin(markets, and(eq(markets.core, resolutions.core), eq(markets.marketId, resolutions.marketId)))
      .where(eq(resolutions.core, core.toLowerCase()))
      .orderBy(desc(resolutions.resolvedAt))
      .limit(1);
    return rows[0];
  } catch {
    return undefined;
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

export type MarketDetail = FeaturedMarket & {
  readonly sourceKey: string;
  readonly sourceChainKey: string;
  readonly emitter: string;
  readonly eventSignature: string;
  readonly subjectFilter: string;
  readonly decoderId: number;
  readonly boundaries: readonly string[];
  readonly commitRoot: string | null;
  readonly commitSha256: string | null;
  readonly commitUri: string | null;
  readonly committedAt: number | null;
  readonly resolution?: SettledRecord | undefined;
};

/// One market with everything needed to explain how it settles, plus its resolution when
/// it has one. Every field is a projection of chain state, so the page can show the
/// derivation without computing anything itself.
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
    return {
      ...row,
      resolution:
        resolution === undefined
          ? undefined
          : { ...resolution, payoutN: row.payoutN, boundaries: row.boundaries },
    };
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
