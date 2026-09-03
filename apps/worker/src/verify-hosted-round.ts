import { scriptLogger } from "./logger.js";

const log = scriptLogger();
import { join } from "node:path";
import { createWalletClient, http, keccak256, numberToHex, parseEventLogs, stringToHex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { DEPLOYED, contestSourceAbi, leagueCoreAbi, proofGatewayAbi, readEndpoints, sepolia } from "@proof-league/chain";
import { CONTRACT_MARKET_STATES, MIN_COMMIT_MARGIN_SEC, utcDayOf } from "@proof-league/shared";
import { cc3Clients, readWorkerKey, type Cc3Clients } from "./cc3.js";
import { commitEmptyPickSet } from "./pickset/empty-set.js";
import { FileTransparencyProjection } from "./pipeline/project.js";
import { PickSetPublisher, readPicksetPublisherConfig } from "./pickset/publish.js";
import { runSettlementRound } from "./pipeline/settlement-round.js";
import type { SettlementContext } from "./pipeline/types.js";
import { resolveSources } from "./sources.js";
import { StateStore, readStateDir } from "./state.js";

// verify:hosted-round (CONVENTIONS §8, Story 5.2): FR-21's judged claim, MECHANICALLY
// TIMED. A Hosted Round must go create -> lock -> settle -> proof verified inside 30
// minutes, through the identical Referee path with no player-visible special-casing, so
// a judge can watch one complete in any half-hour window. This script runs exactly that
// cycle with a stopwatch and FAILS if it overruns, rather than asserting the bound in
// prose.
//
// The outcome is a uniform draw over the round's declared range, fixed by a
// pre-committed future block: neither the operator nor any player can grind or choose it
// (AD-11). Five equal options over [0, 1e18) means every option is exactly 20% and the
// payout law makes the round exactly break-even — zero skill, zero operator influence.
// The skill league is the daily Markets.

const BOUND_SEC = 30 * 60;
// Sepolia settle moment: far enough out that the market's commit window fits before it,
// close enough that the whole cycle lands well inside the bound.
const SETTLE_LEAD_SEC = 660n;
const ROUND_PAUSE_MS = 15_000;
const VALUE_SPAN = 10n ** 18n;

const fail = (message: string): never => {
  log.error(`verify:hosted-round: ${message}`);
  process.exit(1);
};

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const waitForChainTime = async (clients: Cc3Clients, targetSec: bigint, label: string): Promise<void> => {
  for (;;) {
    const now = (await clients.publicClient.getBlock()).timestamp;
    if (now >= targetSec) return;
    await sleep(5_000);
    log.info(`verify:hosted-round: chain at ${now}, waiting for ${label} at ${targetSec}...`);
  }
};

const main = async (): Promise<void> => {
  const endpoints = readEndpoints(process.env);
  const gateway = DEPLOYED.proofGateway ?? fail("no ProofGateway recorded — Story 5.4 wires the deployment");
  const contest = DEPLOYED.contestSource ?? fail("no ContestSource recorded");
  const decoderId = DEPLOYED.contestRoundDecoderId ?? fail("no contestRoundDecoderId recorded");
  const key = readWorkerKey(process.env);
  const clients = cc3Clients(endpoints.CC3_RPC_URL, key);
  const core = await clients.publicClient.readContract({ address: gateway, abi: proofGatewayAbi, functionName: "leagueCore" });
  const coreContract = { address: core, abi: leagueCoreAbi } as const;
  const sources = await resolveSources(endpoints);
  const sepoliaSource =
    [...sources.byChainKey.values()].find((s) => s.chainId === sepolia.id) ??
    fail("CC3's ChainInfo precompile does not advertise Sepolia");
  const sepoliaWallet = createWalletClient({
    account: privateKeyToAccount(key),
    chain: sepolia,
    transport: http(endpoints.SEPOLIA_RPC_URL),
  });

  // The stopwatch starts at the operator's first action, which is creating the round.
  const startedMs = Date.now();
  const t0 = (await clients.publicClient.getBlock()).timestamp;
  const scheduledSettleTime = t0 + SETTLE_LEAD_SEC;
  const head = await sepoliaSource.viem.getBlock();
  const settleBlock = head.number + (scheduledSettleTime - head.timestamp) / 12n + 5n;
  const createRoundHash = await sepoliaWallet.writeContract({
    address: contest,
    abi: contestSourceAbi,
    functionName: "createRound",
    // Uniform over [0, 1e18): the five equal options below each take exactly 20%.
    args: [{ settleBlock, scheduledSettleTime, valueMin: 0n, valueSpan: VALUE_SPAN }],
  });
  const roundReceipt = await sepoliaSource.viem.waitForTransactionReceipt({ hash: createRoundHash });
  const [roundCreated] = parseEventLogs({ abi: contestSourceAbi, eventName: "RoundCreated", logs: roundReceipt.logs });
  if (roundCreated === undefined) return fail(`createRound tx ${createRoundHash} emitted no RoundCreated`);
  const roundId = roundCreated.args.roundId;
  log.info(`verify:hosted-round: round ${roundId} created, settleBlock ${settleBlock}, draw fixed by that block's hash`);

  const t1 = (await clients.publicClient.getBlock()).timestamp;
  const lockTime = t1 + 120n;
  const sourceWindowOpen = lockTime + BigInt(MIN_COMMIT_MARGIN_SEC);
  if (sourceWindowOpen > scheduledSettleTime) {
    return fail("round creation consumed the scheduling margin — rerun; nothing committed yet");
  }
  // Five equal options over the draw's range: each is exactly one fifth, so the round is
  // break-even by construction and no option is a better guess than another.
  const boundaries = [VALUE_SPAN / 5n, (VALUE_SPAN * 2n) / 5n, (VALUE_SPAN * 3n) / 5n, (VALUE_SPAN * 4n) / 5n];
  const { request } = await clients.publicClient
    .simulateContract({
      ...coreContract,
      functionName: "createMarket",
      args: [
        {
          sourceChainKey: BigInt(sepoliaSource.chainKey),
          emitter: contest,
          eventSignature: keccak256(stringToHex("RoundSettled(uint256,int256,uint64)")),
          subjectFilter: numberToHex(roundId, { size: 32 }),
          decoderId,
          payoutN: 5,
          leagueDay: utcDayOf(Number(t1)),
          lockTime,
          sourceWindowOpen,
          voidDeadline: sourceWindowOpen + 3n * 3600n,
          determinismHorizon: sourceWindowOpen,
          boundaries,
        },
      ],
      account: clients.walletClient.account,
    })
    .catch((error: unknown) => fail(`createMarket refused: ${String(error).split("\n")[0]}`));
  const createHash = await clients.walletClient.writeContract(request);
  const createReceipt = await clients.publicClient.waitForTransactionReceipt({ hash: createHash });
  const [created] = parseEventLogs({ abi: leagueCoreAbi, eventName: "MarketCreated", logs: createReceipt.logs });
  if (created === undefined) return fail(`createMarket tx ${createHash} status=${createReceipt.status}, no MarketCreated`);
  const marketId = created.args.marketId;
  log.info(`verify:hosted-round: market ${marketId} created, locks at ${lockTime}`);

  await waitForChainTime(clients, lockTime, "lockTime");
  const store = new StateStore(join(readStateDir(process.env), `verify-hosted-${t0}`));
  const publisher = new PickSetPublisher(readPicksetPublisherConfig(process.env, store.dir));
  await commitEmptyPickSet(clients, core, marketId, publisher);
  log.info(`verify:hosted-round: locked and committed`);

  // The settle call is permissionless and its result is fixed by the pre-committed block,
  // so who sends it and when cannot change the answer.
  for (;;) {
    const now = await sepoliaSource.viem.getBlock();
    if (now.number > settleBlock && now.timestamp > sourceWindowOpen) break;
    await sleep(10_000);
  }
  const settleHash = await sepoliaWallet.writeContract({
    address: contest,
    abi: contestSourceAbi,
    functionName: "settle",
    args: [roundId],
  });
  await sepoliaSource.viem.waitForTransactionReceipt({ hash: settleHash });
  log.info(`verify:hosted-round: settled on Sepolia: ${endpoints.EXPLORER_BASE_SEPOLIA}/tx/${settleHash}`);

  const ctx: SettlementContext = {
    gateway,
    core,
    clients,
    sources,
    store,
    projection: new FileTransparencyProjection(store.dir),
    proverUrl: endpoints.PROVER_URL,
    accounts: [clients.walletClient.account.address],
  };
  for (;;) {
    if ((Date.now() - startedMs) / 1000 > BOUND_SEC) {
      return fail(`the cycle passed the ${BOUND_SEC / 60}-minute bound before proof verification — FR-21 NOT met`);
    }
    await runSettlementRound(ctx);
    store.save();
    const state = CONTRACT_MARKET_STATES[
      await clients.publicClient.readContract({ ...coreContract, functionName: "stateOf", args: [marketId] })
    ];
    if (state === "Resolved") break;
    if (state === "Voided") return fail(`market ${marketId} voided before it could settle`);
    await sleep(ROUND_PAUSE_MS);
  }

  const elapsedSec = Math.round((Date.now() - startedMs) / 1000);
  const resolution = await clients.publicClient.readContract({ ...coreContract, functionName: "getResolution", args: [marketId] });
  log.info(`verify:hosted-round: PASS — create -> lock -> settle -> proof verified in ${Math.floor(elapsedSec / 60)}m ${elapsedSec % 60}s`);
  log.info(`  bound: ${BOUND_SEC / 60} min — met with ${Math.round((BOUND_SEC - elapsedSec) / 60)} min to spare`);
  log.info(`  draw ${resolution.value} landed in option ${resolution.winningOption + 1} of 5, each exactly one fifth`);
  log.info(`  market: ${endpoints.EXPLORER_BASE_CC3}/address/${core}`);
};

void main();
