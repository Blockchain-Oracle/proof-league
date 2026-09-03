import { scriptLogger } from "./logger.js";

const log = scriptLogger();
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { keccak256, parseEventLogs, sha256, stringToHex, zeroHash, type Hex } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { leagueCoreAbi, proofGatewayAbi, readEndpoints } from "@proof-league/chain";
import {
  buildPickSetTree,
  CONTRACT_MARKET_STATES,
  MIN_COMMIT_MARGIN_SEC,
  parsePickSetDocument,
  PICK_DOMAIN_NAME,
  PICK_DOMAIN_VERSION,
  PICK_TYPES,
  pickSetFileName,
  pickSetLeavesOf,
  pickSetSha256,
  processPickSetProof,
  proofOf,
  signedPickOf,
  utcDayOf,
  type PickDomain,
  type PickMessage,
  type SignedPick,
} from "@proof-league/shared";
import { createDb, insertPendingPick } from "@proof-league/shared/db";
import { cc3Clients, readWorkerKey, type Cc3Clients } from "./cc3.js";
import { runCommitRound } from "./commit-round.js";
import { FileTransparencyProjection } from "./pipeline/project.js";
import { PickSetPublisher, readPicksetPublisherConfig } from "./pickset/publish.js";
import { readStateDir, StateStore } from "./state.js";

// verify:commit (CONVENTIONS §8, Story 2.2): one focused testnet evidence run of AD-5's
// judged claim — nobody can add a winning pick after the answer is public, and nobody
// (operator included) can invent a pick at all. Drives the REAL path end to end: EIP-712
// signing by ephemeral players -> the production intake write -> the production commit
// round (canonicalize, publish both homes, verify-readable, commitPicks) -> the published
// file re-derives the on-chain root and a merkle proof binds one pick into it. A forged
// signature goes through intake and must be excluded; the pre-lock commit and the
// re-commit must both refuse with named errors. Exits 1 rather than print anything it
// did not observe.

const fail = (message: string): never => {
  log.error(`verify:commit: ${message}`);
  process.exit(1);
};

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const waitForChainTime = async (clients: Cc3Clients, targetSec: bigint, label: string): Promise<void> => {
  for (;;) {
    const now = (await clients.publicClient.getBlock()).timestamp;
    if (now >= targetSec) return;
    log.info(`verify:commit: chain at ${now}, waiting for ${label} at ${targetSec}...`);
    await sleep(5_000);
  }
};

const expectNamedRevert = async (probe: Promise<unknown>, errorName: string, label: string): Promise<void> => {
  try {
    await probe;
  } catch (error) {
    if (!String(error).includes(errorName)) return fail(`${label}: refused for the wrong reason: ${String(error)}`);
    log.info(`verify:commit: ${label} correctly refused (${errorName})`);
    return;
  }
  return fail(`${label}: succeeded where ${errorName} was required — the guard is broken`);
};

const signPick = async (key: Hex, domain: PickDomain, pick: PickMessage): Promise<SignedPick> => {
  const signature = await privateKeyToAccount(key).signTypedData({
    domain: { name: PICK_DOMAIN_NAME, version: PICK_DOMAIN_VERSION, ...domain },
    types: PICK_TYPES,
    primaryType: "Pick",
    message: pick,
  });
  return { ...pick, signature };
};

