import type { Address, Hex } from "viem";
import { leagueCoreAbi } from "@proof-league/chain";
import { compareStandings, CONTRACT_MARKET_STATES, type PickDomain } from "@proof-league/shared";
import {
  and,
  committedPicks,
  eq,
  markets,
  resolutions,
  scores,
  seasonStandings,
  type Db,
} from "@proof-league/shared/db";
import { logger } from "./logger.js";
import type { Cc3Clients } from "./cc3.js";
import type { ProjectorCursor } from "./state.js";
import { loadPickSet } from "./pickset/load.js";

// Story 2.9's projector (AD-8/FR-15): the SOLE writer of class-1 rows, and every row is a
// read of the chain — configs and states from views, committed picks from the published
// file the chain pinned, scores from the PickScored/PickSkipped events. One chain scoring
// transaction lands as ONE Postgres transaction (scores + streak + rank together), and
// each player-scored outcome is exactly one insert into `scores` — which IS the one
// realtime event (the table rides the supabase_realtime publication). Everything here is
// idempotent: the cursor only saves re-reads, never correctness.

const SKIP_REASONS = ["OutOfOrder", "Superseded", "Tombstone", "ForeignMarket", "OverBudget"] as const;

export type ProjectorContext = {
  readonly core: Address;
  readonly clients: Cc3Clients;
  readonly db: Db;
  readonly mirrorDir: string;
  readonly cursor: ProjectorCursor;
  // Where the scoring-log scan starts on first boot (a deployment block when known);
  // afterwards the cursor owns it.
  readonly initialScanBlock?: number | undefined;
};

export type ProjectorRoundReport = {
  readonly marketsProjected: number;
  readonly scoreEventsApplied: number;
  readonly scoringTxApplied: number;
};

type ScoreEvent = {
  readonly txHash: Hex;
  readonly blockNumber: bigint;
  readonly logIndex: number;
  readonly marketId: bigint;
  readonly leafIndex: number;
  readonly player: Address;
  readonly outcome: (typeof SKIP_REASONS)[number] | "scored";
  readonly correct?: boolean;
  readonly pointsAwarded?: bigint;
  readonly utcDay?: number;
};

