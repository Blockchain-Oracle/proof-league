import { scriptLogger } from "./logger.js";

const log = scriptLogger();
import { keccak256, parseEventLogs, toBytes, type Address } from "viem";
import { DEPLOYED, leagueCoreAbi, proofGatewayAbi, readEndpoints } from "@proof-league/chain";
import { cc3Clients, readWorkerKey } from "./cc3.js";

// Story 5.1: the launch lineup, registered from the templates whose written admission
// checklists live in docs/launch-lineup.md. Registration is the LAST human act in market
// creation — from here the on-chain engine mints every instance itself and `pnpm rebuild`
// re-derives the parameters, so "chosen by nobody" holds from this transaction onward.
//
// Idempotent by intent: it refuses to register a template whose (emitter, event,
// firstSlotTime) already exists on-chain, so a re-run cannot double the lineup.

type Template = {
  readonly name: string;
  readonly sourceChainKey: bigint;
  readonly emitter: Address;
  readonly eventSignature: `0x${string}`;
  readonly subjectFilter: `0x${string}`;
  readonly externalSubject: boolean;
  readonly decoderId: number;
  readonly payoutN: number;
  readonly firstSlotTime: bigint;
  readonly slotPeriodSec: bigint;
  readonly lockLeadSec: bigint;
  readonly voidTailSec: bigint;
  readonly horizonTailSec: bigint;
  readonly preCreateLeadSec: bigint;
  readonly obsLagSec: bigint;
  readonly maxInstancesPerDay: number;
  readonly baseBoundaries: readonly bigint[];
  readonly anchorOffsets: readonly bigint[];
};

// 1e18-scale percentage points: 1% APR = 1e16, so one basis point = 1e14.
const pct = (value: number): bigint => BigInt(Math.round(value * 1e16));

const LINEUP: readonly Template[] = [
  {
    name: "Lido daily rate-ratio APR",
    // Ethereum mainnet per the day-1 spike's Mainnet-Read-Gate verdict.
    sourceChainKey: 3n,
    emitter: "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84",
    eventSignature: keccak256(
      toBytes("TokenRebased(uint256,uint256,uint256,uint256,uint256,uint256,uint256)"),
    ),
    // Zero: the indexed subject is the report timestamp, which changes every day. The
    // consequence (one shared sourceKey, 16 instances lifetime) is the named constraint
    // in docs/launch-lineup.md.
    subjectFilter: `0x${"00".repeat(32)}`,
    externalSubject: false,
    decoderId: DEPLOYED.lidoRateRatioDecoderId ?? 0,
    payoutN: 5,
    firstSlotTime: 1_788_523_200n, // 2026-09-04T12:00:00Z, the report lands at 12:00:11
    slotPeriodSec: 86_400n,
    lockLeadSec: 3_600n, // lock 11:00 UTC, an hour before the window opens
    voidTailSec: 86_400n,
    horizonTailSec: 0n, // determinismHorizon == sourceWindowOpen
    preCreateLeadSec: 21_600n, // 6 h: boundary freshness over pre-creation (AD-21)
    obsLagSec: 43_200n, // 12 h: yesterday's instance is the anchor, today's is not
    maxInstancesPerDay: 2,
    // First instance only (no prior observation): the observed quintile cuts.
    baseBoundaries: [pct(2.2), pct(2.215), pct(2.235), pct(2.26)],
    // Every later instance: previous decoded value plus these symmetric offsets.
    anchorOffsets: [pct(-0.05), pct(-0.015), pct(0.015), pct(0.05)],
  },
];

const fail = (message: string): never => {
  log.error(`register-series: ${message}`);
  process.exit(1);
};

const main = async (): Promise<void> => {
  const endpoints = readEndpoints(process.env);
  const gateway = DEPLOYED.proofGateway ?? fail("no deployment recorded — run the deploy script first");
  const clients = cc3Clients(endpoints.CC3_RPC_URL, readWorkerKey(process.env));
  const core = await clients.publicClient.readContract({
    address: gateway,
    abi: proofGatewayAbi,
    functionName: "leagueCore",
  });
  const contract = { address: core, abi: leagueCoreAbi } as const;

  const existing = await clients.publicClient.readContract({ ...contract, functionName: "seriesCount" });
  const registered: string[] = [];
  for (let seriesId = 1n; seriesId <= existing; seriesId++) {
    const template = await clients.publicClient.readContract({
      ...contract,
      functionName: "seriesTemplateOf",
      args: [seriesId],
    });
    registered.push(`${template.emitter.toLowerCase()}:${template.eventSignature}:${template.firstSlotTime}`);
  }

  for (const template of LINEUP) {
    if (template.decoderId === 0) {
      fail(`${template.name}: no decoderId recorded in DEPLOYED — register the decoder first`);
    }
    const key = `${template.emitter.toLowerCase()}:${template.eventSignature}:${template.firstSlotTime}`;
    if (registered.includes(key)) {
      log.info(`register-series: ${template.name} already registered, skipping`);
      continue;
    }
    const { name, ...onChain } = template;
    const hash = await clients.walletClient.writeContract({
      ...contract,
      functionName: "registerSeries",
      args: [onChain],
    });
    const receipt = await clients.publicClient.waitForTransactionReceipt({ hash });
    const [event] = parseEventLogs({ abi: leagueCoreAbi, eventName: "SeriesRegistered", logs: receipt.logs });
    if (event === undefined) return fail(`${name}: registerSeries emitted no SeriesRegistered`);
    log.info(`register-series: ${name} registered as series ${event.args.seriesId} (tx ${hash.slice(0, 18)}..)`);
    log.info(
      `register-series:   first slot ${new Date(Number(template.firstSlotTime) * 1000).toISOString()}, every ${Number(template.slotPeriodSec) / 3600} h`,
    );
  }
  log.info(`register-series: lineup live on ${core}. The engine mints from here; no human creation act remains.`);
};

void main();
