import { scriptLogger } from "./logger.js";

const log = scriptLogger();
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { keccak256, parseEther, parseEventLogs, sha256, stringToHex, zeroAddress, zeroHash } from "viem";
import type { Address } from "viem";
import { leagueCoreAbi, proofGatewayAbi, readEndpoints } from "@proof-league/chain";
import { MIN_COMMIT_MARGIN_SEC, SEASON_CHALLENGE_WINDOW_SEC, utcDayOf } from "@proof-league/shared";
import { cc3Clients, readWorkerKey, type Cc3Clients } from "./cc3.js";
import { runSeasonRound } from "./season-round.js";
import { resolveSources } from "./sources.js";
import { StateStore, readStateDir } from "./state.js";

// verify:payout (CONVENTIONS §8, Story 2.10): proves the whole unattended payout path
// pre-Sep-17 by deploying a MINUTES-long test Season on the SAME ProofGateway bytecode
// (read straight from the forge artifact — season params are constructor args precisely
// so this script can exist) and driving trigger -> claim -> challenge -> pay end-to-end with
// the worker's own runSeasonRound. The challenge window is the real 6 h constant, so the
// run is RESUMABLE: run 1 deploys, drives the machine to candidate-submitted and probes
// every pre-expiry refusal; run 2 (after the window) drives expiry -> withdraw and the
// post-payout refusals. Each run exits 1 unless it reached its stage's verdict — an
// in-progress run is never archivable as PASS.

type Pointer = {
  gateway: Address;
  core: Address;
  deployBlock: number;
  seasonEndSec: number;
  poolWei: string;
  windowEndsAtSec: number;
};

const fail = (message: string): never => {
  log.error(`verify:payout: ${message}`);
  process.exit(1);
};

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const waitForChainTime = async (clients: Cc3Clients, targetSec: bigint, label: string): Promise<void> => {
  for (;;) {
    const now = (await clients.publicClient.getBlock()).timestamp;
    if (now >= targetSec) return;
    log.info(`verify:payout: chain at ${now}, waiting for ${label} at ${targetSec}...`);
    await sleep(5_000);
  }
};

/// A guard probed live must refuse with its NAMED error — a network hiccup or a different
/// revert must never pass as negative evidence (the verify:void pattern).
const expectNamedRevert = async (probe: Promise<unknown>, errorName: string, label: string): Promise<void> => {
  try {
    await probe;
  } catch (error) {
    if (!String(error).includes(errorName)) return fail(`${label}: refused for the wrong reason: ${String(error)}`);
    log.info(`verify:payout: ${label} correctly refused (${errorName})`);
    return;
  }
  return fail(`${label}: succeeded where ${errorName} was required — the guard is broken`);
};

