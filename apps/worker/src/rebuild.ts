import { scriptLogger } from "./logger.js";

const log = scriptLogger();
import { type Address } from "viem";
import { DEPLOYED, leagueCoreAbi, proofGatewayAbi, readEndpoints } from "@proof-league/chain";
import {
  buildPickSetDocument,
  compareStandings,
  CONTRACT_MARKET_STATES,
  PICK_DOMAIN_NAME,
  PICK_DOMAIN_VERSION,
  PICK_POINTS_DAILY,
  PICK_TYPES,
  pickSetSha256,
  serializePickSetDocument,
  verifySignedPick,
  type PickDomain,
} from "@proof-league/shared";
import { createDb, committedPicks, eq, markets, resolutions, scores, seasonStandings } from "@proof-league/shared/db";
import { join } from "node:path";
import { createPublicClient, http } from "viem";
import { creditCoin3Testnet } from "@proof-league/chain";
import { loadPickSet } from "./pickset/load.js";
import { readPicksetPublisherConfig } from "./pickset/publish.js";
import { readStateDir } from "./state.js";

// pnpm rebuild (Story 2.9, AD-8/AD-18): the proof that the database is just a cache of
// the chain. LIVE mode (a core + DATABASE_URL configured) reconstructs every class-1 row
// from chain events/views plus the published pick-set files — re-verifying every
// signature, the AD-15 budget invariant, and every sha/root binding on the way — and
// diffs the reconstruction against the projector's tables, exiting 1 on any mismatch.
// SELF-CHECK mode (no deployment configured — CI before Story 5.4) runs the same diff
// engine over synthetic truth and proves a mutation turns it red: the gate is exercised
// on every push from day one, and can demonstrably fail. Class-2 tables are structurally
// excluded — nothing here reads them.

const fail = (message: string): never => {
  log.error(`rebuild: ${message}`);
  process.exit(1);
};

// One canonical shape for "all class-1 truth": maps keyed by row identity, values
// JSON-comparable. Both the chain reconstruction and the database load produce this.
type Truth = Record<string, Record<string, unknown>>;
type TruthTables = {
  markets: Truth;
  committedPicks: Truth;
  resolutions: Truth;
  scores: Truth;
  standings: Truth;
};

const diffTruth = (expected: TruthTables, actual: TruthTables): string[] => {
  const diffs: string[] = [];
  for (const table of Object.keys(expected) as (keyof TruthTables)[]) {
    const exp = expected[table];
    const act = actual[table];
    for (const key of Object.keys(exp)) {
      if (!(key in act)) {
        diffs.push(`${table}[${key}]: reconstructed from chain but MISSING from the database`);
        continue;
      }
      const expJson = JSON.stringify(exp[key], Object.keys(exp[key] as object).sort());
      const actJson = JSON.stringify(act[key], Object.keys(exp[key] as object).sort());
      if (expJson !== actJson) diffs.push(`${table}[${key}]: chain says ${expJson} but database says ${actJson}`);
    }
    for (const key of Object.keys(act)) {
      if (!(key in exp)) diffs.push(`${table}[${key}]: in the database but NOT reconstructable from chain`);
    }
  }
  return diffs;
};

const SKIP_REASONS = ["OutOfOrder", "Superseded", "Tombstone", "ForeignMarket", "OverBudget"] as const;

