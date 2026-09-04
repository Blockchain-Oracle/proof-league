// The composer's own failure vocabulary (PRODUCT-FLOWS section 16, CONVENTIONS section 6).
//
// This is deliberately NOT a copy of intake's refusals. The route already answers every
// refusal it makes with a message, a next action and whether points moved, written beside
// the rule that produced it; re-stating those here would be two copies of one sentence
// waiting to disagree. What the route cannot describe is everything that happens before or
// instead of an answer: no signer, a declined signature, a request that never arrived, and
// the one case that matters most, a request that may have arrived.
//
// Adding a variant without copy is a compile error, which is the point of the map.

/// Which of the three error shapes this is. The distinction drives behaviour, not just
/// wording: a refusal is final, a retryable failure keeps the draft and offers Retry, and
/// an unknown confirmation must never invite a blind resend, because the first attempt may
/// already be holding the nonce.
export type FailureKind = "refusal" | "retryable" | "unknown";

export type ComposerFailure =
  | "no-signer"
  | "signature-declined"
  | "signature-failed"
  | "network-unreachable"
  | "confirmation-unknown"
  | "server-unmapped";

export type FailureCopy = {
  readonly kind: FailureKind;
  readonly headline: string;
  readonly nextAction: string;
  /// Printed only where it is true. Nothing in this composer can spend points before
  /// intake stores a draft, and points are only ever debited on-chain at scoring, so the
  /// reassurance is honest in every case here. It is a field rather than a constant so a
  /// future variant that cannot make the promise is forced to say so.
  readonly pointsUntouched: boolean;
};

export const COMPOSER_FAILURE_COPY = {
  "no-signer": {
    kind: "refusal",
    headline: "There is no way to sign on this deployment yet.",
    nextAction: "You can still read the Market, the options and the proof behind them.",
    pointsUntouched: true,
  },
  "signature-declined": {
    kind: "retryable",
    headline: "You cancelled the signature, so no Pick was made.",
    nextAction: "Your choice and points are still here. Sign when you are ready.",
    pointsUntouched: true,
  },
  "signature-failed": {
    kind: "retryable",
    headline: "The wallet could not complete the signature.",
    nextAction: "Try again. If it keeps failing, reload the Market and sign from the current state.",
    pointsUntouched: true,
  },
  "network-unreachable": {
    kind: "retryable",
    headline: "The Pick could not be sent. It never reached us.",
    nextAction: "Check your connection and try again. Nothing was submitted.",
    pointsUntouched: true,
  },
  "confirmation-unknown": {
    kind: "unknown",
    headline: "The Pick was sent, and we did not hear back.",
    nextAction:
      "It may have been stored. Reload this Market before signing again: if it landed, you will see it, and signing a second time with the same number is refused rather than counted twice.",
    pointsUntouched: true,
  },
  "server-unmapped": {
    kind: "refusal",
    headline: "Intake answered with something this build does not understand.",
    nextAction: "Reload the Market and sign again from the current state.",
    pointsUntouched: true,
  },
} satisfies Record<ComposerFailure, FailureCopy>;
