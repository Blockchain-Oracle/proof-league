"use client";

import { MIN_STAKE } from "@proof-league/shared";
import type { PickComposer } from "../../features/picks/use-pick-composer.js";
import type { ComposerAvailability } from "../../features/picks/availability.js";

// LOCK IT IN (design frame A/B) with Masayume's label-is-the-blocker rule: the button's
// visible text, its aria-label and its title are one string, decided by one ordered
// ladder that names the first FIXABLE reason. A dead control never looks tappable and
// always says why. Gold only when a Call can actually be signed right now.

export type LockState = { readonly label: string; readonly live: boolean };

/// The closed headline comes from availability.ts; this only chooses the button's word for
/// it. "settled" and "void" are matched on the headline's own words, so the terminal chip
/// vocabulary stays with its one renderer.
const closedLabel = (headline: string, lockLabel: string): string =>
  headline.includes("settled") ? "SETTLED · PROVEN ON CREDITCOIN" : headline.includes("void") ? "EVERY CHIP RETURNED" : `CALLS LOCKED AT ${lockLabel}`;

export const lockStateOf = (
  composer: PickComposer,
  availability: ComposerAvailability,
  chose: boolean,
  potDown: number,
  instrument: "gauge" | "windows",
  lockLabel: string,
): LockState => {
  if (composer.phase === "signing") return { label: "WAITING FOR YOUR SIGNATURE", live: false };
  if (composer.phase === "submitting") return { label: "SENDING YOUR CALL", live: false };
  if (availability.kind === "closed") return { label: closedLabel(availability.headline, lockLabel), live: false };
  if (!chose) return { label: instrument === "windows" ? "PRESS A WINDOW FIRST" : "PRESS A BAND FIRST", live: false };
  if (potDown === 0) return { label: "PUT CHIPS DOWN", live: false };
  if (composer.provider.kind === "unconfigured") return { label: "NO WAY TO SIGN HERE YET", live: false };
  if (composer.provider.kind === "loading") return { label: "CHECKING YOUR SEAT", live: false };
  if (composer.provider.kind === "available") return { label: "TAKE A SEAT TO LOCK IN", live: true };
  if (composer.intakeProblem !== undefined) return { label: "THE DOOR IS NOT ANSWERING", live: false };
  if (composer.intake === undefined) return { label: "READING YOUR RACK", live: false };
  if (composer.problem === "no-allowance") return { label: "RACK IS EMPTY UNTIL 00:00 UTC", live: false };
  if (composer.problem === "below-minimum") return { label: `BELOW THE MINIMUM · ${MIN_STAKE}`, live: false };
  if (composer.problem === "over-remaining") return { label: `OVER YOUR RACK · ${composer.intake.remaining} LEFT`, live: false };
  return { label: "LOCK IT IN", live: true };
};

export function LockButton({ state, onPress, compact = false }: { state: LockState; onPress: () => void; compact?: boolean }) {
  return (
    <button
      type="button"
      disabled={!state.live}
      aria-disabled={!state.live}
      aria-label={state.label}
      title={state.label}
      onClick={onPress}
      className={`w-full rounded-[14px] border-[3px] border-felt-edge text-center font-display font-extrabold tracking-[-.02em] shadow-[0_6px_0_#0B1710] transition-transform ${compact ? "rounded-[13px] px-4 py-4 text-[19px] shadow-[0_5px_0_#0B1710]" : "px-[19px] py-[19px] text-[22px]"} ${
        state.live ? "bg-gold text-ink-green active:translate-y-[5px] active:shadow-[0_1px_0_#0B1710]" : "bg-stock/15 text-felt-3"
      }`}
    >
      {state.label}
    </button>
  );
}
