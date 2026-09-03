// The value->option mapping, mirrored from LeagueCore.winningOptionOf (AD-4, FR-7):
// N-1 strictly ascending thresholds carve N buckets with open-ended outer ones, each
// threshold the INCLUSIVE lower edge of the bucket above it — option i wins exactly when
// boundaries[i-1] <= value < boundaries[i]. The on-chain copy is the authority; `pnpm
// rebuild` (AD-8) recomputes this over emitted resolutions and diffs the two planes.
// Values and boundaries are 1e18 fixed-point int256 carried as bigint/decimal strings —
// JS numbers cannot hold them (the config.ts rule).

// config.ts's int256-string law enforced again here [review 2026-09-03]: bare BigInt()
// silently coerces "" to 0n and accepts "0x…"/whitespace, so re-read boundaries (DB row,
// JSON file, hex-serialized event data) would yield a wrong-but-plausible bucket instead
// of a loud error — and a silent mirror cannot referee the chain.
const INT256_STRING = /^-?\d+$/;
const INT256_MAX = 2n ** 255n - 1n;
const INT256_MIN = -(2n ** 255n);

export const winningOptionIndex = (value: bigint, boundaries: readonly string[]): number => {
  // The admission bound (1-5 thresholds), enforced like the on-chain mapper enforces it.
  if (boundaries.length < 1 || boundaries.length > 5) {
    throw new Error(`winningOptionIndex: ${boundaries.length} thresholds; admission allows 1-5`);
  }
  let crossed = 0;
  for (const boundary of boundaries) {
    if (!INT256_STRING.test(boundary)) {
      throw new Error(`winningOptionIndex: non-canonical int256 string: ${JSON.stringify(boundary)}`);
    }
    const threshold = BigInt(boundary);
    if (threshold < INT256_MIN || threshold > INT256_MAX) {
      throw new Error(`winningOptionIndex: boundary beyond int256: ${boundary}`);
    }
    if (value >= threshold) crossed += 1;
  }
  return crossed;
};
