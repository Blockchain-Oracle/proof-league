// Payout law (PRD Glossary): gross return = stake × N where N = the Market's option count, so
// random play is exactly break-even on every Market shape — skill is the only edge.
export const PICK_POINTS_DAILY = 100; // free daily allowance; resets 00:00 UTC; never replenished by winnings
export const MIN_STAKE = 10; // floor keeps a Pick a real commitment instead of dust-spam

export const grossPayout = (stake: number, optionCount: number): number => stake * optionCount;
export const netGain = (stake: number, optionCount: number): number => stake * (optionCount - 1);

export const isValidStake = (stake: number, remainingToday: number): boolean =>
  Number.isInteger(stake) && stake >= MIN_STAKE && stake <= remainingToday;

// FR-19's deterministic total order, the exact mirror of LeagueSeason._beats [amendment
// 2026-08-27]: Season Points desc, then current Streak desc, then earliest commitment
// appearance asc, then address asc as the final key — no tie is representable. The
// projector ranks the leaderboard with it and `pnpm rebuild` re-derives that ranking.
export type StandingKey = {
  readonly player: string; // 0x address, any casing — compared numerically
  readonly seasonPoints: bigint;
  readonly streak: number;
  readonly earliestCommitOrdinal: number;
};

export const compareStandings = (a: StandingKey, b: StandingKey): number => {
  if (a.seasonPoints !== b.seasonPoints) return a.seasonPoints > b.seasonPoints ? -1 : 1;
  if (a.streak !== b.streak) return b.streak - a.streak;
  if (a.earliestCommitOrdinal !== b.earliestCommitOrdinal) return a.earliestCommitOrdinal - b.earliestCommitOrdinal;
  const pa = BigInt(a.player);
  const pb = BigInt(b.player);
  return pa < pb ? -1 : pa > pb ? 1 : 0;
};
