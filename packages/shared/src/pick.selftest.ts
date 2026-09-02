// EIP-712 conformance fixture, trivial-vector stage (AD-12): ships green from the first commit
// and is armed with real Solidity-vs-TS vectors in Story 2.2. The mutation check below proves the
// gate can actually go red — a fixture that cannot fail is not a gate.
import { hashPick, type PickDomain, type PickMessage } from "./pick.js";

const domain: PickDomain = {
  chainId: 1, // trivial self-test vector only; real vectors bind the CC3 chain id in Story 2.2
  verifyingContract: "0x0000000000000000000000000000000000000001",
};
const pick: PickMessage = {
  player: "0x0000000000000000000000000000000000000002",
  marketId: 1n,
  optionIndex: 0,
  stake: 10,
  nonce: 1,
  utcDay: 20700,
  stakedSoFarInDay: 10,
};

const a = hashPick(domain, pick);
const b = hashPick(domain, pick);
if (a !== b) throw new Error("selftest: hashing is not deterministic");

// Mutation check: perturbing any single field must change the hash, or the commitment scheme
// would let two different Picks share a leaf.
const mutations: PickMessage[] = [
  { ...pick, stake: 11 },
  { ...pick, nonce: 2 },
  { ...pick, optionIndex: 1 },
  { ...pick, utcDay: 20701 },
  { ...pick, stakedSoFarInDay: 20 },
  { ...pick, marketId: 2n },
  { ...pick, player: "0x0000000000000000000000000000000000000003" },
];
for (const m of mutations) {
  if (hashPick(domain, m) === a) throw new Error(`selftest: mutation did not change hash: ${JSON.stringify(m, (_, v) => typeof v === "bigint" ? v.toString() : v)}`);
}
console.log(`eip712 selftest green: ${a}`);
