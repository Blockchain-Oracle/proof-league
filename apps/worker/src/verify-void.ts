import { keccak256, parseEventLogs, sha256, stringToHex, zeroHash } from "viem";
import { DEPLOYED, leagueCoreAbi, readEndpoints } from "@proof-league/chain";
import { CONTRACT_MARKET_STATES, MIN_COMMIT_MARGIN_SEC, utcDayOf } from "@proof-league/shared";
import { cc3Clients, readWorkerKey, type Cc3Clients } from "./cc3.js";

// verify:void (CONVENTIONS §8, Story 2.6): one focused testnet evidence run of AD-19's
// judged claim — void is a clock fact nobody can invoke early. Drives BOTH terminal edges
// end to end on the live deployment: a committed market (Committed -> Voided, the stake
// return case) and a never-committed one (Created -> Voided, the missed-window case),
// with an early-void refusal probed on-chain before the deadline. Output is the archived
// evidence; it exits 1 rather than print anything it did not observe.

type MarketConfigArg = {
  readonly sourceChainKey: bigint;
  readonly emitter: `0x${string}`;
  readonly eventSignature: `0x${string}`;
  readonly subjectFilter: `0x${string}`;
  readonly decoderId: number;
  readonly payoutN: number;
  readonly leagueDay: number;
  readonly lockTime: bigint;
  readonly sourceWindowOpen: bigint;
  readonly voidDeadline: bigint;
  readonly determinismHorizon: bigint;
  readonly boundaries: readonly bigint[];
};

const fail = (message: string): never => {
  console.error(`verify:void: ${message}`);
  process.exit(1);
};

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

// AD-10: wait on the CHAIN's clock, not the machine's — the contract only sees block time.
const waitForChainTime = async (clients: Cc3Clients, targetSec: bigint, label: string): Promise<void> => {
  for (;;) {
    const now = (await clients.publicClient.getBlock()).timestamp;
    if (now >= targetSec) return;
    console.log(`verify:void: chain at ${now}, waiting for ${label} at ${targetSec}...`);
    await sleep(5_000);
  }
};

const createMarket = async (
  clients: Cc3Clients,
  core: `0x${string}`,
  config: MarketConfigArg,
): Promise<bigint> => {
  const hash = await clients.walletClient.writeContract({
    address: core,
    abi: leagueCoreAbi,
    functionName: "createMarket",
    args: [config],
  });
  const receipt = await clients.publicClient.waitForTransactionReceipt({ hash });
  const [created] = parseEventLogs({ abi: leagueCoreAbi, eventName: "MarketCreated", logs: receipt.logs });
  if (created === undefined) return fail(`createMarket tx ${hash} emitted no MarketCreated`);
  return created.args.marketId;
};

const main = async (): Promise<void> => {
  const endpoints = readEndpoints(process.env);
  const core =
    DEPLOYED.leagueCore ??
    fail(
      "no LeagueCore in packages/chain/src/contracts.ts — Story 5.4 wires the live deployment; refusing to fake evidence without one.",
    );
  const clients = cc3Clients(endpoints.CC3_RPC_URL, readWorkerKey(process.env));
  const contract = { address: core, abi: leagueCoreAbi } as const;

  const startSec = (await clients.publicClient.getBlock()).timestamp;
  const lockTime = startSec + 20n;
  const sourceWindowOpen = lockTime + BigInt(MIN_COMMIT_MARGIN_SEC);
  const voidDeadline = sourceWindowOpen + 45n;
  const config: MarketConfigArg = {
    // Mainnet chainKey per the day-1 spike; this market exists only to void, so its
    // source fields are honest placeholders on a run-unique sourceKey (the subjectFilter
    // salt keeps repeated runs from filling a real key's 16-slot index).
    sourceChainKey: 3n,
    emitter: clients.walletClient.account.address,
    eventSignature: keccak256(stringToHex("VerifyVoidEvidence()")),
    subjectFilter: keccak256(stringToHex(`verify:void run ${startSec}`)),
    decoderId: 1,
    payoutN: 2,
    leagueDay: utcDayOf(Number(startSec)),
    lockTime,
    sourceWindowOpen,
    voidDeadline,
    determinismHorizon: sourceWindowOpen,
    boundaries: [0n],
  };

  const committedId = await createMarket(clients, core, config);
  const missedId = await createMarket(clients, core, config);
  console.log(`verify:void: created markets ${committedId} (will commit) and ${missedId} (never commits)`);

  await waitForChainTime(clients, lockTime, "lockTime");
  // The canonical empty commitment (AD-14): zero-pick markets commit and proceed.
  const commitHash = await clients.walletClient.writeContract({
    ...contract,
    functionName: "commitPicks",
    args: [committedId, zeroHash, "local:verify-void/empty-set.json", sha256(stringToHex("[]"))],
  });
  await clients.publicClient.waitForTransactionReceipt({ hash: commitHash });
  console.log(`verify:void: committed empty set to ${committedId}: ${commitHash}`);

  // The guard, probed live: before the deadline the same call must refuse with the named
  // error (a network hiccup must not pass as evidence), spending no gas.
  try {
    await clients.publicClient.simulateContract({
      ...contract,
      functionName: "void",
      args: [committedId],
      account: clients.walletClient.account,
    });
    return fail("void succeeded BEFORE voidDeadline — the AD-19 guard is broken on the live deployment");
  } catch (error) {
    if (!String(error).includes("VoidBeforeDeadline")) {
      return fail(`pre-deadline probe failed for the wrong reason: ${String(error)}`);
    }
    console.log("verify:void: pre-deadline void correctly refused (VoidBeforeDeadline)");
  }

  // Strictly past: the first block AFTER the deadline second is the earliest legal void.
  await waitForChainTime(clients, voidDeadline + 1n, "voidDeadline");
  for (const [label, marketId] of [
    ["Committed -> Voided", committedId],
    ["Created -> Voided", missedId],
  ] as const) {
    const hash = await clients.walletClient.writeContract({ ...contract, functionName: "void", args: [marketId] });
    await clients.publicClient.waitForTransactionReceipt({ hash });
    const state = CONTRACT_MARKET_STATES[
      await clients.publicClient.readContract({ ...contract, functionName: "stateOf", args: [marketId] })
    ];
    if (state !== "Voided") return fail(`market ${marketId} is ${state ?? "unknown"} after void tx ${hash}`);
    console.log(`verify:void: ${label} landed for market ${marketId}: ${endpoints.EXPLORER_BASE_CC3}/tx/${hash}`);
  }
  console.log("verify:void: PASS — both AD-19 edges exercised on testnet, early void refused.");
};

void main();
