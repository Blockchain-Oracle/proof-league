import { logger } from "./logger.js";
import { DEPLOYED, proofGatewayAbi, readEndpoints } from "@proof-league/chain";
import { createDb } from "@proof-league/shared/db";
import { cc3Clients, readWorkerAccounts, readWorkerKey } from "./cc3.js";
import { startLoop } from "./loop.js";
import { startHealthServer } from "./health.js";
import { runCommitRound } from "./commit-round.js";
import { runSchedulerRound } from "./scheduler-round.js";
import { runScoringRound } from "./scoring-round.js";
import { runProjectorRound } from "./projector-round.js";
import { runVoidRound } from "./void-round.js";
import { runSeasonRound } from "./season-round.js";
import { runSettlementRound } from "./pipeline/settlement-round.js";
import type { SettlementContext } from "./pipeline/types.js";
import { FileTransparencyProjection, PostgresTransparencyProjection } from "./pipeline/project.js";
import { PickSetPublisher, readPicksetPublisherConfig } from "./pickset/publish.js";
import { resolveSources } from "./sources.js";
import { StateStore, readStateDir } from "./state.js";

// Boot validates config before anything runs (CONVENTIONS §9): a misconfigured worker must
// refuse to start, not settle against the wrong endpoints.
const endpoints = readEndpoints(process.env);
const HEALTH_PORT = Number(process.env.PORT ?? 8080);

startHealthServer(HEALTH_PORT);

const gateway = DEPLOYED.proofGateway;
if (gateway === undefined) {
  // No deployment yet (Story 5.4 fills packages/chain/src/contracts.ts): nothing exists
  // to settle, void or pay out, so the loop only proves liveness and performs no chain writes.
  startLoop(async () => {});
  logger.info(`[worker] up, no deployed gateway yet. cc3=${endpoints.CC3_RPC_URL} health=:${HEALTH_PORT}`);
} else {
  // The key is required the moment a deployment is configured — validated at boot, §9.
  const clients = cc3Clients(endpoints.CC3_RPC_URL, readWorkerKey(process.env));
  // The gateway is the one configured address [decision 2026-09-03]: it deployed its own
  // core, so deriving leagueCore() here is what makes the resolver wiring unforgeable.
  const core = await clients.publicClient.readContract({
    address: gateway,
    abi: proofGatewayAbi,
    functionName: "leagueCore",
  });
  const store = new StateStore(readStateDir(process.env));
  // The transparency projection prefers the database whenever one is configured (the
  // local Supabase stack in dev, the hosted project in prod — Abu 2026-09-03); the JSONL
  // file remains the honest degraded mode, and the boot line says which one is live.
  // One Db handle serves both duties that touch it: transparency writes and intake reads.
  const databaseUrl = process.env.DATABASE_URL;
  const database = databaseUrl !== undefined ? createDb(databaseUrl) : undefined;
  const projection =
    database !== undefined
      ? new PostgresTransparencyProjection(database.db, store.dir)
      : new FileTransparencyProjection(store.dir);
  const publisherConfig = readPicksetPublisherConfig(process.env, store.dir);
  const publisher = new PickSetPublisher(publisherConfig);
  logger.info(
    `[worker] transparency projection: ${database !== undefined ? "postgres" : "jsonl file"}; pickset storage: ${publisher.storageConfigured ? "supabase+mirror" : "mirror only"}`,
  );
  const ctx: SettlementContext = {
    gateway,
    core,
    clients,
    sources: await resolveSources(endpoints),
    store,
    projection,
    proverUrl: endpoints.PROVER_URL,
    accounts: readWorkerAccounts(process.env),
    webhookUrl: process.env.OPERATOR_WEBHOOK_URL,
  };
  startLoop(async () => {
    // The duties run sequentially (they share one signing account — parallel writes
    // would race nonces), each isolated so one failing duty never starves the others.
    // Scheduler first (creation precedes commitment), then commit (a market must be
    // Committed before its event fires — AD-14), then the settlement machine.
    try {
      const scheduled = await runSchedulerRound(core, clients, store);
      if (scheduled.minted.length > 0) {
        logger.info(`[worker] scheduler minted: ${scheduled.minted.map((m) => `${m.seriesId}->${m.marketId}`).join(", ")}`);
      }
    } catch (error) {
      logger.error({ err: error }, "[worker] scheduler round failed");
    }
    try {
      const commits = await runCommitRound({ core, clients, db: database?.db, publisher, projection });
      if (commits.committed.length > 0) {
        logger.info(`[worker] committed pick-sets for markets: ${commits.committed.join(", ")}`);
      }
    } catch (error) {
      logger.error({ err: error }, "[worker] commit round failed");
    }
    try {
      const settlement = await runSettlementRound(ctx);
      if (settlement.settledKeys.length > 0) {
        logger.info(`[worker] settled sourceKeys: ${settlement.settledKeys.join(", ")}`);
      }
      if (settlement.stuckKeys.length > 0) {
        logger.info(`[worker] stuck sourceKeys (honest reasons in transparency log): ${settlement.stuckKeys.join(", ")}`);
      }
    } catch (error) {
      logger.error({ err: error }, "[worker] settlement round failed");
    }
    try {
      // Story 2.9's scoring duty: scoreBatch is permissionless but somebody must feed
      // it — Resolved markets walk to fully-scored from the published set.
      const scoring = await runScoringRound(core, clients, publisherConfig.mirrorDir);
      if (scoring.completed.length > 0) {
        logger.info(`[worker] fully scored markets: ${scoring.completed.join(", ")}`);
      }
    } catch (error) {
      logger.error({ err: error }, "[worker] scoring round failed");
    }
    try {
      // Story 2.6: the AD-19 void duty — also the unblocker the season's all-terminal
      // gate leans on.
      const voids = await runVoidRound(core, clients);
      if (voids.voided.length > 0) {
        logger.info(`[worker] voided markets past deadline: ${voids.voided.join(", ")}`);
      }
    } catch (error) {
      logger.error({ err: error }, "[worker] void round failed");
    }
    try {
      const season = await runSeasonRound(core, clients, store, process.env.OPERATOR_WEBHOOK_URL);
      if (season.status !== "idle" && season.status !== "waiting") {
        logger.info(`[worker] season: ${season.status} ${season.detail ?? ""}`);
      }
    } catch (error) {
      logger.error({ err: error }, "[worker] season round failed");
    }
    if (database !== undefined) {
      try {
        // Story 2.9's projector, LAST so it sees this round's own chain writes: class-1
        // rows from chain views + published pick-sets, one Postgres tx per scoring tx.
        await runProjectorRound({
          core,
          clients,
          db: database.db,
          mirrorDir: publisherConfig.mirrorDir,
          cursor: store.projectorOf(core.toLowerCase()),
          // Without this the first scan asks for every log since genesis and the public
          // RPC times out, so the projector never gets past its first round. The
          // deployment block is recorded for exactly this reason.
          initialScanBlock: DEPLOYED.deployBlock,
        });
      } catch (error) {
        logger.error({ err: error }, "[worker] projector round failed");
      }
    }
    store.save();
  });
  logger.info(`[worker] up. gateway=${gateway} core=${core} cc3=${endpoints.CC3_RPC_URL} health=:${HEALTH_PORT}`);
}
