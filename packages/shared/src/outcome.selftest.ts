// Outcome-mapping conformance fixture, armed (Story 2.4, AD-4/AD-8): re-derives every
// shared vector in outcome-vectors.json — the same file contracts/test/LeagueCoreResolve.t.sol
// holds against LeagueCore.winningOptionOf — so edge-semantics drift on either plane fails CI
// here instead of surfacing when `pnpm rebuild` diffs a live resolution.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { winningOptionIndex } from "./outcome.js";

type Vector = {
  readonly name: string;
  readonly value: string;
  readonly boundaries: readonly string[];
  readonly expected: number;
};

const file = JSON.parse(
  readFileSync(fileURLToPath(new URL("./outcome-vectors.json", import.meta.url)), "utf8"),
) as { count: number; vectors: Vector[] };

// The armed set carries every bucket, both edges of a threshold, and the blind-verified
// reference receipt. A shrunken file must fail loudly, not pass emptily.
if (file.count < 8 || file.vectors.length !== file.count) {
  throw new Error(`outcome selftest: vectors file lost its armed set (count=${file.count})`);
}

for (const v of file.vectors) {
  const got = winningOptionIndex(BigInt(v.value), v.boundaries);
  if (got !== v.expected) {
    throw new Error(`outcome selftest: ${v.name}: expected option ${v.expected}, got ${got}`);
  }
}

// Non-canonical boundary strings must THROW, never coerce (bare BigInt would read ""
// as 0n and accept hex/whitespace — a silently wrong bucket, exactly what the mirror
// exists to catch) [review 2026-09-03]. Count guards mirror BoundaryCountOutOfRange.
const rejected: Array<[string, readonly string[]]> = [
  ["empty string boundary", [""]],
  ["whitespace boundary", [" 5 "]],
  ["hex boundary", ["0x51dac207a000"]],
  ["decimal-point boundary", ["2.3e16"]],
  ["beyond int256", [(2n ** 255n).toString()]],
  ["zero thresholds", []],
  ["six thresholds", ["1", "2", "3", "4", "5", "6"]],
];

for (const [name, bounds] of rejected) {
  let threw = false;
  try {
    winningOptionIndex(0n, bounds);
  } catch {
    threw = true;
  }
  if (!threw) {
    throw new Error(`outcome selftest: mirror accepted a non-canonical input: ${name}`);
  }
}
console.log(`outcome mapping selftest green: ${file.count} vectors re-derived, ${rejected.length} malformed inputs all thrown`);
