// Config-mirror conformance vectors (AD-3): every vector the chain rejects in
// contracts/test/LeagueCore.t.sol must also be rejected by the zod mirror, or intake
// would accept a Market the chain refuses to mint. Clock-dependent admission (born-locked)
// is chain-only: the mirror validates structure, never wall time.
import { marketConfigSchema, type MarketConfig } from "./config.js";

const valid: MarketConfig = {
  sourceChainKey: 3, // Ethereum mainnet per the day-1 spike probe
  emitter: "0x17144556fd3424EDC8Fc8A4C940B2D04936d17eb",
  eventSignature: "0x" + "ab".repeat(32),
  subjectFilter: "0x" + "00".repeat(32),
  decoderId: 1,
  boundaries: ["22000000000000000", "22500000000000000", "23000000000000000", "23500000000000000"],
  payoutN: 5, // 4 thresholds carve 5 open-ended-outer options; Payout law: N == option count
  leagueDay: 1,
  lockTimeSec: 1_756_003_600,
  sourceWindowOpenSec: 1_756_003_900, // exactly lock + MIN_COMMIT_MARGIN: boundary admissible
  voidDeadlineSec: 1_756_090_300,
  determinismHorizonSec: 1_756_003_900,
};

if (!marketConfigSchema.safeParse(valid).success) {
  throw new Error("config selftest: the baseline admissible config was rejected");
}

// Each mutation mirrors one on-chain revert; the mirror must reject it too.
const rejected: Array<[string, MarketConfig]> = [
  ["payoutN != thresholds + 1", { ...valid, payoutN: 4 }],
  ["equal adjacent thresholds", { ...valid, boundaries: ["1", "2", "2", "3"], payoutN: 5 }],
  ["descending thresholds", { ...valid, boundaries: ["3", "1"], payoutN: 3 }],
  ["zero thresholds", { ...valid, boundaries: [], payoutN: 1 }],
  ["six thresholds", { ...valid, boundaries: ["1", "2", "3", "4", "5", "6"], payoutN: 7 }],
  ["thin commit window", { ...valid, sourceWindowOpenSec: valid.lockTimeSec + 299 }],
  ["void clock not longest", { ...valid, voidDeadlineSec: valid.sourceWindowOpenSec }],
  ["lock at determinism horizon", { ...valid, determinismHorizonSec: valid.lockTimeSec }],
  ["zero chainKey", { ...valid, sourceChainKey: 0 }],
  ["non-hex event signature", { ...valid, eventSignature: "TokenRebased(uint256)" }],
  ["zero-hash event signature", { ...valid, eventSignature: "0x" + "00".repeat(32) }],
  ["zero-address emitter", { ...valid, emitter: `0x${"00".repeat(20)}` }],
  ["malformed emitter", { ...valid, emitter: "0xnothex" }],
  ["short emitter", { ...valid, emitter: "0x1234" }],
  ["boundary beyond int256", { ...valid, boundaries: [(2n ** 255n).toString()], payoutN: 2 }],
  ["zero decoderId", { ...valid, decoderId: 0 }],
  ["decoderId beyond uint32", { ...valid, decoderId: 2 ** 32 }],
  ["leagueDay beyond uint32", { ...valid, leagueDay: 2 ** 32 }],
];

for (const [name, config] of rejected) {
  if (marketConfigSchema.safeParse(config).success) {
    throw new Error(`config selftest: mirror accepted a chain-rejected config: ${name}`);
  }
}
console.log("config mirror selftest green");