/// Config/state/commitment/resolution sync. Per market the cursor holds the last state
/// already projected; "final" (Voided, or Resolved once fully scored) ends its reads.
const projectMarkets = async (ctx: ProjectorContext, domain: PickDomain): Promise<number> => {
  const { publicClient } = ctx.clients;
  const contract = { address: ctx.core, abi: leagueCoreAbi } as const;
  const coreKey = ctx.core.toLowerCase();
  const count = await publicClient.readContract({ ...contract, functionName: "marketCount" });
  let projected = 0;

  for (let marketId = 1n; marketId <= count; marketId++) {
    const key = marketId.toString();
    const known = ctx.cursor.markets[key];
    if (known === "final") continue;
    const state = CONTRACT_MARKET_STATES[
      await publicClient.readContract({ ...contract, functionName: "stateOf", args: [marketId] })
    ];
    if (state === undefined) continue;

    if (known === undefined) {
      const config = await publicClient.readContract({ ...contract, functionName: "getMarketConfig", args: [marketId] });
      const sourceKey = await publicClient.readContract({ ...contract, functionName: "sourceKeyOf", args: [config] });
      await ctx.db
        .insert(markets)
        .values({
          core: coreKey,
          marketId: key,
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
        })
        .onConflictDoUpdate({ target: [markets.core, markets.marketId], set: { state } });
    } else if (known !== state) {
      await ctx.db
        .update(markets)
        .set({ state })
        .where(and(eq(markets.core, coreKey), eq(markets.marketId, key)));
    }

    // The commitment appears exactly once, on the Created -> Committed edge (readable
    // forever after, even under later terminal states).
    if (state !== "Created" && (known === undefined || known === "Created")) {
      try {
        const commitment = await publicClient.readContract({
          ...contract,
          functionName: "getPickCommitment",
          args: [marketId],
        });
        const set = await loadPickSet(domain, marketId, commitment, ctx.mirrorDir);
        if (set.picks.length > 0) {
          await ctx.db
            .insert(committedPicks)
            .values(
              set.doc.picks.map((pick, leafIndex) => ({
                core: coreKey,
                marketId: key,
                leafIndex,
                player: pick.player,
                nonce: pick.nonce,
                optionIndex: pick.optionIndex,
                stake: pick.stake,
                utcDay: pick.utcDay,
                stakedSoFarInDay: pick.stakedSoFarInDay,
                signature: pick.signature,
              })),
            )
            .onConflictDoNothing();
        }
        await ctx.db
          .update(markets)
          .set({
            commitRoot: commitment.root,
            commitSha256: commitment.sha256Hash,
            commitUri: commitment.uri,
            committedAt: Number(commitment.committedAt),
          })
          .where(and(eq(markets.core, coreKey), eq(markets.marketId, key)));
      } catch (error) {
        // A market voided from Created has no commitment — the honest non-row. Any other
        // failure (unreachable pick-set) retries next round because the cursor won't move.
        if (!String(error).includes("NotCommitted")) throw error;
      }
    }

    if (state === "Resolved" && known !== "Resolved") {
      const resolution = await publicClient.readContract({ ...contract, functionName: "getResolution", args: [marketId] });
      await ctx.db
        .insert(resolutions)
        .values({
          core: coreKey,
          marketId: key,
          value: resolution.value.toString(),
          occurredAt: Number(resolution.occurredAt),
          resolvedAt: Number(resolution.resolvedAt),
          winningOption: resolution.winningOption,
        })
        .onConflictDoNothing();
    }

    let next: ProjectorCursor["markets"][string] = state;
    if (state === "Voided") next = "final";
    if (state === "Resolved") {
      const [, fullyScored] = await publicClient.readContract({
        ...contract,
        functionName: "scoringProgressOf",
        args: [marketId],
      });
      if (fullyScored) next = "final"; // scores flow through the log scan, cursor-independent
    }
    if (next !== known) projected += 1;
    ctx.cursor.markets[key] = next;
  }
  return projected;
};

/// One chain scoring tx -> one Postgres transaction: the score rows, the touched players'
/// points/streak/tie-break from the chain's own views, and the re-ranked leaderboard all
/// commit together (the AC's "score/streak/rank land in a single Postgres transaction").
const applyScoringTx = async (ctx: ProjectorContext, txHash: Hex, events: readonly ScoreEvent[]): Promise<void> => {
  const { publicClient } = ctx.clients;
  const contract = { address: ctx.core, abi: leagueCoreAbi } as const;
  const coreKey = ctx.core.toLowerCase();
  const players = [...new Set(events.map((e) => e.player.toLowerCase()))];
  const standings = await Promise.all(
    players.map(async (player) => ({
      player,
      seasonPoints: await publicClient.readContract({ ...contract, functionName: "seasonPointsOf", args: [player as Address] }),
      streak: await publicClient.readContract({ ...contract, functionName: "streakOf", args: [player as Address] }),
      earliestCommitOrdinal: await publicClient.readContract({
        ...contract,
        functionName: "earliestCommitOrdinalOf",
        args: [player as Address],
      }),
    })),
  );

  await ctx.db.transaction(async (tx) => {
    await tx
      .insert(scores)
      .values(
        events.map((e) => ({
          core: coreKey,
          marketId: e.marketId.toString(),
          leafIndex: e.leafIndex,
          player: e.player.toLowerCase(),
          outcome: e.outcome,
          correct: e.correct ?? null,
          pointsAwarded: e.pointsAwarded?.toString() ?? null,
          utcDay: e.utcDay ?? null,
          txHash,
        })),
      )
      .onConflictDoNothing();
    for (const standing of standings) {
      await tx
        .insert(seasonStandings)
        .values({
          core: coreKey,
          player: standing.player,
          seasonPoints: standing.seasonPoints.toString(),
          streak: standing.streak,
          earliestCommitOrdinal: Number(standing.earliestCommitOrdinal),
          rank: 0, // re-ranked below inside this same transaction
        })
        .onConflictDoUpdate({
          target: [seasonStandings.core, seasonStandings.player],
          set: {
            seasonPoints: standing.seasonPoints.toString(),
            streak: standing.streak,
            earliestCommitOrdinal: Number(standing.earliestCommitOrdinal),
          },
        });
    }
    const rows = await tx.select().from(seasonStandings).where(eq(seasonStandings.core, coreKey));
    const ranked = rows
      .map((row) => ({ ...row, seasonPointsBig: BigInt(row.seasonPoints) }))
      .sort((a, b) =>
        compareStandings(
          { player: a.player, seasonPoints: a.seasonPointsBig, streak: a.streak, earliestCommitOrdinal: a.earliestCommitOrdinal },
          { player: b.player, seasonPoints: b.seasonPointsBig, streak: b.streak, earliestCommitOrdinal: b.earliestCommitOrdinal },
        ),
      );
    for (const [index, row] of ranked.entries()) {
      if (row.rank !== index + 1) {
        await tx
          .update(seasonStandings)
          .set({ rank: index + 1 })
          .where(and(eq(seasonStandings.core, coreKey), eq(seasonStandings.player, row.player)));
      }
    }
  });
};

