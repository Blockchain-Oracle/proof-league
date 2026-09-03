import { encodeAbiParameters, encodePacked, keccak256, type Hex } from "viem";

// The canonical pick-set commitment tree (Story 2.5, AD-4/AD-5) — the exact mirror of
// contracts/src/PickSetMerkle.sol, held identical by pickset-vectors.json in CI. Two
// deliberate deviations from the common sorted-pair merkle idiom, both load-bearing:
// pairing is POSITION-BOUND (left||right by index parity, never sorted) because the
// (player asc, nonce asc) ordering is part of the commitment and the scoring cursor is
// only exactly-once if a proof binds its leaf to one index; and the committed root is
// SIZE-BOUND — keccak256(abi.encode(treeRoot, leafCount)) — because commitPicks stores a
// single bytes32 and the cursor needs the set's length on-chain.
//
// For the Story 2.2 publication half: leaves arrive already sorted (player asc, nonce
// asc), where "player asc" is NUMERIC address order — sort lowercase-hex strings or
// BigInt(address), never checksummed strings (ASCII 'B' < 'a' breaks the order and the
// chain would skip honest picks as OutOfOrder).

// The canonical zero-pick commitment (AD-14): state, not the root value, signals committed.
export const EMPTY_PICKSET_ROOT: Hex = `0x${"00".repeat(32)}`;

// Both planes' shared set-size ceiling (mirrors PickSetMerkle.MAX_LEAF_COUNT): past 2^31
// this module's int32 index walk would diverge from Solidity's uint256 walk, and the
// on-chain depth probe needs a terminating bound — so the canon bounds leafCount itself.
export const MAX_PICKSET_LEAVES = 2 ** 31 - 1;

// Trees pad to the next power of two with the zero word; a padding slot can never score
// because the verifier range-checks every index against the bound leafCount.
const ZERO_LEAF: Hex = `0x${"00".repeat(32)}`;

export type PickSetTree = {
  readonly leafCount: number;
  // layers[0] is the padded leaf row; the last layer is [treeRoot].
  readonly layers: readonly (readonly Hex[])[];
  readonly treeRoot: Hex;
  // What commitPicks stores on-chain and scoreBatch opens.
  readonly commitmentRoot: Hex;
};

export const commitmentRootOf = (treeRoot: Hex, leafCount: number): Hex =>
  keccak256(
    encodeAbiParameters(
      [{ type: "bytes32" }, { type: "uint256" }],
      [treeRoot, BigInt(leafCount)],
    ),
  );

// Padded-tree depth: the unique d with 2^(d-1) < leafCount <= 2^d (0 for a single leaf).
export const depthOf = (leafCount: number): number => {
  let depth = 0;
  while (2 ** depth < leafCount) depth += 1;
  return depth;
};

const hashPair = (left: Hex, right: Hex): Hex =>
  keccak256(encodePacked(["bytes32", "bytes32"], [left, right]));

// Builds the full canonical tree from ordered leaves (full EIP-712 pick digests via
// hashPick — the leaf encoding is pick.ts's job, not this module's). The empty set has
// no tree: callers commit EMPTY_PICKSET_ROOT directly.
export const buildPickSetTree = (leaves: readonly Hex[]): PickSetTree => {
  if (leaves.length === 0) {
    throw new Error("pickset-merkle: the empty set commits EMPTY_PICKSET_ROOT, not a tree");
  }
  if (leaves.length > MAX_PICKSET_LEAVES) {
    throw new Error(`pickset-merkle: ${leaves.length} leaves outside the canon's bound`);
  }
  const depth = depthOf(leaves.length);
  const padded = [...leaves, ...Array<Hex>(2 ** depth - leaves.length).fill(ZERO_LEAF)];
  const layers: Hex[][] = [padded];
  for (let level = 0; level < depth; level += 1) {
    const below = layers[level] as readonly Hex[];
    const row: Hex[] = [];
    for (let i = 0; i < below.length; i += 2) {
      row.push(hashPair(below[i] as Hex, below[i + 1] as Hex));
    }
    layers.push(row);
  }
  const treeRoot = (layers[depth] as readonly Hex[])[0] as Hex;
  return {
    leafCount: leaves.length,
    layers,
    treeRoot,
    commitmentRoot: commitmentRootOf(treeRoot, leaves.length),
  };
};

// The sibling path for one leaf, exactly depthOf(leafCount) hashes long — the on-chain
// verifier rejects any other length, so a truncated proof can never verify shallower.
export const proofOf = (tree: PickSetTree, index: number): Hex[] => {
  if (index < 0 || index >= tree.leafCount) {
    throw new Error(`pickset-merkle: leaf index ${index} outside set of ${tree.leafCount}`);
  }
  const proof: Hex[] = [];
  let cursor = index;
  for (let level = 0; level < tree.layers.length - 1; level += 1) {
    const row = tree.layers[level] as readonly Hex[];
    proof.push(row[cursor ^ 1] as Hex);
    cursor >>= 1;
  }
  return proof;
};

// The verifier mirror of PickSetMerkle.processProof, for `pnpm rebuild` and the
// selftest: folds the leaf up its index's bit path and returns the implied tree root.
export const processPickSetProof = (
  leafCount: number,
  index: number,
  leaf: Hex,
  proof: readonly Hex[],
): Hex => {
  if (!Number.isInteger(leafCount) || leafCount < 1 || leafCount > MAX_PICKSET_LEAVES) {
    throw new Error(`pickset-merkle: leafCount ${leafCount} outside the canon's bound`);
  }
  if (index < 0 || index >= leafCount) {
    throw new Error(`pickset-merkle: leaf index ${index} outside set of ${leafCount}`);
  }
  if (proof.length !== depthOf(leafCount)) {
    throw new Error(`pickset-merkle: proof length ${proof.length} for a set of ${leafCount}`);
  }
  let node = leaf;
  let cursor = index;
  for (const sibling of proof) {
    node = cursor % 2 === 1 ? hashPair(sibling, node) : hashPair(node, sibling);
    cursor >>= 1;
  }
  return node;
};
