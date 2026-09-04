import { intakeClosesAtSec } from "@proof-league/shared";
import type { MarketView } from "../../lib/market-view.js";

// Whether the canonical composer can take a Pick on this Market right now, and if not, the
// exact reason in the words the player needs. One derivation, shared by every surface that
// opens the composer, because "is this still open" answered twice is answered differently
// on the edge that matters.
//
// This is a DISPLAY decision. Intake re-decides it against chain time on the way in and is
// the authority; this exists so a player is not invited to sign something that will be
// refused a second later.

/// Why the action slot is not an action. A Market that cannot take a Pick says what it is
/// and what happens next, in the place the composer would have been: a disabled button that
/// explains nothing is the dead control the handoff forbids.
export type ComposerAvailability =
  | { readonly kind: "open" }
  | { readonly kind: "closed"; readonly headline: string; readonly detail: string };

const CLOSED_HEADLINE = "Picks are closed for this Market.";

export const composerAvailabilityOf = (view: MarketView, chainNowSec: number): ComposerAvailability => {
  if (view.voided) {
    return {
      kind: "closed",
      headline: "This Market voided at its deadline.",
      detail:
        "No proof of its source event arrived in time. Void is permissionless and terminal, so nothing scored, and the Picks committed to it spent nothing.",
    };
  }
  if (view.settlement !== undefined) {
    return {
      kind: "closed",
      headline: "This Market has settled.",
      detail: "The decoded value and the transaction that proved it are on the Market page.",
    };
  }
  if (view.state !== "Created") {
    return {
      kind: "closed",
      headline: CLOSED_HEADLINE,
      detail:
        "The set of Picks has been published in full and pinned on-chain by hash. Nothing can be added to a set the contract has already stored.",
    };
  }
  if (chainNowSec >= intakeClosesAtSec(view.lockTime)) {
    return {
      kind: "closed",
      headline: CLOSED_HEADLINE,
      detail:
        "Intake closes a minute before Lock Time, so the set being published cannot race a Pick arriving in the same second.",
    };
  }
  return { kind: "open" };
};
