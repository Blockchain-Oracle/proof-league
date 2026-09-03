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

// The day-1 spike's gate-2 run (docs/spike-day1.md): event age at first provability was
// 7.3 min (Sepolia) / 8.5 min (mainnet); steady-state attestation lag at start was 34-44
// blocks (~408-528 s). Both planes quote the SLOWER measured chain so no surface promises
// the favorable end (NFR-2).
export const MEASURED_TIMINGS: MeasuredTimings = {
  attestationSec: 510, // 8.5 min, mainnet — the slower measured event-age-at-provability
  recencyFloorSec: 528, // 44 blocks x 12 s, the larger observed steady-state lag
  measuredAt: "2026-09-02",
};

// FR-12 settlement policy (AD-7), all relative to the source event's occurredAt:
// target = measured attestation + this margin; at the alert line prove-anyway continues
// (NFR-1 > NFR-3); past the cost cliff the transparency log marks the proof over-cliff.
export const SETTLEMENT_TARGET_MARGIN_SEC = 300;
export const SETTLEMENT_ALERT_SEC = 45 * 60;
export const SETTLEMENT_COST_CLIFF_SEC = 60 * 60;

/// The one expected-settlement formula (AD-7): when a market's source event occurred at
/// `occurredAtSec`, settlement is expected by this moment; later than this is "running long".
export const expectedSettlementSecOf = (occurredAtSec: number): number =>
  occurredAtSec + MEASURED_TIMINGS.attestationSec + SETTLEMENT_TARGET_MARGIN_SEC;

export const utcDayOf = (unixSec: number): number => Math.floor(unixSec / 86400);

export const formatUtc = (unixSec: number): string =>
  new Date(unixSec * 1000).toISOString().replace(".000Z", " UTC").replace("T", " ");
