"use client";

import { MIN_STAKE, formatUtc } from "@proof-league/shared";
import { stakePresets, type Draft, type ReviewSummary } from "../../features/picks/pick-submit-flow.js";

// The draft half of the canonical composer: what am I calling, and how much am I putting
// on it. Split out of composer.tsx when that file crossed the 300 line cap, which is the
// seam the cap was pointing at anyway. This half decides nothing. It renders the draft and
// reports changes; the state machine, the signature and every failure live next door.

const LABEL = "font-data text-[11px] uppercase tracking-widest text-ink-muted";

const CHOSEN = "border-brand text-brand";
const UNCHOSEN = "border-rule text-ink hover:border-ink";

export function ComposerDraft({
  options,
  draft,
  onDraft,
  remaining,
  lockTimeSec,
  expectedSettlementSec,
  summary,
}: {
  readonly options: readonly { readonly index: number; readonly label: string }[];
  readonly draft: Draft;
  readonly onDraft: (next: Draft) => void;
  /// Undefined until intake has answered. Rendered as unknown rather than as zero, because
  /// zero is a real allowance state and "not loaded" is not.
  readonly remaining: number | undefined;
  readonly lockTimeSec: number;
  readonly expectedSettlementSec: number;
  readonly summary: ReviewSummary | undefined;
}) {
  return (
    <>
      <ol className="mt-3 flex flex-col gap-1.5">
        {options.map((option) => (
          <li key={option.index}>
            <button
              type="button"
              aria-pressed={draft.optionIndex === option.index}
              onClick={() => onDraft({ ...draft, optionIndex: option.index })}
              // min-h-11 is the 44px touch floor (CONVENTIONS section 7). Measured at 38px
              // on a phone before this: padding alone does not reach the floor once the
              // font is small, and the option row is the single most tapped control here.
              className={`flex min-h-11 w-full items-center justify-between gap-3 border px-3 py-2.5 text-left font-data text-xs ${
                draft.optionIndex === option.index ? CHOSEN : UNCHOSEN
              }`}
            >
              <span>{option.label}</span>
              <span className="text-ink-muted">{option.index + 1}</span>
            </button>
          </li>
        ))}
      </ol>

      <div className="mt-5">
        <div className="flex items-baseline justify-between gap-3">
          <span className={LABEL}>Free points</span>
          <span className="font-data text-[11px] text-ink-muted">
            {remaining === undefined ? "allowance not loaded" : `${remaining} left today`}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {(remaining === undefined ? [MIN_STAKE] : stakePresets(remaining)).map((preset) => (
            <button
              key={preset}
              type="button"
              aria-pressed={draft.stake === preset}
              onClick={() => onDraft({ ...draft, stake: preset })}
              className={`min-h-11 border px-3 py-1.5 font-data text-xs tabular-nums ${
                draft.stake === preset ? CHOSEN : UNCHOSEN
              }`}
            >
              {preset}
            </button>
          ))}
          <label className="flex items-center gap-2 font-data text-xs text-ink-muted">
            <span className="sr-only">Points to commit</span>
            <input
              type="number"
              inputMode="numeric"
              min={MIN_STAKE}
              max={remaining}
              value={draft.stake}
              onChange={(event) => onDraft({ ...draft, stake: Number(event.target.value) })}
              className="min-h-11 w-20 border border-rule bg-canvas px-2 py-1.5 text-right tabular-nums text-ink"
            />
          </label>
        </div>
      </div>

      <dl className="mt-5 space-y-1 border-t border-rule pt-3 font-data text-xs text-ink-muted">
        <div className="flex justify-between gap-3">
          <dt>Returns if correct</dt>
          <dd className="tabular-nums text-ink">
            {summary === undefined ? `${draft.stake} x ${options.length}` : `${summary.returnIfCorrect} points`}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>Left after this Pick</dt>
          <dd className="tabular-nums text-ink">
            {summary === undefined ? "not loaded" : `${summary.remainingAfter} points`}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>Locks</dt>
          <dd className="text-ink">{formatUtc(lockTimeSec)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>Expected to settle by</dt>
          <dd className="text-ink">{formatUtc(expectedSettlementSec)}</dd>
        </div>
      </dl>

      <p className="mt-3 font-body text-xs text-ink-muted">
        Points are free, reset every day at 00:00 UTC, and have no cash value. The points you commit
        are the most this call can cost you, and a correct call returns your stake times the number
        of options, which is what makes calling at random break even on every Market.
      </p>
    </>
  );
}
