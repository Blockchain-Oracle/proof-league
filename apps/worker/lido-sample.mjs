// Pre-launch re-sample (Story 5.1 AC): read real TokenRebased reports from mainnet stETH
// and decode each with the EXACT derivation LidoRateRatioDecoder uses, so the launch
// boundary band is sized from observed data, never a guess. Lido reports once daily at
// 12:00:11 UTC, so we scan a narrow window around each expected report instead of a wide
// range no public RPC will serve.
import { createPublicClient, http, keccak256, toBytes, decodeAbiParameters } from "viem";
import { mainnet } from "viem/chains";

const STETH = "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84";
const topic0 = keccak256(toBytes("TokenRebased(uint256,uint256,uint256,uint256,uint256,uint256,uint256)"));
const YEAR = 365n * 24n * 60n * 60n;
const ONE = 10n ** 18n;
const DAYS = Number(process.argv[2] ?? 12);

const decode = (data) => {
  const [timeElapsed, preShares, preEther, postShares, postEther] = decodeAbiParameters(
    [{ type: "uint256" }, { type: "uint256" }, { type: "uint256" }, { type: "uint256" }, { type: "uint256" }, { type: "uint256" }],
    data,
  );
  const grown = postEther * preShares;
  const base = preEther * postShares;
  const num = grown > base ? grown - base : base - grown;
  const mag = (num * YEAR * ONE) / (base * timeElapsed);
  return grown >= base ? mag : -mag;
};

const url = process.env.ETH_MAINNET_RPC_URL ?? "https://eth.drpc.org";
const client = createPublicClient({ chain: mainnet, transport: http(url) });
const head = await client.getBlock();
const headSec = Number(head.timestamp);
const seen = new Map();
for (let d = 0; d < DAYS; d++) {
  // 12:00:11 UTC on each of the last DAYS days, converted to an estimated block at 12s.
  const day = Math.floor(headSec / 86400) - d;
  const target = day * 86400 + 12 * 3600 + 11;
  if (target > headSec) continue;
  const est = Number(head.number) - Math.floor((headSec - target) / 12);
  const from = BigInt(Math.max(0, est - 3600));
  const to = BigInt(Math.min(Number(head.number), est + 3600));
  try {
    const logs = await client.getLogs({ address: STETH, fromBlock: from, toBlock: to, topics: [topic0] });
    for (const l of logs) {
      // Defensive client-side filter: some public endpoints answer with a wider log set
      // than the topics filter asked for, so shape is re-checked here (6 non-indexed words).
      if (l.topics[0] !== topic0 || l.topics.length < 2 || l.data.length !== 2 + 192 * 2) continue;
      seen.set(Number(l.blockNumber), { ts: Number(BigInt(l.topics[1])), apr: decode(l.data) });
    }
  } catch (e) {
    console.error(`window ${from}-${to} failed: ${String(e).slice(0, 90)}`);
  }
}
const rows = [...seen.entries()].sort((a, b) => a[0] - b[0]);
console.log(`stETH TokenRebased, ${rows.length} reports (rpc ${url})`);
for (const [block, r] of rows) {
  console.log(`  ${new Date(r.ts * 1000).toISOString()}  block ${block}  APR ${(Number(r.apr) / 1e16).toFixed(4)}%  raw ${r.apr}`);
}
const vals = rows.map(([, r]) => Number(r.apr) / 1e16).sort((a, b) => a - b);
if (vals.length > 0) {
  const q = (p) => vals[Math.min(vals.length - 1, Math.floor(p * vals.length))];
  console.log(`SUMMARY n=${vals.length} min=${vals[0].toFixed(4)} p20=${q(0.2).toFixed(4)} p40=${q(0.4).toFixed(4)} p60=${q(0.6).toFixed(4)} p80=${q(0.8).toFixed(4)} max=${vals.at(-1).toFixed(4)}`);
}
