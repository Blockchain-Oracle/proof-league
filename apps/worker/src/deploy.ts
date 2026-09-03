import { scriptLogger } from "./logger.js";

const log = scriptLogger();
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parseEventLogs, type Address, type Hex } from "viem";
import { DEPLOYED, proofGatewayAbi, readEndpoints } from "@proof-league/chain";
import { cc3Clients, readWorkerAccounts, readWorkerKey } from "./cc3.js";

// The one deployment procedure (Story 5.4's prerequisite, AD-3/AD-20): ProofGateway
// deploys its own LeagueCore in its constructor, so the mutual reference is born atomic
// and off-chain config records the GATEWAY only. Then the two decoders deploy and
// register, and their append-only ids are written into packages/chain/src/contracts.ts
// beside the addresses — the worker and every verify script read ids from there rather
// than guessing which id maps to which decoder shape.
//
// There is no upgrade path by design: the remedy for a broken deployment is redeploy +
// rebuild. This script therefore REFUSES to run against a recorded deployment unless
// DEPLOY_REPLACE=1 is set, so a stray invocation can never orphan a live league.
//
// Season params are immutable at construction. The escrow is the segregated fourth
// account from the day-1 spike (docs/spike-day1.md) whose key no service ever loads
// (CONVENTIONS §9); the pool stays 0 until Abu's one-time manual fundSeason from that
// account, and the banner honestly renders chain state until then (AD-17).

const SEASON_END_SEC = 1_789_603_200n; // 2026-09-17T00:00:00Z
const SEASON_END_DAY = 20_712; // 2026-09-16: Sep 17+ markets are post-season and never gate payout
const ESCROW: Address = "0xC1396D0bEF413959A759b3b1b43013CF3f124757";

const fail = (message: string): never => {
  log.error(`deploy: ${message}`);
  process.exit(1);
};

const artifactOf = (name: string): { abi: unknown[]; bytecode: { object: Hex } } => {
  const path = fileURLToPath(new URL(`../../../contracts/out/${name}.sol/${name}.json`, import.meta.url));
  if (!existsSync(path)) return fail(`forge artifact for ${name} missing — run \`forge build\` in contracts/ first`);
  return JSON.parse(readFileSync(path, "utf8")) as { abi: unknown[]; bytecode: { object: Hex } };
};

const main = async (): Promise<void> => {
  if (DEPLOYED.proofGateway !== undefined && process.env.DEPLOY_REPLACE !== "1") {
    return fail(
      `a deployment is already recorded (${DEPLOYED.proofGateway}). Redeploy ORPHANS it and every market it holds; set DEPLOY_REPLACE=1 only if that is intended.`,
    );
  }
  const endpoints = readEndpoints(process.env);
  const clients = cc3Clients(endpoints.CC3_RPC_URL, readWorkerKey(process.env));
  const accounts = readWorkerAccounts(process.env);
  if (accounts.length !== 3) return fail(`expected 3 worker accounts, found ${accounts.length} (CONVENTIONS §9)`);
  if (accounts.includes(ESCROW)) return fail("escrow must be the segregated fourth account, never a worker key (NFR-3)");

  const now = (await clients.publicClient.getBlock()).timestamp;
  if (SEASON_END_SEC <= now) return fail(`seasonEnd ${SEASON_END_SEC} is not in the future (chain at ${now})`);
  log.info(`deploy: chain ${endpoints.CC3_RPC_URL}, deployer ${clients.walletClient.account.address}`);
  log.info(`deploy: creators/registrars ${accounts.join(", ")}`);
  log.info(`deploy: seasonEnd ${SEASON_END_SEC} (day ${SEASON_END_DAY}), escrow ${ESCROW}, pool 0 until manual funding`);

  const gatewayArtifact = artifactOf("ProofGateway");
  const deployHash = await clients.walletClient.deployContract({
    abi: proofGatewayAbi,
    bytecode: gatewayArtifact.bytecode.object,
    args: [accounts, accounts, { seasonEnd: SEASON_END_SEC, seasonEndDay: SEASON_END_DAY, escrow: ESCROW }],
  });
  const receipt = await clients.publicClient.waitForTransactionReceipt({ hash: deployHash });
  const gateway = receipt.contractAddress ?? fail("gateway deployment mined without a contract address");
  const core = await clients.publicClient.readContract({ address: gateway, abi: proofGatewayAbi, functionName: "leagueCore" });
  log.info(`deploy: ProofGateway ${gateway} (block ${receipt.blockNumber}, tx ${deployHash.slice(0, 18)}..)`);
  log.info(`deploy: LeagueCore  ${core} (deployed by the gateway's constructor)`);

  // Decoders: deploy, then register. The id comes from the event, never from a guess.
  const ids: Record<string, number> = {};
  for (const name of ["LidoRateRatioDecoder", "ContestRoundDecoder"] as const) {
    const artifact = artifactOf(name);
    const hash = await clients.walletClient.deployContract({
      abi: artifact.abi as never,
      bytecode: artifact.bytecode.object,
      args: [],
    });
    const decoderReceipt = await clients.publicClient.waitForTransactionReceipt({ hash });
    const decoder = decoderReceipt.contractAddress ?? fail(`${name} deployment mined without a contract address`);
    const registerHash = await clients.walletClient.writeContract({
      address: gateway,
      abi: proofGatewayAbi,
      functionName: "registerDecoder",
      args: [decoder],
    });
    const registerReceipt = await clients.publicClient.waitForTransactionReceipt({ hash: registerHash });
    const [registered] = parseEventLogs({
      abi: proofGatewayAbi,
      eventName: "DecoderRegistered",
      logs: registerReceipt.logs,
    });
    if (registered === undefined) return fail(`registerDecoder(${name}) emitted no DecoderRegistered`);
    ids[name] = registered.args.decoderId;
    log.info(`deploy: ${name} ${decoder} registered as decoderId ${registered.args.decoderId}`);
  }

  const contractsPath = fileURLToPath(new URL("../../../packages/chain/src/contracts.ts", import.meta.url));
  const source = readFileSync(contractsPath, "utf8");
  const record = `export const DEPLOYED: DeployedContracts = {
  // Creditcoin 3 testnet, ${new Date(Number(now) * 1000).toISOString().slice(0, 10)}: deployed by scripts in apps/worker/src/deploy.ts.
  // The gateway deployed its own LeagueCore (${core.slice(0, 10)}..) — derive it via
  // gateway.leagueCore(), never configure it here. Season: end ${SEASON_END_SEC}, escrow
  // is the segregated fourth account, pool 0 until the manual pre-window funding step.
  proofGateway: "${gateway}",
  deployBlock: ${receipt.blockNumber},
  contestSource: "${DEPLOYED.contestSource ?? ""}",
  lidoRateRatioDecoderId: ${ids.LidoRateRatioDecoder},
  contestRoundDecoderId: ${ids.ContestRoundDecoder},
};`;
  writeFileSync(contractsPath, source.replace(/export const DEPLOYED: DeployedContracts = \{[\s\S]*?\n\};/, record));
  log.info(`deploy: recorded in packages/chain/src/contracts.ts — run \`pnpm check\` and commit.`);
  log.info(`deploy: DONE. Explorer: ${endpoints.EXPLORER_BASE_CC3}/address/${gateway}`);
};

void main();
