// Pre-launch re-sample (Story 5.1's FR-6 admission checklist): reads real TokenRebased
// reports from mainnet stETH and decodes each one with an INDEPENDENT implementation of
// LidoRateRatioDecoder's derivation, so the launch boundary band is sized from observed
// data and decode feasibility is demonstrated rather than assumed. Reproducing the
// blind-verified 2.3785% reference (2026-08-22) from a second implementation is the
// check that matters; the distribution it prints is what docs/launch-lineup.md records.
// Frozen measurement evidence, not runtime code.
// Run: pnpm --filter @proof-league/worker exec tsx spike/lido-band.ts [days]
import { createPublicClient, decodeAbiParameters, http, keccak256, toBytes, type Hex } from "viem";
import { mainnet } from "@proof-league/chain";

const STETH = "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84";
const TOPIC0 = keccak256(toBytes("TokenRebased(uint256,uint256,uint256,uint256,uint256,uint256,uint256)"));
const YEAR = 365n * 24n * 60n * 60n;
const ONE = 10n ** 18n;
// Lido reports once daily at 12:00:11 UTC, so we scan a narrow window around each
// expected report rather than a wide range no public endpoint will serve.
const REPORT_SEC_OF_DAY = 12 * 3600 + 11;
const WINDOW_BLOCKS = 3600;
const DAYS = Number(process.argv[2] ?? 14);
// Needs an archive-capable endpoint: free heads refuse historical getLogs.
const RPC = process.env.ETH_MAINNET_RPC_URL ?? "https://eth.drpc.org";

// The decoder's exact derivation: APR = ((postEther/postShares)/(preEther/preShares) - 1)
// * YEAR / timeElapsed, cross-multiplied so nothing truncates before the final division.
const decodeApr = (data: Hex): bigint => {
  const [timeElapsed, preShares, preEther, postShares, postEther] = decodeAbiParameters(
    [
      { type: "uint256" },
      { type: "uint256" },
      { type: "uint256" },
      { type: "uint256" },
      { type: "uint256" },
      { type: "uint256" },
    ],
    data,
  );
  const grown = postEther * preShares;
  const base = preEther * postShares;
  const numerator = grown > base ? grown - base : base - grown;
  const magnitude = (numerator * YEAR * ONE) / (base * timeElapsed);
  return grown >= base ? magnitude : -magnitude;
};

const client = createPublicClient({ chain: mainnet, transport: http(RPC) });
const head = await client.getBlock();
const headSec = Number(head.timestamp);
const reports = new Map<number, { reportSec: number; apr: bigint }>();

for (let back = 0; back < DAYS; back++) {
  const target = (Math.floor(headSec / 86400) - back) * 86400 + REPORT_SEC_OF_DAY;
  if (target > headSec) continue;
  const estimate = Number(head.number) - Math.floor((headSec - target) / 12);
  const fromBlock = BigInt(Math.max(0, estimate - WINDOW_BLOCKS));
  const toBlock = BigInt(Math.min(Number(head.number), estimate + WINDOW_BLOCKS));
  try {
    const logs = await client.getLogs({ address: STETH, fromBlock, toBlock, topics: [TOPIC0] });
    for (const log of logs) {
      // Some endpoints answer with a wider set than the topic filter asked for, so the
      // shape is re-checked here: this event carries six non-indexed words.
      if (log.topics[0] !== TOPIC0 || log.topics[1] === undefined || log.data.length !== 2 + 192 * 2) continue;
      reports.set(Number(log.blockNumber), {
        reportSec: Number(BigInt(log.topics[1])),
        apr: decodeApr(log.data),
      });
    }
  } catch (error) {
    console.error(`lido-band: window ${fromBlock}-${toBlock} failed: ${String(error).slice(0, 80)}`);
  }
}

const rows = [...reports.entries()].sort((a, b) => a[0] - b[0]);
console.log(`lido-band: ${rows.length} reports from ${RPC}`);
for (const [block, row] of rows) {
  const percent = Number(row.apr) / 1e16;
  console.log(
    `  ${new Date(row.reportSec * 1000).toISOString()}  block ${block}  APR ${percent.toFixed(4)}%  raw ${row.apr}`,
  );
}
const values = rows.map(([, row]) => Number(row.apr) / 1e16).sort((a, b) => a - b);
if (values.length > 0) {
  const quantile = (p: number): number => values[Math.min(values.length - 1, Math.floor(p * values.length))] as number;
  console.log(
    `lido-band: LEVELS n=${values.length} min=${(values[0] as number).toFixed(4)} p20=${quantile(0.2).toFixed(4)} p40=${quantile(0.4).toFixed(4)} p60=${quantile(0.6).toFixed(4)} p80=${quantile(0.8).toFixed(4)} max=${(values.at(-1) as number).toFixed(4)}`,
  );
  // Day-over-day change is what sizes the ANCHORED offsets: each instance's boundaries
  // are the previous decoded value plus offsets, so the deltas are the real distribution.
  const ordered = rows.map(([, row]) => Number(row.apr) / 1e16);
  const deltas = ordered.slice(1).map((value, i) => Math.abs(value - (ordered[i] as number))).sort((a, b) => a - b);
  if (deltas.length > 0) {
    console.log(
      `lido-band: |DAY DELTA| n=${deltas.length} median=${(deltas[Math.floor(deltas.length / 2)] as number).toFixed(4)} max=${(deltas.at(-1) as number).toFixed(4)}`,
    );
  }
}
