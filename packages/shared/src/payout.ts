// Payout law (PRD Glossary): gross return = stake × N where N = the Market's option count, so
// random play is exactly break-even on every Market shape — skill is the only edge.
export const PICK_POINTS_DAILY = 100; // free daily allowance; resets 00:00 UTC; never replenished by winnings
export const MIN_STAKE = 10; // floor keeps a Pick a real commitment instead of dust-spam

export const grossPayout = (stake: number, optionCount: number): number => stake * optionCount;
export const netGain = (stake: number, optionCount: number): number => stake * (optionCount - 1);

export const isValidStake = (stake: number, remainingToday: number): boolean =>
  Number.isInteger(stake) && stake >= MIN_STAKE && stake <= remainingToday;