const projectScores = async (ctx: ProjectorContext): Promise<{ events: number; txs: number }> => {
  const { publicClient } = ctx.clients;
  const latest = await publicClient.getBlockNumber();
  const fromBlock = BigInt(ctx.cursor.scanFromBlock ?? ctx.initialScanBlock ?? 0);
  if (latest < fromBlock) return { events: 0, txs: 0 };
  const shared = { address: ctx.core, abi: leagueCoreAbi, fromBlock, toBlock: latest, strict: true } as const;
  const scored = await publicClient.getContractEvents({ ...shared, eventName: "PickScored" });
  const skipped = await publicClient.getContractEvents({ ...shared, eventName: "PickSkipped" });
  const events: ScoreEvent[] = [
    ...scored.map((log) => ({
      txHash: log.transactionHash,
      blockNumber: log.blockNumber,
      logIndex: log.logIndex,
      marketId: log.args.marketId,
      leafIndex: Number(log.args.leafIndex),
      player: log.args.player,
      outcome: "scored" as const,
      correct: log.args.correct,
      pointsAwarded: log.args.pointsAwarded,
      utcDay: log.args.utcDay,
    })),
    ...skipped.map((log) => ({
      txHash: log.transactionHash,
      blockNumber: log.blockNumber,
      logIndex: log.logIndex,
      marketId: log.args.marketId,
      leafIndex: Number(log.args.leafIndex),
      player: log.args.player,
      outcome: SKIP_REASONS[log.args.reason] ?? ("ForeignMarket" as const),
    })),
  ].sort((a, b) => Number(a.blockNumber - b.blockNumber) || a.logIndex - b.logIndex);

  // Group by transaction, preserving chain order: the tx is the settlement unit.
  const byTx = new Map<Hex, ScoreEvent[]>();
  for (const event of events) {
    const group = byTx.get(event.txHash) ?? [];
    group.push(event);
    byTx.set(event.txHash, group);
  }
  for (const [txHash, group] of byTx) {
    await applyScoringTx(ctx, txHash, group);
  }
  ctx.cursor.scanFromBlock = Number(latest) + 1;
  return { events: events.length, txs: byTx.size };
};

export const runProjectorRound = async (ctx: ProjectorContext): Promise<ProjectorRoundReport> => {
  const domain: PickDomain = { chainId: ctx.clients.publicClient.chain.id, verifyingContract: ctx.core };
  const marketsProjected = await projectMarkets(ctx, domain);
  const { events, txs } = await projectScores(ctx);
  if (marketsProjected > 0 || events > 0) {
    logger.info(`[worker] projector: ${marketsProjected} market update(s), ${events} score event(s) in ${txs} tx(s)`);
  }
  return { marketsProjected, scoreEventsApplied: events, scoringTxApplied: txs };
};
