// Day-1 spike gate 2: the attestation wall-clock (Story 1.2). Marks a fresh head block on each
// live source chain, then polls CC3's latestAttested until it covers that block. Produces the
// FR-12 figures: wall-clock to attestation-coverage and the event-age at coverage (how old a
// source event is when it first becomes provable), plus the steady-state lag observed at start
// (the recency-floor bound). The ~15s proof-verification leg is measured separately when the
// first real verify lands (Story 2.3) — this script never claims it.
// Run: pnpm --filter @proof-league/worker exec tsx spike/attestation-clock.ts
import { JsonRpcProvider } from "ethers";
import { chainInfo } from "@gluwa/usc-sdk";
import { readEndpoints, mainnet, sepolia } from "@proof-league/chain";

const POLL_SEC = 15;
// Docs claim ~8-10 min attestation with a 20-min ceiling; we allow 40 min and report honestly.
const CEILING_MIN = 40;

const endpoints = readEndpoints(process.env);
const cc3 = new JsonRpcProvider(endpoints.CC3_RPC_URL);
const provider = new chainInfo.PrecompileChainInfoProvider(cc3);

type Watch = {
  label: string;
  chainKey: number;
  rpc: JsonRpcProvider;
  targetBlock: number;
  targetTs: number;
  startLagBlocks: number;
  startedAtMs: number;
};

const fmtMin = (ms: number): string => `${(ms / 60000).toFixed(1)} min`;

const openWatch = async (label: string, chainKey: number, rpcUrl: string): Promise<Watch | undefined> => {
  const rpc = new JsonRpcProvider(rpcUrl);
  const head = await rpc.getBlockNumber();
  const block = await rpc.getBlock(head);
  if (!block) return undefined;
  const attested = await provider.getLatestAttestedHeightAndHash(chainKey);
  const startLagBlocks = attested.exists ? head - Number(attested.height) : -1;
  console.log(
    `${label}: watching block ${head} (ts ${new Date(block.timestamp * 1000).toISOString()}), ` +
      `latestAttested=${attested.exists ? attested.height : "none"} startLag=${startLagBlocks} blocks`,
  );
  return { label, chainKey, rpc, targetBlock: head, targetTs: block.timestamp, startLagBlocks, startedAtMs: Date.now() };
};

const run = async (): Promise<void> => {
  console.log(`attestation clock started ${new Date().toISOString()} against ${endpoints.CC3_RPC_URL}`);
  const chains = await provider.getSupportedChains();
  const watches: Watch[] = [];
  for (const [label, id, rpcUrl] of [
    ["mainnet", mainnet.id, endpoints.ETH_MAINNET_RPC_URL ?? mainnet.rpcUrls.default.http[0]],
    ["sepolia", sepolia.id, endpoints.SEPOLIA_RPC_URL],
  ] as const) {
    const entry = chains.find((c) => Number(c.chainId) === id);
    if (!entry) {
      console.log(`${label}: not among supported chains - skipped`);
      continue;
    }
    const watch = await openWatch(label, Number(entry.chainKey), rpcUrl);
    if (watch) watches.push(watch);
  }

  const pending = new Set(watches);
  const deadline = Date.now() + CEILING_MIN * 60_000;
  while (pending.size > 0 && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, POLL_SEC * 1000));
    for (const w of [...pending]) {
      const attested = await provider.getLatestAttestedHeightAndHash(w.chainKey);
      if (!attested.exists || Number(attested.height) < w.targetBlock) continue;
      pending.delete(w);
      const nowMs = Date.now();
      const wallClockMs = nowMs - w.startedAtMs;
      const eventAgeMs = nowMs - w.targetTs * 1000;
      console.log(
        `${w.label}: ATTESTED block ${w.targetBlock} covered by ${attested.height} at ${new Date(nowMs).toISOString()}\n` +
          `  wall-clock from head-mark to coverage: ${fmtMin(wallClockMs)}\n` +
          `  event age at first provability:       ${fmtMin(eventAgeMs)} (the FR-12 input)\n` +
          `  steady-state lag at start:            ${w.startLagBlocks} blocks`,
      );
    }
  }
  for (const w of pending) {
    console.log(`${w.label}: NOT covered within ${CEILING_MIN} min (target ${w.targetBlock}) - record as a miss, investigate`);
  }
  process.exit(pending.size > 0 ? 1 : 0);
};

run().catch((error) => {
  console.error("attestation clock failed:", error);
  process.exit(1);
});