const main = async (): Promise<void> => {
  const endpoints = readEndpoints(process.env);
  const clients = cc3Clients(endpoints.CC3_RPC_URL, readWorkerKey(process.env));
  const worker = clients.walletClient.account.address;
  const store = new StateStore(join(readStateDir(process.env), "verify-payout"));
  const pointerFile = join(store.dir, "run.json");
  if (existsSync(pointerFile)) {
    return finishRun(clients, store, JSON.parse(readFileSync(pointerFile, "utf8")) as Pointer, endpoints.EXPLORER_BASE_CC3);
  }

  // -- run 1: deploy the minutes-long season on the same bytecode ----------------------
  // The artifact is the compiled truth CI's freshness gate pins the committed ABI to;
  // deploying its bytecode verbatim is what "same bytecode" means literally.
  const artifactPath = fileURLToPath(
    new URL("../../../contracts/out/ProofGateway.sol/ProofGateway.json", import.meta.url),
  );
  if (!existsSync(artifactPath)) return fail("forge artifact missing — run `forge build` in contracts/ first");
  const artifact = JSON.parse(readFileSync(artifactPath, "utf8")) as { bytecode: { object: `0x${string}` } };
  const t0 = (await clients.publicClient.getBlock()).timestamp;
  const seasonEnd = t0 + 240n;
  const seasonEndDay = utcDayOf(Number(t0));
  const deployHash = await clients.walletClient.deployContract({
    abi: proofGatewayAbi,
    bytecode: artifact.bytecode.object,
    // Escrow = worker1 FOR THE TEST ONLY: the param exists so the real season can point
    // at the segregated offline account; here it lets the script fund and withdraw.
    args: [[worker], [worker], { seasonEnd, seasonEndDay, escrow: worker }],
  });
  const deployReceipt = await clients.publicClient.waitForTransactionReceipt({ hash: deployHash });
  const gateway = deployReceipt.contractAddress ?? fail("deployment mined without a contract address");
  const core = await clients.publicClient.readContract({ address: gateway, abi: proofGatewayAbi, functionName: "leagueCore" });
  const coreContract = { address: core, abi: leagueCoreAbi } as const;
  log.info(`verify:payout: test season deployed — gateway ${gateway}, core ${core}, seasonEnd ${seasonEnd}`);

  const poolWei = parseEther("0.5");
  const fundHash = await clients.walletClient.writeContract({
    ...coreContract,
    functionName: "fundSeason",
    value: poolWei,
  });
  await clients.publicClient.waitForTransactionReceipt({ hash: fundHash });

  const account = clients.walletClient.account;
  const zeroCandidate = [zeroAddress, zeroAddress, zeroAddress] as const;
  await expectNamedRevert(
    clients.publicClient.simulateContract({ ...coreContract, functionName: "submitSeasonCandidate", args: [zeroCandidate], account }),
    "SeasonNotOver",
    "pre-seasonEnd claim",
  );

  // One season-day market drives the all-terminal gate: Committed past seasonEnd blocks
  // the claim; the permissionless void un-blocks it — 2.6's liveness argument, live.
  const sources = await resolveSources(endpoints);
  const chainKey = [...sources.byChainKey.keys()][0] ?? fail("no source chains advertised by CC3");
  // Fresh clock read AFTER every slow call above: the deploy + fund transactions already
  // burned chain seconds, and a lockTime computed from t0 arrives born-locked (bitten
  // live on the first stage-1 run — BornLocked admission did its job).
  const t1 = (await clients.publicClient.getBlock()).timestamp;
  const lockTime = t1 + 30n;
  const sourceWindowOpen = lockTime + BigInt(MIN_COMMIT_MARGIN_SEC);
  const voidDeadline = sourceWindowOpen + 45n;
  const createHash = await clients.walletClient.writeContract({
    ...coreContract,
    functionName: "createMarket",
    args: [
      {
        sourceChainKey: BigInt(chainKey),
        emitter: worker,
        eventSignature: keccak256(stringToHex("VerifyPayoutEvidence()")),
        subjectFilter: keccak256(stringToHex(`verify:payout run ${t0}`)),
        decoderId: 1,
        payoutN: 2,
        leagueDay: seasonEndDay,
        lockTime,
        sourceWindowOpen,
        voidDeadline,
        determinismHorizon: sourceWindowOpen,
        boundaries: [0n],
      },
    ],
  });
  const createReceipt = await clients.publicClient.waitForTransactionReceipt({ hash: createHash });
  const [created] = parseEventLogs({ abi: leagueCoreAbi, eventName: "MarketCreated", logs: createReceipt.logs });
  if (created === undefined) return fail("createMarket emitted no MarketCreated");
  const marketId = created.args.marketId;

  await waitForChainTime(clients, lockTime, "lockTime");
  const commitHash = await clients.walletClient.writeContract({
    ...coreContract,
    functionName: "commitPicks",
    args: [marketId, zeroHash, "local:verify-payout/empty-set.json", sha256(stringToHex("[]"))],
  });
  await clients.publicClient.waitForTransactionReceipt({ hash: commitHash });

  await waitForChainTime(clients, seasonEnd + 1n, "seasonEnd");
  await expectNamedRevert(
    clients.publicClient.simulateContract({ ...coreContract, functionName: "submitSeasonCandidate", args: [zeroCandidate], account }),
    "SeasonMarketsNotTerminal",
    "claim while a season market is non-terminal",
  );

  await waitForChainTime(clients, voidDeadline + 1n, "voidDeadline");
  const voidHash = await clients.walletClient.writeContract({ ...coreContract, functionName: "void", args: [marketId] });
  await clients.publicClient.waitForTransactionReceipt({ hash: voidHash });
  log.info(`verify:payout: market ${marketId} voided — the gate is now all-terminal`);

  await expectNamedRevert(
    clients.publicClient.simulateContract({
      ...coreContract,
      functionName: "submitSeasonCandidate",
      args: [[worker, zeroAddress, zeroAddress] as const],
      account,
    }),
    "CandidateNotEligible",
    "pointless-player candidate",
  );

  // The worker's own duty submits the candidate (zero-tail: no player scored — the
  // 0-eligible-winner split, whose whole pool returns to escrow on expiry).
  const season = await runSeasonRound(core, clients, store, process.env.OPERATOR_WEBHOOK_URL, deployReceipt.blockNumber ? Number(deployReceipt.blockNumber) : 0);
  if (season.status !== "submitted") return fail(`runSeasonRound was expected to submit, got ${season.status}: ${season.detail ?? ""}`);
  log.info(`verify:payout: ${season.detail ?? "candidate submitted"}`);
  const [, windowEndsAt] = await clients.publicClient.readContract({ ...coreContract, functionName: "seasonCandidate" });

  await expectNamedRevert(
    clients.publicClient.simulateContract({ ...coreContract, functionName: "finalizeSeasonPayout", account }),
    "ChallengeWindowOpen",
    "finalize inside the window",
  );

  store.save();
  const pointer: Pointer = {
    gateway,
    core,
    deployBlock: Number(deployReceipt.blockNumber),
    seasonEndSec: Number(seasonEnd),
    poolWei: poolWei.toString(),
    windowEndsAtSec: Number(windowEndsAt),
  };
  writeFileSync(pointerFile, JSON.stringify(pointer, null, 2));
  log.error(
    `verify:payout: STAGE 1 COMPLETE, NOT YET EVIDENCE — the ${SEASON_CHALLENGE_WINDOW_SEC / 3600} h challenge window ` +
      `runs to ${pointer.windowEndsAtSec}; re-run this script after it to drive expiry -> pay.`,
  );
  process.exit(1);
};

