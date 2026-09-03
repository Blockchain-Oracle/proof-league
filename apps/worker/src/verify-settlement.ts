import { scriptLogger } from "./logger.js";

const log = scriptLogger();
import { join } from "node:path";
import { createWalletClient, http, keccak256, numberToHex, parseEventLogs, stringToHex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import {
  DEPLOYED,
  contestSourceAbi,
  leagueCoreAbi,
  proofGatewayAbi,
  readEndpoints,
  sepolia,
} from "@proof-league/chain";
import {
  CONTRACT_MARKET_STATES,
  MIN_COMMIT_MARGIN_SEC,
  SETTLEMENT_COST_CLIFF_SEC,
  expectedSettlementSecOf,
  utcDayOf,
} from "@proof-league/shared";
import { cc3Clients, readWorkerKey, type Cc3Clients } from "./cc3.js";
import { FileTransparencyProjection } from "./pipeline/project.js";
import { commitEmptyPickSet } from "./pickset/empty-set.js";
import { PickSetPublisher, readPicksetPublisherConfig } from "./pickset/publish.js";
import { runSettlementRound } from "./pipeline/settlement-round.js";
import type { SettlementContext } from "./pipeline/types.js";
import { resolveSources } from "./sources.js";
import { StateStore, readStateDir } from "./state.js";

// verify:settlement (CONVENTIONS §8, Story 2.8): ONE end-to-end testnet run of
// watch -> attest-wait -> prove -> submit -> project, driven through the worker's own
// runSettlementRound — the evidence and the production loop share one code path. The
// source event is a real ContestSource round settled on Sepolia (the identical-referee
// path of FR-21), so the run needs no waiting for tomorrow's Lido report. Exits 1 rather
// than print anything it did not observe.

// The pipeline gets 75 minutes before the run is declared a miss: past the 60-min cost
// cliff plus margin, something is genuinely wrong and the honest verdict is failure.
const RUN_DEADLINE_MS = 75 * 60_000;
const ROUND_PAUSE_MS = 20_000;

const fail = (message: string): never => {
  log.error(`verify:settlement: ${message}`);
  process.exit(1);
};

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

// AD-10: wait on the CHAIN's clock, not the machine's — the contract only sees block time.
const waitForChainTime = async (clients: Cc3Clients, targetSec: bigint, label: string): Promise<void> => {
  for (;;) {
    const now = (await clients.publicClient.getBlock()).timestamp;
    if (now >= targetSec) return;
    log.info(`verify:settlement: chain at ${now}, waiting for ${label} at ${targetSec}...`);
    await sleep(5_000);
  }
};

const main = async (): Promise<void> => {
  const endpoints = readEndpoints(process.env);
  const gateway =
    DEPLOYED.proofGateway ??
    fail("no ProofGateway in packages/chain/src/contracts.ts — Story 5.4 wires the live deployment.");
  const contest = DEPLOYED.contestSource ?? fail("no ContestSource recorded — Story 2.7's deployment is missing.");
  const decoderId =
    DEPLOYED.contestRoundDecoderId ??
    fail("no contestRoundDecoderId recorded — Story 5.4 registers decoders and records their ids.");
  const key = readWorkerKey(process.env);
  const clients = cc3Clients(endpoints.CC3_RPC_URL, key);
  const core = await clients.publicClient.readContract({
    address: gateway,
    abi: proofGatewayAbi,
    functionName: "leagueCore",
  });
  const sources = await resolveSources(endpoints);
  const sepoliaSource =
    [...sources.byChainKey.values()].find((s) => s.chainId === sepolia.id) ??
    fail("CC3's ChainInfo precompile does not advertise Sepolia — the AD-6 runtime map has no entry.");
  const sepoliaWallet = createWalletClient({
    account: privateKeyToAccount(key),
    chain: sepolia,
    transport: http(endpoints.SEPOLIA_RPC_URL),
  });

  // -- fixture: a ContestSource round on Sepolia and its market on CC3 -----------------
  // The round exists first (its id is the market's subjectFilter), so the settle moment
  // is fixed generously ahead and the market's clocks are read FRESH after round creation
  // — a lockTime computed before a Sepolia tx mines arrives born-locked (bitten live in
  // verify:payout's first run; same class).
  const t0 = (await clients.publicClient.getBlock()).timestamp;
  const scheduledSettleTime = t0 + 480n;
  const sepoliaHeadBlock = await sepoliaSource.viem.getBlock();
  // The block-to-clock arithmetic the contract cannot verify (12 s Sepolia blocks + margin):
  // settleBlock's expected mining time sits at or past scheduledSettleTime.
  const settleBlock =
    sepoliaHeadBlock.number + (scheduledSettleTime - sepoliaHeadBlock.timestamp) / 12n + 5n;

  const createRoundHash = await sepoliaWallet.writeContract({
    address: contest,
    abi: contestSourceAbi,
    functionName: "createRound",
    args: [{ settleBlock, scheduledSettleTime, valueMin: -500_000n, valueSpan: 1_000_000n }],
  });
  const roundReceipt = await sepoliaSource.viem.waitForTransactionReceipt({ hash: createRoundHash });
  const [roundCreated] = parseEventLogs({ abi: contestSourceAbi, eventName: "RoundCreated", logs: roundReceipt.logs });
  if (roundCreated === undefined) return fail(`createRound tx ${createRoundHash} emitted no RoundCreated`);
  const roundId = roundCreated.args.roundId;
  log.info(`verify:settlement: Sepolia round ${roundId}, settleBlock ${settleBlock}: ${createRoundHash}`);

  const t1 = (await clients.publicClient.getBlock()).timestamp;
  const lockTime = t1 + 30n;
  const sourceWindowOpen = lockTime + BigInt(MIN_COMMIT_MARGIN_SEC);
  // Check 6 reads the DECODED occurredAt (= scheduledSettleTime): the window must open at
  // or before it, or the event is pre-open to its own market and can never resolve it.
  if (sourceWindowOpen > scheduledSettleTime) {
    return fail("round creation consumed the scheduling margin — rerun; nothing committed yet");
  }
  // Generous void clock: if this run dies mid-way the market voids in 3 h via the worker's
  // own permissionless duty — the fixture can never hold the season's all-terminal gate.
  const voidDeadline = sourceWindowOpen + 3n * 3600n;
  const config = {
    sourceChainKey: BigInt(sepoliaSource.chainKey),
    emitter: contest,
    eventSignature: keccak256(stringToHex("RoundSettled(uint256,int256,uint64)")),
    subjectFilter: numberToHex(roundId, { size: 32 }),
    decoderId,
    payoutN: 2,
    leagueDay: utcDayOf(Number(t0)),
    lockTime,
    sourceWindowOpen,
    voidDeadline,
    determinismHorizon: sourceWindowOpen,
    boundaries: [0n],
  } as const;
  const coreContract = { address: core, abi: leagueCoreAbi } as const;
  const createHash = await clients.walletClient.writeContract({
    ...coreContract,
    functionName: "createMarket",
    args: [config],
  });
  const createReceipt = await clients.publicClient.waitForTransactionReceipt({ hash: createHash });
  const [created] = parseEventLogs({ abi: leagueCoreAbi, eventName: "MarketCreated", logs: createReceipt.logs });
  if (created === undefined) return fail(`createMarket tx ${createHash} emitted no MarketCreated`);
  const marketId = created.args.marketId;
  const sourceKey = created.args.sourceKey;
  log.info(`verify:settlement: market ${marketId} on sourceKey ${sourceKey}`);

  await waitForChainTime(clients, lockTime, "lockTime");
  // The canonical empty commitment (AD-14), PUBLISHED for real: this script drives the
  // live deployment, so its market has to survive `pnpm rebuild` like any other.
  const committed = await commitEmptyPickSet(
    clients,
    core,
    marketId,
    new PickSetPublisher(readPicksetPublisherConfig(process.env, readStateDir(process.env))),
  );
  log.info(`verify:settlement: empty pick-set published and committed: ${committed.uri}`);

  // -- the source event: permissionless settle once the pre-committed block is mined ---
  for (;;) {
    const head = await sepoliaSource.viem.getBlock();
    if (head.number > settleBlock && head.timestamp > sourceWindowOpen) break;
    log.info(`verify:settlement: Sepolia at block ${head.number}, waiting past settleBlock ${settleBlock}...`);
    await sleep(10_000);
  }
  const settleHash = await sepoliaWallet.writeContract({
    address: contest,
    abi: contestSourceAbi,
    functionName: "settle",
    args: [roundId],
  });
  await sepoliaSource.viem.waitForTransactionReceipt({ hash: settleHash });
  log.info(`verify:settlement: RoundSettled on Sepolia: ${endpoints.EXPLORER_BASE_SEPOLIA}/tx/${settleHash}`);

  // -- drive the worker's OWN settlement round until the proof lands -------------------
  const store = new StateStore(join(readStateDir(process.env), `verify-settlement-${t0}`));
  const ctx: SettlementContext = {
    gateway,
    core,
    clients,
    sources,
    store,
    projection: new FileTransparencyProjection(store.dir),
    proverUrl: endpoints.PROVER_URL,
    webhookUrl: process.env.OPERATOR_WEBHOOK_URL,
  };
  const startedMs = Date.now();
  let lastPhase = "";
  for (;;) {
    if (Date.now() - startedMs > RUN_DEADLINE_MS) {
      return fail(`pipeline did not settle within ${RUN_DEADLINE_MS / 60000} min — investigate, do not archive`);
    }
    await runSettlementRound(ctx);
    const cursor = store.state.cursors[sourceKey];
    const phase = cursor === undefined ? "(no cursor yet)" : `${cursor.phase}${cursor.stuckReason ? ` [stuck: ${cursor.stuckReason}]` : ""}`;
    if (phase !== lastPhase) {
      log.info(`verify:settlement: pipeline phase -> ${phase}`);
      lastPhase = phase;
    }
    if (cursor?.phase === "settled") break;
    if (cursor?.phase === "voided") return fail("market voided before settlement — the pipeline never proved it");
    await sleep(ROUND_PAUSE_MS);
  }

  // -- verdict: chain state plus the three phase timestamps the projection recorded ----
  const finalState = CONTRACT_MARKET_STATES[
    await clients.publicClient.readContract({ ...coreContract, functionName: "stateOf", args: [marketId] })
  ];
  if (finalState !== "Resolved") return fail(`market ${marketId} is ${finalState ?? "unknown"} after settlement`);
  const cursor = store.state.cursors[sourceKey];
  const ts = cursor?.timestamps;
  if (ts?.eventSec === undefined || ts.attestedSec === undefined || ts.provenSec === undefined) {
    return fail("a phase timestamp is missing from the projection — the transparency write did not happen");
  }
  const provenLag = ts.provenSec - ts.eventSec;
  log.info(
    `verify:settlement: PASS — watch -> attest -> prove (${cursor?.proof?.prover}) -> submit -> project on testnet.\n` +
      `  event ${ts.eventSec} -> attested ${ts.attestedSec} (+${ts.attestedSec - ts.eventSec}s) -> proven ${ts.provenSec} (+${provenLag}s)\n` +
      `  target (measured attestation + 5 min): ${expectedSettlementSecOf(ts.eventSec) - ts.eventSec}s — ` +
      `${ts.provenSec <= expectedSettlementSecOf(ts.eventSec) ? "met" : "missed (honest miss, alert fired)"}\n` +
      `  cost cliff ${SETTLEMENT_COST_CLIFF_SEC}s: ${provenLag > SETTLEMENT_COST_CLIFF_SEC ? "OVER (marked over-cliff)" : "under"}\n` +
      `  proof tx: ${endpoints.EXPLORER_BASE_CC3}/tx/${cursor?.provenTxHash ?? "(raced — accepted by another caller)"}`,
  );
};

void main();