/// The chain-side reconstruction: everything class-1, from public reads only.
const reconstruct = async (core: Address, mirrorDir: string, fromBlock: bigint): Promise<TruthTables> => {
  const endpoints = readEndpoints(process.env);
  const publicClient = createPublicClient({ chain: creditCoin3Testnet, transport: http(endpoints.CC3_RPC_URL) });
  const contract = { address: core, abi: leagueCoreAbi } as const;
  const domain: PickDomain = { chainId: creditCoin3Testnet.id, verifyingContract: core };
  const truth: TruthTables = { markets: {}, committedPicks: {}, resolutions: {}, scores: {}, standings: {} };

  const count = await publicClient.readContract({ ...contract, functionName: "marketCount" });
  for (let marketId = 1n; marketId <= count; marketId++) {
    const key = marketId.toString();
    const state = CONTRACT_MARKET_STATES[
      await publicClient.readContract({ ...contract, functionName: "stateOf", args: [marketId] })
    ];
    const config = await publicClient.readContract({ ...contract, functionName: "getMarketConfig", args: [marketId] });
    const sourceKey = await publicClient.readContract({ ...contract, functionName: "sourceKeyOf", args: [config] });
    const row: Record<string, unknown> = {
      sourceKey,
      sourceChainKey: config.sourceChainKey.toString(),
      emitter: config.emitter.toLowerCase(),
      eventSignature: config.eventSignature,
      subjectFilter: config.subjectFilter,
      decoderId: config.decoderId,
      payoutN: config.payoutN,
      leagueDay: config.leagueDay,
      lockTime: Number(config.lockTime),
      sourceWindowOpen: Number(config.sourceWindowOpen),
      voidDeadline: Number(config.voidDeadline),
      determinismHorizon: Number(config.determinismHorizon),
      boundaries: config.boundaries.map((b) => b.toString()),
      state,
      commitRoot: null as unknown,
      commitSha256: null as unknown,
      commitUri: null as unknown,
      committedAt: null as unknown,
    };
    if (state !== "Created") {
      try {
        const commitment = await publicClient.readContract({ ...contract, functionName: "getPickCommitment", args: [marketId] });
        row.commitRoot = commitment.root;
        row.commitSha256 = commitment.sha256Hash;
        row.commitUri = commitment.uri;
        row.committedAt = Number(commitment.committedAt);
        // The loader enforces sha(bytes) == on-chain sha and root re-derivation; rebuild
        // additionally re-verifies EVERY signature — the operator-cannot-invent-a-pick half.
        const set = await loadPickSet(domain, marketId, commitment, mirrorDir);
        for (const [leafIndex, pick] of set.picks.entries()) {
          if (!(await verifySignedPick(domain, pick))) {
            return fail(`market ${key} leaf ${leafIndex}: published signature does not verify`);
          }
          const docPick = set.doc.picks[leafIndex]!;
          truth.committedPicks[`${key}:${leafIndex}`] = {
            player: docPick.player,
            nonce: docPick.nonce,
            optionIndex: docPick.optionIndex,
            stake: docPick.stake,
            utcDay: docPick.utcDay,
            stakedSoFarInDay: docPick.stakedSoFarInDay,
            signature: docPick.signature,
          };
        }
      } catch (error) {
        if (!String(error).includes("NotCommitted")) throw error; // Created -> Voided has no commitment
      }
    }
    truth.markets[key] = row;
    if (state === "Resolved") {
      const resolution = await publicClient.readContract({ ...contract, functionName: "getResolution", args: [marketId] });
      truth.resolutions[key] = {
        value: resolution.value.toString(),
        occurredAt: Number(resolution.occurredAt),
        resolvedAt: Number(resolution.resolvedAt),
        winningOption: resolution.winningOption,
      };
    }
  }

  const toBlock = await publicClient.getBlockNumber();
  const shared = { ...contract, fromBlock, toBlock, strict: true } as const;
  const scoredLogs = await publicClient.getContractEvents({ ...shared, eventName: "PickScored" });
  const skippedLogs = await publicClient.getContractEvents({ ...shared, eventName: "PickSkipped" });
  const players = new Set<string>();
  const spentByPlayerDay = new Map<string, number>();
  const pointsByPlayer = new Map<string, bigint>();
  for (const logEntry of scoredLogs) {
    const player = logEntry.args.player.toLowerCase();
    players.add(player);
    truth.scores[`${logEntry.args.marketId}:${logEntry.args.leafIndex}`] = {
      player,
      outcome: "scored",
      correct: logEntry.args.correct,
      pointsAwarded: logEntry.args.pointsAwarded.toString(),
      utcDay: logEntry.args.utcDay,
      txHash: logEntry.transactionHash,
    };
    const dayKey = `${player}:${logEntry.args.utcDay}`;
    spentByPlayerDay.set(dayKey, (spentByPlayerDay.get(dayKey) ?? 0) + logEntry.args.stake);
    pointsByPlayer.set(player, (pointsByPlayer.get(player) ?? 0n) + logEntry.args.pointsAwarded);
  }
  for (const logEntry of skippedLogs) {
    const player = logEntry.args.player.toLowerCase();
    players.add(player);
    truth.scores[`${logEntry.args.marketId}:${logEntry.args.leafIndex}`] = {
      player,
      outcome: SKIP_REASONS[logEntry.args.reason] ?? "ForeignMarket",
      correct: null,
      pointsAwarded: null,
      utcDay: null,
      txHash: logEntry.transactionHash,
    };
  }
  // AD-15 re-verified: no player's SCORED stakes in one utcDay may exceed the allowance —
  // if over-staking ever paid, this is the line that goes red.
  for (const [dayKey, spent] of spentByPlayerDay) {
    if (spent > PICK_POINTS_DAILY) return fail(`AD-15 violated on-chain: ${dayKey} scored ${spent} points of stake`);
  }

  const standings = await Promise.all(
    [...players].map(async (player) => ({
      player,
      seasonPoints: await publicClient.readContract({ ...contract, functionName: "seasonPointsOf", args: [player as Address] }),
      streak: await publicClient.readContract({ ...contract, functionName: "streakOf", args: [player as Address] }),
      earliestCommitOrdinal: Number(
        await publicClient.readContract({ ...contract, functionName: "earliestCommitOrdinalOf", args: [player as Address] }),
      ),
    })),
  );
  // The event-fold must agree with the chain's own view before we trust either: a cache
  // can only be proven against a self-consistent truth.
  for (const s of standings) {
    const folded = pointsByPlayer.get(s.player) ?? 0n;
    if (folded !== s.seasonPoints) {
      return fail(`event fold says ${s.player} has ${folded} points but seasonPointsOf says ${s.seasonPoints}`);
    }
  }
  standings.sort(compareStandings).forEach((s, index) => {
    truth.standings[s.player] = {
      seasonPoints: s.seasonPoints.toString(),
      streak: s.streak,
      earliestCommitOrdinal: s.earliestCommitOrdinal,
      rank: index + 1,
    };
  });
  return truth;
};