// -- run 2: expiry -> pull-based pay, plus the post-payout refusals --------------------
const finishRun = async (clients: Cc3Clients, store: StateStore, pointer: Pointer, explorer: string): Promise<void> => {
  const coreContract = { address: pointer.core, abi: leagueCoreAbi } as const;
  const account = clients.walletClient.account;
  const now = (await clients.publicClient.getBlock()).timestamp;
  if (now < BigInt(pointer.windowEndsAtSec)) {
    return fail(`challenge window still open until ${pointer.windowEndsAtSec} (chain at ${now}) — no verdict yet`);
  }
  const season = await runSeasonRound(pointer.core, clients, store, process.env.OPERATOR_WEBHOOK_URL, pointer.deployBlock);
  if (season.status !== "finalized") return fail(`runSeasonRound was expected to finalize, got ${season.status}: ${season.detail ?? ""}`);
  log.info(`verify:payout: ${season.detail ?? "finalized"}`);
  store.save();

  const withdrawHash = await clients.walletClient.writeContract({ ...coreContract, functionName: "withdrawSeasonPayout" });
  const withdrawReceipt = await clients.publicClient.waitForTransactionReceipt({ hash: withdrawHash });
  const [withdrawn] = parseEventLogs({ abi: leagueCoreAbi, eventName: "SeasonPayoutWithdrawn", logs: withdrawReceipt.logs });
  if (withdrawn === undefined) return fail("withdraw emitted no SeasonPayoutWithdrawn");
  if (withdrawn.args.amount !== BigInt(pointer.poolWei)) {
    return fail(`escrow reclaimed ${withdrawn.args.amount}, expected the whole ${pointer.poolWei} (0-winner split)`);
  }
  await expectNamedRevert(
    clients.publicClient.simulateContract({ ...coreContract, functionName: "finalizeSeasonPayout", account }),
    "SeasonAlreadyPaid",
    "double finalize",
  );
  await expectNamedRevert(
    clients.publicClient.simulateContract({ ...coreContract, functionName: "withdrawSeasonPayout", account }),
    "NothingToWithdraw",
    "double withdraw",
  );
  log.info(
    `verify:payout: PASS — trigger -> claim -> challenge -> pay end-to-end on testnet, same bytecode.\n` +
      `  0-winner split returned the whole pool to escrow; every pre- and post-payout guard probed by name.\n` +
      `  withdraw tx: ${explorer}/tx/${withdrawHash}`,
  );
};

void main();
