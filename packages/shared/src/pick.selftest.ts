// EIP-712 conformance fixture, armed (Story 2.2, AD-5): re-derives every shared vector in
// eip712-vectors.json — the same file contracts/test/PickLeaf.t.sol holds against LeagueCore's
// abi.encode leaf — so viem drift, schema edits and accidental vector corruption all fail CI
// from this side too. The mutation check proves the gate can actually go red — a fixture that
// cannot fail is not a gate.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { hashPick, type PickDomain, type PickMessage } from "./pick.js";

type Vector = {
  readonly name: string;
  readonly chainId: number;
  readonly verifyingContract: PickDomain["verifyingContract"];
  readonly pick: {
    readonly player: PickMessage["player"];
    readonly marketId: string;
    readonly optionIndex: number;
    readonly stake: number;
    readonly nonce: number;
    readonly utcDay: number;
    readonly stakedSoFarInDay: number;
  };
  readonly digest: string;
};

const file = JSON.parse(
  readFileSync(fileURLToPath(new URL("./eip712-vectors.json", import.meta.url)), "utf8"),
) as { count: number; vectors: Vector[] };

// The armed set carries at least: representative, type-ceilings, tombstone, domain-separation.
// A shrunken file must fail loudly, not pass emptily.
if (file.count < 4 || file.vectors.length !== file.count) {
  throw new Error(`selftest: vectors file lost its armed set (count=${file.count})`);
}

const toMessage = (v: Vector): PickMessage => ({
  player: v.pick.player,
  marketId: BigInt(v.pick.marketId),
  optionIndex: v.pick.optionIndex,
  stake: v.pick.stake,
  nonce: v.pick.nonce,
  utcDay: v.pick.utcDay,
  stakedSoFarInDay: v.pick.stakedSoFarInDay,
});
const toDomain = (v: Vector): PickDomain => ({
  chainId: v.chainId,
  verifyingContract: v.verifyingContract,
});

for (const v of file.vectors) {
  const derived = hashPick(toDomain(v), toMessage(v));
  if (derived !== v.digest) {
    throw new Error(`selftest: digest mismatch on vector "${v.name}": derived ${derived}, recorded ${v.digest}`);
  }
}

// Mutation check on the representative vector, selected by name — position-coupling to the
// generator's ordering would turn a reorder into overflow noise on the +1 perturbations.
// Perturbing any single field — message or domain — must change the hash, or two different
// Picks could share a leaf.
const base = file.vectors.find((v) => v.name === "representative");
if (!base) throw new Error("selftest: representative vector missing from fixture");
const domain = toDomain(base);
const pick = toMessage(base);
const anchor = hashPick(domain, pick);

const messageMutations: PickMessage[] = [
  { ...pick, player: "0x000000000000000000000000000000000000dEaD" },
  { ...pick, marketId: pick.marketId + 1n },
  { ...pick, optionIndex: pick.optionIndex + 1 },
  { ...pick, stake: pick.stake + 1 },
  { ...pick, nonce: pick.nonce + 1 },
  { ...pick, utcDay: pick.utcDay + 1 },
  { ...pick, stakedSoFarInDay: pick.stakedSoFarInDay + 1 },
];
for (const m of messageMutations) {
  if (hashPick(domain, m) === anchor) {
    throw new Error(`selftest: mutation did not change hash: ${JSON.stringify(m, (_, v) => (typeof v === "bigint" ? v.toString() : v))}`);
  }
}
const domainMutations: PickDomain[] = [
  { ...domain, chainId: domain.chainId + 1 },
  { ...domain, verifyingContract: "0x000000000000000000000000000000000000dEaD" },
];
for (const d of domainMutations) {
  if (hashPick(d, pick) === anchor) {
    throw new Error(`selftest: domain mutation did not change hash: ${JSON.stringify(d)}`);
  }
}

console.log(`eip712 selftest green: ${file.count} vectors re-derived, ${messageMutations.length + domainMutations.length} mutations all moved the digest`);