/// The database side, loaded into the same canonical shape.
const loadProjection = async (databaseUrl: string, core: Address): Promise<TruthTables> => {
  const database = createDb(databaseUrl);
  const coreKey = core.toLowerCase();
  const truth: TruthTables = { markets: {}, committedPicks: {}, resolutions: {}, scores: {}, standings: {} };
  // Identity columns (core/marketId/leafIndex/player) stay on the rows: diffTruth
  // serializes with the CHAIN side's key list, so identity keys compare via the map key
  // and extra columns can never mask a truth mismatch.
  try {
    for (const row of await database.db.select().from(markets).where(eq(markets.core, coreKey))) {
      truth.markets[row.marketId] = row;
    }
    for (const row of await database.db.select().from(committedPicks).where(eq(committedPicks.core, coreKey))) {
      truth.committedPicks[`${row.marketId}:${row.leafIndex}`] = row;
    }
    for (const row of await database.db.select().from(resolutions).where(eq(resolutions.core, coreKey))) {
      truth.resolutions[row.marketId] = row;
    }
    for (const row of await database.db.select().from(scores).where(eq(scores.core, coreKey))) {
      truth.scores[`${row.marketId}:${row.leafIndex}`] = row;
    }
    for (const row of await database.db.select().from(seasonStandings).where(eq(seasonStandings.core, coreKey))) {
      truth.standings[row.player] = row;
    }
  } finally {
    await database.end();
  }
  return truth;
};

