// Time law: UTC everywhere; Creditcoin chain-head time is the only deciding clock (AD-10).
// Named shared constants live here so no route-local magic number can drift.

// Intake closes before lockTime so the snapshot boundary can never race the lock (AD-14).
export const INTAKE_QUIET_PERIOD_SEC = 60;
// createMarket/instantiateNext require sourceWindowOpen ≥ lockTime + this margin, so an unusably
// thin commit window is unrepresentable on-chain (AD-14).
export const MIN_COMMIT_MARGIN_SEC = 300;
// Season payout challenge window: long enough for the automated watcher, short enough to pay
// before judging ends (AD-17).
export const SEASON_CHALLENGE_WINDOW_SEC = 6 * 60 * 60;

// Measured settlement figures land here from the day-1 spike (Story 1.2). They are typed as
// possibly-unmeasured so no UI can print a documentation guess as if it were observed (NFR-2).
export type MeasuredTimings = {
  readonly attestationSec: number;
  readonly recencyFloorSec: number;
  readonly measuredAt: string; // ISO date of the measurement run
};

export const utcDayOf = (unixSec: number): number => Math.floor(unixSec / 86400);

export const formatUtc = (unixSec: number): string =>
  new Date(unixSec * 1000).toISOString().replace(".000Z", " UTC").replace("T", " ");
