import { MIN_STAKE, grossPayout, err, ok, type Result } from "@proof-league/shared";

// The composer's state machine, as a pure module (CONVENTIONS section 5). No React, no
// fetch, no timers: the .tsx renders what this returns, which is what keeps the rules
// readable and keeps a phase from being advanced by a spinner rather than by an event.
//
// Three rules inherited from the reference state models and kept deliberately:
//   - progress advances only on a REAL event, never on elapsed time;
//   - the reached phase is a maximum, so a late or duplicate event cannot walk it back;
//   - the blocked headline comes from the phase actually reached, never a hardcoded guess.

/// Ordered, because the order is what "how far did this get" means. `accepted` is terminal.
export const COMPOSER_PHASES = [
  "idle",
  "editing",
  "reviewing",
  "authenticating",
  "signing",
  "submitting",
  "accepted",
] as const;

export type ComposerPhase = (typeof COMPOSER_PHASES)[number];

const indexOfPhase = (phase: ComposerPhase): number => COMPOSER_PHASES.indexOf(phase);

/// The furthest of two phases. Every phase transition goes through this, so an event that
/// arrives out of order can move the tracker forward and never backward.
export const furthestPhase = (reached: ComposerPhase, next: ComposerPhase): ComposerPhase =>
  indexOfPhase(next) > indexOfPhase(reached) ? next : reached;

/// Whether a failure at this phase could have left a Pick behind. Only submission can:
/// everything before it happened entirely in the browser. This is what decides whether the
/// player is told to reload before signing again.
export const couldHaveReachedIntake = (reached: ComposerPhase): boolean =>
  indexOfPhase(reached) >= indexOfPhase("submitting");

export type Draft = {
  /// Undefined until the player chooses. Not defaulted to option 0, because a Pick nobody
  /// consciously made is not a Pick.
  readonly optionIndex: number | undefined;
  readonly stake: number;
};

export type DraftProblem = "no-option" | "no-allowance" | "below-minimum" | "over-remaining";

export const DRAFT_PROBLEM_COPY = {
  "no-option": "Choose the option you think the value will land in.",
  "no-allowance": "You have spent today's free points. The allowance resets at 00:00 UTC.",
  "below-minimum": `Picks start at ${MIN_STAKE} points, so a Pick is a real commitment rather than dust.`,
  "over-remaining": "That is more than you have left of today's free points.",
} satisfies Record<DraftProblem, string>;

export type ValidDraft = { readonly optionIndex: number; readonly stake: number };

/// The whole draft decision, in the order that produces the most useful message: what the
/// player has not chosen yet, then what today allows, then the amount itself.
export const validateDraft = (draft: Draft, remaining: number): Result<ValidDraft, DraftProblem> => {
  if (draft.optionIndex === undefined) return err("no-option");
  if (remaining < MIN_STAKE) return err("no-allowance");
  if (!Number.isInteger(draft.stake) || draft.stake < MIN_STAKE) return err("below-minimum");
  if (draft.stake > remaining) return err("over-remaining");
  return ok({ optionIndex: draft.optionIndex, stake: draft.stake });
};

/// Preset amounts worth offering: only the ones today's allowance can actually cover, so a
/// disabled row of numbers never has to explain itself. The remaining balance is always
/// offered last when it is not already a preset, because "all of it" is a real intention.
const PRESET_STEPS = [10, 25, 50] as const;

export const stakePresets = (remaining: number): readonly number[] => {
  const affordable = PRESET_STEPS.filter((step) => step <= remaining);
  return remaining >= MIN_STAKE && !affordable.includes(remaining as (typeof PRESET_STEPS)[number])
    ? [...affordable, remaining]
    : affordable;
};

export type ReviewSummary = {
  readonly stake: number;
  readonly optionIndex: number;
  /// Gross return if this call is correct, from the shared payout law. Displayed as the
  /// maximum points at stake and the points a correct call returns, never as money.
  readonly returnIfCorrect: number;
  readonly remainingAfter: number;
};

export const reviewSummary = (draft: ValidDraft, optionCount: number, remaining: number): ReviewSummary => ({
  stake: draft.stake,
  optionIndex: draft.optionIndex,
  returnIfCorrect: grossPayout(draft.stake, optionCount),
  remainingAfter: remaining - draft.stake,
});