/// CI's hermetic gate: same engine, synthetic truth, and the mutation must go red.
const selfCheck = async (): Promise<void> => {
  const domain: PickDomain = { chainId: creditCoin3Testnet.id, verifyingContract: "0x1000000000000000000000000000000000000001" };
  const { privateKeyToAccount, generatePrivateKey } = await import("viem/accounts");
  const key = generatePrivateKey();
  const player = privateKeyToAccount(key).address;
  const account = privateKeyToAccount(key);
  const pick = { player, marketId: 1n, optionIndex: 0, stake: 10, nonce: 1, utcDay: 20700, stakedSoFarInDay: 0 };
  const signature = await account.signTypedData({
    // The one canonical domain and type set (pick.ts, AD-2) — never re-declared.
    domain: { name: PICK_DOMAIN_NAME, version: PICK_DOMAIN_VERSION, ...domain },
    types: PICK_TYPES,
    primaryType: "Pick",
    message: pick,
  });
  const doc = buildPickSetDocument(domain, 1n, [{ ...pick, signature }]);
  const sha = pickSetSha256(serializePickSetDocument(doc));
  const expected: TruthTables = {
    markets: { "1": { state: "Resolved", commitSha256: sha, leagueDay: 42 } },
    committedPicks: { "1:0": { ...doc.picks[0]! } },
    resolutions: { "1": { value: "5", winningOption: 0 } },
    scores: { "1:0": { player: player.toLowerCase(), outcome: "scored", pointsAwarded: "20" } },
    standings: { [player.toLowerCase()]: { seasonPoints: "20", streak: 1, rank: 1 } },
  };
  const clean = diffTruth(expected, structuredClone(expected));
  if (clean.length !== 0) return fail(`self-check: identical truth diffed dirty: ${clean[0]}`);
  const mutated = structuredClone(expected) as TruthTables;
  (mutated.scores["1:0"] as { pointsAwarded: string }).pointsAwarded = "9999";
  if (diffTruth(expected, mutated).length === 0) {
    return fail("self-check: a mutated score diffed CLEAN — the gate cannot go red");
  }
  const missing = structuredClone(expected) as TruthTables;
  delete missing.committedPicks["1:0"];
  if (diffTruth(expected, missing).length === 0) {
    return fail("self-check: a missing committed pick diffed CLEAN — the gate cannot go red");
  }
  log.info("rebuild: SELF-CHECK PASS — no deployment configured; the diff engine ran hermetically,");
  log.info("rebuild: identical truth diffs clean and mutations go red. Story 5.4 arms live mode.");
};

const main = async (): Promise<void> => {
  // REBUILD_CORE lets verify runs point at their fresh deployments; production uses the
  // configured gateway's own core.
  let core = process.env.REBUILD_CORE as Address | undefined;
  if (core === undefined && DEPLOYED.proofGateway !== undefined) {
    const endpoints = readEndpoints(process.env);
    const publicClient = createPublicClient({ chain: creditCoin3Testnet, transport: http(endpoints.CC3_RPC_URL) });
    core = await publicClient.readContract({ address: DEPLOYED.proofGateway, abi: proofGatewayAbi, functionName: "leagueCore" });
  }
  if (core === undefined) return selfCheck();

  const databaseUrl = process.env.DATABASE_URL ?? fail("live rebuild needs DATABASE_URL — there is no cache to diff without it");
  const stateDir = readStateDir(process.env);
  const mirrorDir = readPicksetPublisherConfig(process.env, join(stateDir, "rebuild")).mirrorDir;
  const fromBlock = BigInt(process.env.REBUILD_FROM_BLOCK ?? 0);
  log.info(`rebuild: LIVE — reconstructing core ${core} from chain + published pick-sets (logs from block ${fromBlock})`);
  const expected = await reconstruct(core, mirrorDir, fromBlock);
  const actual = await loadProjection(databaseUrl, core);
  const diffs = diffTruth(expected, actual);
  if (diffs.length > 0) {
    for (const diff of diffs) log.error(`rebuild: DIFF — ${diff}`);
    return fail(`${diffs.length} class-1 row(s) disagree with the chain — the cache is NOT the chain`);
  }
  const counts = Object.entries(expected)
    .map(([table, rows]) => `${table}=${Object.keys(rows).length}`)
    .join(" ");
  log.info(`rebuild: PASS — every class-1 row re-derived from chain + published pick-sets and diffed clean (${counts})`);
};

void main();
