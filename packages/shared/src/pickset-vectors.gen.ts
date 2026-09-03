// Generates pickset-vectors.json — the shared Solidity<->TS merkle conformance vectors
// (Story 2.5, AD-4/AD-5). The trees here are this module's (buildPickSetTree); the Foundry
// suite must reproduce every root and verify every proof from PickSetMerkle.sol's own
// index-walk, so the two constructions can only drift by failing CI.
// Regenerate: pnpm --filter @proof-league/shared exec tsx src/pickset-vectors.gen.ts
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { encodePacked, keccak256, type Hex } from "viem";
import { CC3_CHAIN_ID } from "@proof-league/chain";
import { hashPick, type PickMessage } from "./pick.js";
import { buildPickSetTree, proofOf } from "./pickset-merkle.js";

// Deterministic synthetic digests for the shape-only trees: what matters to the tree
// canon is padding, pairing and the size-bound root, not how a leaf was produced.
const syntheticLeaf = (tree: string, i: number): Hex =>
  keccak256(encodePacked(["string", "uint256"], [`pickset-vector:${tree}`, BigInt(i)]));

// One tree of REAL EIP-712 pick digests ties the leaf canon (pick.ts, already conformance
// gated) to the tree canon: a market of three players' final picks on the CC3 domain.
const domain = {
  chainId: CC3_CHAIN_ID,
  verifyingContract: "0x8334889B9c068e57078Da3376087ee2b7A7fd42B",
} as const;
const livePick = (player: Hex, nonce: number, stake: number, soFar: number): PickMessage => ({
  player,
  marketId: 7n,
  optionIndex: 2,
  stake,
  nonce,
  utcDay: 20699,
  stakedSoFarInDay: soFar,
});
const liveLeaves = [
  hashPick(domain, livePick("0x1111111111111111111111111111111111111111", 1, 40, 0)),
  hashPick(domain, livePick("0x2222222222222222222222222222222222222222", 1, 60, 0)),
  hashPick(domain, livePick("0xC8D9da124DCB6759da625461AA96BB74abbEF02b", 3, 40, 60)),
];

const shapes: Array<{ name: string; leaves: Hex[] }> = [
  // depth 0: the proof is empty and the tree root IS the leaf.
  { name: "single-leaf", leaves: [syntheticLeaf("single", 0)] },
  // depth 1, exactly full: no padding in play.
  { name: "two-leaves-full", leaves: [0, 1].map((i) => syntheticLeaf("two", i)) },
  // depth 2 with one padding slot: the odd-count case every real market can hit.
  { name: "three-leaves-padded", leaves: [0, 1, 2].map((i) => syntheticLeaf("three", i)) },
  // depth 3 with three padding slots: padding beyond the last pair.
  { name: "five-leaves-padded", leaves: [0, 1, 2, 3, 4].map((i) => syntheticLeaf("five", i)) },
  { name: "real-pick-digests", leaves: liveLeaves },
];

const trees = shapes.map(({ name, leaves }) => {
  const tree = buildPickSetTree(leaves);
  return {
    name,
    leafCount: tree.leafCount,
    leaves,
    treeRoot: tree.treeRoot,
    commitmentRoot: tree.commitmentRoot,
    proofs: leaves.map((_, i) => proofOf(tree, i)),
  };
});

const out = {
  description:
    "Pick-set merkle conformance vectors (Story 2.5, AD-4/AD-5): position-bound trees (left||right by index parity, zero-word padding to the next power of two) with size-bound commitment roots keccak256(abi.encode(treeRoot, leafCount)). Consumed by BOTH planes — packages/shared pickset-merkle.selftest.ts and contracts/test/PickSetMerkle.t.sol — so tree-shape drift fails CI instead of surfacing as an unscoreable committed market. Regenerate via src/pickset-vectors.gen.ts; hand-editing breaks the gate by design.",
  count: trees.length,
  trees,
};

writeFileSync(
  fileURLToPath(new URL("./pickset-vectors.json", import.meta.url)),
  `${JSON.stringify(out, null, 2)}\n`,
);
console.log(`pickset-vectors: wrote ${trees.length} trees`);