const main = async (): Promise<void> => {
  const endpoints = readEndpoints(process.env);
  const clients = cc3Clients(endpoints.CC3_RPC_URL, readWorkerKey(process.env));
  const worker = clients.walletClient.account.address;
  const databaseUrl =
    process.env.DATABASE_URL ?? fail("DATABASE_URL is required — the evidence must drive the real intake path");
  const store = new StateStore(join(readStateDir(process.env), "verify-commit"));
  const publisherConfig = readPicksetPublisherConfig(process.env, store.dir);
  const publisher = new PickSetPublisher(publisherConfig);
  if (!publisher.storageConfigured) {
    return fail("SUPABASE_URL + SUPABASE_SERVICE_KEY are required — the evidence must publish to BOTH homes");
  }
  const database = createDb(databaseUrl);

  // -- fresh deployment on the same bytecode (the verify:payout pattern) ---------------
  const artifactPath = fileURLToPath(new URL("../../../contracts/out/ProofGateway.sol/ProofGateway.json", import.meta.url));
  if (!existsSync(artifactPath)) return fail("forge artifact missing — run `forge build` in contracts/ first");
  const artifact = JSON.parse(readFileSync(artifactPath, "utf8")) as { bytecode: { object: Hex } };
  const t0 = (await clients.publicClient.getBlock()).timestamp;
  const deployHash = await clients.walletClient.deployContract({
    abi: proofGatewayAbi,
    bytecode: artifact.bytecode.object,
    // A distant seasonEnd: this run exercises commitment only, never the season machine.
    args: [[worker], [worker], { seasonEnd: t0 + 86_400n, seasonEndDay: utcDayOf(Number(t0)), escrow: worker }],
  });
  const deployReceipt = await clients.publicClient.waitForTransactionReceipt({ hash: deployHash });
  const gateway = deployReceipt.contractAddress ?? fail("deployment mined without a contract address");
  const core = await clients.publicClient.readContract({ address: gateway, abi: proofGatewayAbi, functionName: "leagueCore" });
  const contract = { address: core, abi: leagueCoreAbi } as const;
  const domain: PickDomain = { chainId: clients.publicClient.chain.id, verifyingContract: core };
  log.info(`verify:commit: fresh deployment — gateway ${gateway}, core ${core}`);

  // Fresh clock AFTER the deploy tx (the BornLocked lesson): lockTime from a stale read
  // arrives already locked — and TWO sequential creates burn ~30 chain seconds themselves,
  // so the lock needs headroom for both to admit with lockTime still in the future.
  const t1 = (await clients.publicClient.getBlock()).timestamp;
  const lockTime = t1 + 90n;
  const sourceWindowOpen = lockTime + BigInt(MIN_COMMIT_MARGIN_SEC);
  const createMarket = async (label: string): Promise<bigint> => {
    const hash = await clients.walletClient.writeContract({
      ...contract,
      functionName: "createMarket",
      args: [
        {
          sourceChainKey: 3n,
          emitter: worker,
          eventSignature: keccak256(stringToHex("VerifyCommitEvidence()")),
          subjectFilter: keccak256(stringToHex(`verify:commit ${label} ${t0}`)),
          decoderId: 1,
          payoutN: 2,
          leagueDay: utcDayOf(Number(t1)),
          lockTime,
          sourceWindowOpen,
          voidDeadline: sourceWindowOpen + 45n,
          determinismHorizon: sourceWindowOpen,
          boundaries: [0n],
        },
      ],
    });
    const receipt = await clients.publicClient.waitForTransactionReceipt({ hash });
    const [created] = parseEventLogs({ abi: leagueCoreAbi, eventName: "MarketCreated", logs: receipt.logs });
    if (created === undefined) {
      return fail(`createMarket(${label}) emitted no MarketCreated (tx ${hash} status=${receipt.status})`);
    }
    return created.args.marketId;
  };
  const picksMarket = await createMarket("picks");
  const emptyMarket = await createMarket("empty");
  log.info(`verify:commit: markets created — ${picksMarket} (5 picks incoming), ${emptyMarket} (stays empty)`);

  // -- sign -> intake: three ephemeral players, a replacement, a tombstone, a forgery --
  const [keyA, keyB, keyC] = [generatePrivateKey(), generatePrivateKey(), generatePrivateKey()] as const;
  const playerA = privateKeyToAccount(keyA).address;
  const playerB = privateKeyToAccount(keyB).address;
  const playerC = privateKeyToAccount(keyC).address;
  const day = utcDayOf(Number(t1));
  const pickOf = (player: `0x${string}`, nonce: number, stake: number, optionIndex: number): PickMessage => ({
    player,
    marketId: picksMarket,
    optionIndex,
    stake,
    nonce,
    utcDay: day,
    stakedSoFarInDay: 0,
  });
  const signed = await Promise.all([
    signPick(keyA, domain, pickOf(playerA, 1, 10, 0)),
    signPick(keyA, domain, pickOf(playerA, 2, 15, 1)), // the replacement — latest nonce wins at scoring
    signPick(keyB, domain, pickOf(playerB, 1, 20, 0)),
    signPick(keyB, domain, pickOf(playerB, 2, 0, 0)), // the zero-stake tombstone stays in the set
    signPick(keyC, domain, pickOf(playerC, 1, 5, 1)),
  ]);
  // The forgery: keyA signs a message CLAIMING to be playerC. Intake stores it (intake is
  // a mailbox, not a judge); the commit round's signature gate must exclude it.
  const forged = await signPick(keyA, domain, pickOf(playerC, 2, 99, 1));
  const receivedAtSec = Number(t1);
  for (const pick of [...signed, forged]) {
    const stored = await insertPendingPick(database.db, { ...pick, verifyingContract: core, receivedAtSec });
    if (stored !== "stored") return fail(`intake refused a fresh pick (${pick.player} nonce ${pick.nonce})`);
  }
  if ((await insertPendingPick(database.db, { ...signed[0]!, verifyingContract: core, receivedAtSec })) !== "duplicate") {
    return fail("intake stored the same (player, nonce) twice — first-write-wins is broken");
  }
  log.info("verify:commit: 6 picks through the real intake (5 honest + 1 forged); duplicate correctly refused");

  await expectNamedRevert(
    clients.publicClient.simulateContract({
      ...contract,
      functionName: "commitPicks",
      args: [picksMarket, zeroHash, "probe:pre-lock", sha256(stringToHex("probe"))],
      account: clients.walletClient.account,
    }),
    "CommitBeforeLock",
    "pre-lock commit",
  );

  // -- the production commit round does the rest -----------------------------------------
  await waitForChainTime(clients, lockTime, "lockTime");
  const projection = new FileTransparencyProjection(store.dir);
  const report = await runCommitRound({ core, clients, db: database.db, publisher, projection });
  for (const failure of report.failed) log.error(`verify:commit: round failure — ${failure.marketId}: ${failure.why}`);
  if (!report.committed.includes(picksMarket) || !report.committed.includes(emptyMarket)) {
    return fail(`commit round committed ${report.committed.join(",")} — expected both ${picksMarket} and ${emptyMarket}`);
  }

  // -- evidence: published bytes ARE the commitment ------------------------------------
  const commitment = await clients.publicClient.readContract({ ...contract, functionName: "getPickCommitment", args: [picksMarket] });
  const served = await fetch(commitment.uri).then((r) => (r.ok ? r.text() : fail(`published uri unreadable: ${commitment.uri}`)));
  if (pickSetSha256(served) !== commitment.sha256Hash) return fail("public URL bytes do not hash to the on-chain sha256");
  const doc = parsePickSetDocument(served);
  if (doc.count !== 5) return fail(`published set has ${doc.count} picks — expected exactly the 5 honest ones`);
  if (doc.picks.some((p) => p.player === playerC.toLowerCase() && p.nonce === 2)) {
    return fail("the FORGED pick is in the published set — the signature gate failed");
  }
  const tree = buildPickSetTree(pickSetLeavesOf(domain, doc.picks.map(signedPickOf)));
  if (tree.commitmentRoot !== commitment.root) return fail("published file does not re-derive the on-chain root");
  const provenIndex = doc.picks.findIndex((p) => p.player === playerC.toLowerCase());
  const leaf = pickSetLeavesOf(domain, [signedPickOf(doc.picks[provenIndex]!)])[0]!;
  if (processPickSetProof(tree.leafCount, provenIndex, leaf, proofOf(tree, provenIndex)) !== tree.treeRoot) {
    return fail("the merkle proof for an honest pick does not verify against the committed root");
  }
  const mirrorPath = join(publisherConfig.mirrorDir, pickSetFileName(picksMarket, commitment.sha256Hash));
  if (!existsSync(mirrorPath) || readFileSync(mirrorPath, "utf8") !== served) {
    return fail(`mirror home missing or differs: ${mirrorPath}`);
  }
  log.info(`verify:commit: provably-in-set PASSED — ${commitment.uri} re-derives root ${commitment.root}`);

  const emptyCommitment = await clients.publicClient.readContract({ ...contract, functionName: "getPickCommitment", args: [emptyMarket] });
  if (emptyCommitment.root !== zeroHash) return fail("zero-pick market did not commit the canonical empty root");
  const emptyDoc = parsePickSetDocument(await fetch(emptyCommitment.uri).then((r) => r.text()));
  if (emptyDoc.count !== 0) return fail("the empty market's published document is not the empty set");
  const states = await Promise.all(
    [picksMarket, emptyMarket].map(async (id) =>
      CONTRACT_MARKET_STATES[await clients.publicClient.readContract({ ...contract, functionName: "stateOf", args: [id] })],
    ),
  );
  if (states.some((s) => s !== "Committed")) return fail(`markets are ${states.join(",")} — expected Committed,Committed`);

  await expectNamedRevert(
    clients.publicClient.simulateContract({
      ...contract,
      functionName: "commitPicks",
      args: [picksMarket, zeroHash, "probe:recommit", sha256(stringToHex("probe"))],
      account: clients.walletClient.account,
    }),
    "MarketNotCommittable",
    "re-commit of a committed market",
  );

  await database.end();
  log.info(
    `verify:commit: PASS — sign -> intake -> publish(2 homes) -> verify-readable -> commitPicks -> provably-in-set, forgery excluded, empty set committed. Explorer: ${endpoints.EXPLORER_BASE_CC3}/address/${core}`,
  );
};

void main();
