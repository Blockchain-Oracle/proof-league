// Pick-set merkle conformance fixture, armed (Story 2.5, AD-4/AD-5): re-derives every
// tree in pickset-vectors.json — the same file contracts/test/PickSetMerkle.t.sol holds
// against PickSetMerkle.sol — so tree-shape drift on either plane fails CI here instead
// of surfacing as a committed market whose proofs never verify.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { Hex } from "viem";
import {
  buildPickSetTree,
  commitmentRootOf,
  processPickSetProof,
  proofOf,
} from "./pickset-merkle.js";

type TreeVector = {
  readonly name: string;
  readonly leafCount: number;
  readonly leaves: readonly Hex[];
  readonly treeRoot: Hex;
  readonly commitmentRoot: Hex;
  readonly proofs: readonly (readonly Hex[])[];
};

const file = JSON.parse(
  readFileSync(fileURLToPath(new URL("./pickset-vectors.json", import.meta.url)), "utf8"),
) as { count: number; trees: TreeVector[] };

// The armed set carries the empty-proof single leaf, a full row, both padding shapes and
// the real-digest tree. A shrunken file must fail loudly, not pass emptily.
if (file.count < 5 || file.trees.length !== file.count) {
  throw new Error(`pickset selftest: vectors file lost its armed set (count=${file.count})`);
}

for (const t of file.trees) {
  const rebuilt = buildPickSetTree(t.leaves);
  if (rebuilt.treeRoot !== t.treeRoot) {
    throw new Error(`pickset selftest: ${t.name}: tree root drifted`);
  }
  if (rebuilt.commitmentRoot !== t.commitmentRoot) {
    throw new Error(`pickset selftest: ${t.name}: commitment root drifted`);
  }
  if (commitmentRootOf(t.treeRoot, t.leafCount) !== t.commitmentRoot) {
    throw new Error(`pickset selftest: ${t.name}: size binding drifted`);
  }
  t.leaves.forEach((leaf, i) => {
    const recorded = t.proofs[i] as readonly Hex[];
    if (JSON.stringify(proofOf(rebuilt, i)) !== JSON.stringify(recorded)) {
      throw new Error(`pickset selftest: ${t.name}: proof ${i} drifted`);
    }
    if (processPickSetProof(t.leafCount, i, leaf, recorded) !== t.treeRoot) {
      throw new Error(`pickset selftest: ${t.name}: proof ${i} does not verify`);
    }
    // Position binding is the whole point: the same proof at any OTHER in-range index
    // must imply a different root, or the scoring cursor is forgeable.
    for (let other = 0; other < t.leafCount; other += 1) {
      if (other !== i && processPickSetProof(t.leafCount, other, leaf, recorded) === t.treeRoot) {
        throw new Error(`pickset selftest: ${t.name}: proof ${i} also verifies at ${other}`);
      }
    }
  });
}

// The guards must THROW, never coerce (the outcome.selftest rule): a silently accepted
// out-of-range index or short proof is exactly the forgery class the verifier exists to stop.
const t0 = file.trees[4] as TreeVector;
const mustThrow: Array<[string, () => unknown]> = [
  ["index at leafCount", () => processPickSetProof(t0.leafCount, t0.leafCount, t0.leaves[0] as Hex, t0.proofs[0] as Hex[])],
  ["negative index", () => processPickSetProof(t0.leafCount, -1, t0.leaves[0] as Hex, t0.proofs[0] as Hex[])],
  ["truncated proof", () => processPickSetProof(t0.leafCount, 0, t0.leaves[0] as Hex, (t0.proofs[0] as Hex[]).slice(1))],
  ["empty-set tree build", () => buildPickSetTree([])],
];
for (const [name, run] of mustThrow) {
  let threw = false;
  try {
    run();
  } catch {
    threw = true;
  }
  if (!threw) throw new Error(`pickset selftest: ${name} was accepted`);
}

console.log(`pickset selftest: ${file.count} trees conform, guards reject`);
