import { PICK_POINTS_DAILY } from "./payout.js";
import { err, ok, type Result } from "./result.js";
import { INTAKE_QUIET_PERIOD_SEC, utcDayOf } from "./time.js";
import type { ContractMarketState } from "./market-state.js";

// Pick intake law (Story 3.3, AD-2/AD-5/AD-14/AD-15). These are the rules a signed Pick
// must satisfy before it is stored as a draft, written once as pure functions so the web
// route, the worker's evidence runs and any later client all refuse the same things for
// the same reasons.
//
// Two of these rules exist because the CHAIN CANNOT CHECK THEM, which makes intake the
// only place they can be enforced:
//
//   utcDay. A Pick signs its own UTC day, and LeagueScoring meters the daily allowance by
//   that signed number. The contract has no way to know what day it really was when the
//   signature was made, so a client free to write any day gets a fresh 100 points per
//   fabricated day. Intake binds the signed day to the day the pick actually arrived.
//
//   stakedSoFarInDay. The allowance is enforced by a signed cumulative prefix, which is
//   what makes the decision a pure function of the pick and therefore independent of the
//   order batches are scored in. LeagueScoring's own comment names the trap: the
//   cumulative counts LIVE lower-nonce stakes ONLY. A client that includes a pick's own
//   superseded predecessors signs a number that is too high, and the chain silently skips
//   the player's final word as OverBudget. So intake computes the value it expects and
//   refuses a mismatch rather than storing a pick that is already doomed.

export type IntakeDraft = {
  readonly marketId: string;
  readonly nonce: number;
  readonly stake: number;
  readonly utcDay: number;
};

export type IntakeCandidate = {
  readonly marketId: string;
  readonly optionIndex: number;
  readonly stake: number;
  readonly nonce: number;
  readonly utcDay: number;
  readonly stakedSoFarInDay: number;
};

export type IntakeMarket = {
  readonly marketId: string;
  readonly payoutN: number;
  readonly lockTimeSec: number;
  readonly state: ContractMarketState;
};

export type IntakeRefusal =
  | "market-not-open"
  | "intake-closed"
  | "wrong-utc-day"
  | "option-out-of-range"
  | "stake-out-of-range"
  | "nonce-not-higher"
  | "cumulative-mismatch"
  | "over-allowance";

/// Intake closes a quiet period BEFORE lock (AD-14) so the worker's snapshot boundary can
/// never race a pick arriving in the same second the market locks.
export const intakeClosesAtSec = (lockTimeSec: number): number => lockTimeSec - INTAKE_QUIET_PERIOD_SEC;

/// The cumulative the candidate must carry: the player's LIVE spend for this UTC day at
/// the moment this nonce takes effect. One live pick per market (the highest nonce below
/// this one), this market excluded because the candidate replaces its own predecessor,
/// and a zero-stake tombstone contributes nothing because it holds no position.
export const liveStakedBeforeNonce = (
  drafts: readonly IntakeDraft[],
  utcDay: number,
  marketId: string,
  nonce: number,
): number => {
  const liveByMarket = new Map<string, IntakeDraft>();
  for (const draft of drafts) {
    if (draft.utcDay !== utcDay) continue;
    if (draft.marketId === marketId) continue;
    if (draft.nonce >= nonce) continue;
    const held = liveByMarket.get(draft.marketId);
    if (held === undefined || draft.nonce > held.nonce) liveByMarket.set(draft.marketId, draft);
  }
  let total = 0;
  for (const draft of liveByMarket.values()) total += draft.stake;
  return total;
};

const isCount = (value: number): boolean => Number.isInteger(value) && value >= 0;

/// The whole admission decision, in the order that produces the most useful refusal: what
/// is true of the market first, then of the clock, then of the pick itself.
export const admitPick = (
  candidate: IntakeCandidate,
  market: IntakeMarket,
  drafts: readonly IntakeDraft[],
  nowSec: number,
): Result<{ readonly stakedSoFarInDay: number }, IntakeRefusal> => {
  // Only a market that has not committed can take drafts: after commitPicks the published
  // set and its on-chain root are the truth, and nothing can be added to them.
  if (market.state !== "Created") return err("market-not-open");
  if (nowSec >= intakeClosesAtSec(market.lockTimeSec)) return err("intake-closed");
  if (candidate.utcDay !== utcDayOf(nowSec)) return err("wrong-utc-day");
  if (!isCount(candidate.optionIndex) || candidate.optionIndex >= market.payoutN) {
    return err("option-out-of-range");
  }
  if (!isCount(candidate.stake) || candidate.stake > PICK_POINTS_DAILY) return err("stake-out-of-range");
  if (!isCount(candidate.nonce)) return err("nonce-not-higher");

  // Nonces are per player and monotonic across the whole deployment, not per market: the
  // cumulative prefix is a day-level running total in nonce order, so two markets sharing
  // a nonce would make that total ambiguous.
  const highest = drafts.reduce((max, draft) => Math.max(max, draft.nonce), -1);
  if (candidate.nonce <= highest) return err("nonce-not-higher");

  const expected = liveStakedBeforeNonce(drafts, candidate.utcDay, candidate.marketId, candidate.nonce);
  if (candidate.stakedSoFarInDay !== expected) return err("cumulative-mismatch");
  if (expected + candidate.stake > PICK_POINTS_DAILY) return err("over-allowance");
  return ok({ stakedSoFarInDay: expected });
};

/// What a composer needs before it can ask for a signature: the next legal nonce and the
/// cumulative that nonce must carry, derived by the same functions that will judge it.
export const intakeState = (
  drafts: readonly IntakeDraft[],
  utcDay: number,
  marketId: string,
): { readonly nextNonce: number; readonly stakedSoFarInDay: number; readonly remaining: number } => {
  const nextNonce = drafts.reduce((max, draft) => Math.max(max, draft.nonce), -1) + 1;
  const stakedSoFarInDay = liveStakedBeforeNonce(drafts, utcDay, marketId, nextNonce);
  return { nextNonce, stakedSoFarInDay, remaining: PICK_POINTS_DAILY - stakedSoFarInDay };
};
