import type { ComposerFailure } from "./errors.js";
import { acceptedSchema, intakeStateSchema, refusalSchema, type Accepted, type IntakeState, type Refusal } from "./schema.js";

// The intake client. One door, one shape, and one rule about ambiguity: this module never
// reports that nothing happened unless it knows nothing happened.

const INTAKE_PATH = "/api/picks";

export type IntakeStateResult =
  | { readonly kind: "ready"; readonly state: IntakeState }
  | { readonly kind: "unavailable"; readonly message: string };

export const fetchIntakeState = async (player: string, marketId: string): Promise<IntakeStateResult> => {
  try {
    const response = await fetch(`${INTAKE_PATH}?player=${player}&marketId=${marketId}`, { cache: "no-store" });
    const body: unknown = await response.json();
    if (!response.ok) {
      const refusal = refusalSchema.safeParse(body);
      return {
        kind: "unavailable",
        message: refusal.success ? refusal.data.message : "Intake could not be reached.",
      };
    }
    const parsed = intakeStateSchema.safeParse(body);
    if (!parsed.success) return { kind: "unavailable", message: "Intake answered in a shape this build does not understand." };
    return { kind: "ready", state: parsed.data };
  } catch {
    return { kind: "unavailable", message: "Intake could not be reached." };
  }
};

export type SubmitOutcome =
  | { readonly kind: "accepted"; readonly accepted: Accepted }
  | { readonly kind: "refused"; readonly refusal: Refusal }
  | { readonly kind: "failed"; readonly failure: ComposerFailure };

export type SignedPickBody = {
  readonly player: string;
  readonly marketId: string;
  readonly optionIndex: number;
  readonly stake: number;
  readonly nonce: number;
  readonly utcDay: number;
  readonly stakedSoFarInDay: number;
  readonly signature: string;
};

/// Submit a signed Pick.
///
/// Retrying is safe and is meant to be done with the SAME nonce. The route treats an
/// identical resend as the Pick it already holds and answers `duplicate`, while the same
/// nonce carrying different values is refused by name. That is the idempotency key, so a
/// caller recovering from an unknown confirmation must never bump the nonce: doing so
/// would turn one uncertain Pick into two real ones.
export const submitPick = async (body: SignedPickBody): Promise<SubmitOutcome> => {
  let response: Response;
  try {
    response = await fetch(INTAKE_PATH, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    // A rejected fetch is ambiguous by construction: the request may have been written to
    // the socket and answered after we stopped listening. The one case we can actually
    // rule out is having no network at all, so that is the only case reported as "it never
    // left". Everything else is unknown, because claiming nothing happened when something
    // may have is the failure mode this product refuses to have.
    const offline = typeof navigator !== "undefined" && navigator.onLine === false;
    return { kind: "failed", failure: offline ? "network-unreachable" : "confirmation-unknown" };
  }

  const body_: unknown = await response.json().catch(() => undefined);
  const refusal = refusalSchema.safeParse(body_);
  // A refusal shape is the route declining before it wrote anything, including the 503 it
  // returns when it cannot reach the projection. Those are known outcomes, not unknowns.
  if (refusal.success) return { kind: "refused", refusal: refusal.data };
  if (!response.ok) return { kind: "failed", failure: "confirmation-unknown" };

  const accepted = acceptedSchema.safeParse(body_);
  return accepted.success
    ? { kind: "accepted", accepted: accepted.data }
    : { kind: "failed", failure: "server-unmapped" };
};
