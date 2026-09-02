import type { Result } from "./result.js";

// Copy-map law (CONVENTIONS §6): adding an error variant is a compile error until user-facing
// copy exists, because `satisfies Record<E, string>` demands completeness.
export type PickIntakeError =
  | "market_locked"
  | "over_allowance"
  | "below_min_stake"
  | "signature_invalid"
  | "not_authenticated";

export const PICK_INTAKE_COPY = {
  market_locked: "The market locked while you were signing. Your points are untouched. Try the next open market.",
  over_allowance: "That stake is more than your remaining points today. Your points are untouched. Lower the stake to continue.",
  below_min_stake: "The minimum stake is 10 points. Raise the stake to continue.",
  signature_invalid: "The signature did not verify. Your points are untouched. Sign the pick again to continue.",
  not_authenticated: "You are signed out. Sign in to place this pick.",
} satisfies Record<PickIntakeError, string>;

export type IntakeResult<T> = Result<T, PickIntakeError>;
