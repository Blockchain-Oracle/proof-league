import Link from "next/link";
import { formatUtc } from "@proof-league/shared";
import { Countdown } from "./countdown.js";
import { Mark } from "./marks.js";
import { StateChip } from "./state-chip.js";
import type { MarketView } from "../lib/market-view.js";

// One Market, rendered question first (Story 3.4, UX-DR3). Every value comes from the
// canonical view model, so the board, Reels and the Cards cannot disagree about what a
// Market says. Nothing here decides anything: it reads a view and lays it out.

// Twelfths, from a static class list: Tailwind cannot see a width computed at runtime,
// and inline styles are banned in this codebase. The exact counts are printed beside every
// bar anyway, so the bar is the shape and the number is the fact. Any nonzero share rounds
// UP to one twelfth, because a real Pick that renders as an empty bar reads as no Pick.
const WIDTHS = [
  "w-0",
  "w-1/12",
  "w-2/12",
  "w-3/12",
  "w-4/12",
  "w-5/12",
  "w-6/12",
  "w-7/12",
  "w-8/12",
  "w-9/12",
  "w-10/12",
  "w-11/12",
  "w-full",
] as const;

const OptionBar = ({ share, won }: { share: number; won: boolean }) => (
  <span className="relative block h-1 w-full bg-rule/40" aria-hidden="true">
    <span
      className={`absolute inset-y-0 left-0 ${won ? "bg-up" : "bg-brand"} ${
        WIDTHS[Math.min(WIDTHS.length - 1, Math.ceil(share * 12))] ?? "w-0"
      }`}
    />
  </span>
);

/// The distribution's provenance, said out loud (AD-18). A committed set is pinned
/// on-chain by hash; intake drafts are our own observation of what has been signed so
/// far, and the difference is exactly the sort of thing this product refuses to blur.
const distributionNote = (view: MarketView): string => {
  if (view.totalPicks === 0) {
    return view.locked
      ? "No Picks were committed on this Market."
      : "No Picks yet. The first one to be signed shows up here.";
  }
  const plural = view.totalPicks === 1 ? "Pick" : "Picks";
  return view.distribution === "committed"
    ? `${view.totalPicks} ${plural} in the committed set, the one pinned on-chain by hash.`
    : `${view.totalPicks} signed ${plural} so far, seen by us and not yet committed on-chain.`;
};

export function MarketCard({ view, explorerBase }: { view: MarketView; explorerBase: string }) {
  const settlement = view.settlement;
  return (
    <article className="flex flex-col gap-4 py-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-lg font-bold tracking-tight md:text-xl">
            <Link href={`/markets/${view.marketId}`} className="hover:text-brand">
              {view.question}
            </Link>
          </h3>
          <p className="mt-1 font-body text-sm text-ink-muted">{view.sourceLine}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {view.hostedRound ? (
            <span className="font-data text-[11px] uppercase tracking-widest text-waiting">Hosted Round</span>
          ) : null}
          <StateChip chip={view.chip} />
        </div>
      </div>

      <ol className="flex flex-col gap-2">
        {view.options.map((option) => (
          <li key={option.index} className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between gap-3 font-data text-xs">
              <span className={option.won ? "text-up" : "text-ink"}>
                {option.label}
                {option.won ? " (this is where it landed)" : ""}
              </span>
              <span className="text-ink-muted">
                {view.totalPicks === 0
                  ? ""
                  : `${option.picks} of ${view.totalPicks}`}
              </span>
            </div>
            <OptionBar share={view.totalPicks === 0 ? 0 : option.picks / view.totalPicks} won={option.won} />
          </li>
        ))}
      </ol>
      <p className="font-body text-xs text-ink-muted">{distributionNote(view)}</p>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-3 font-data text-xs">
        {view.voided ? (
          // A voided Market did not settle and must never be described as if it were on
          // its way: void is terminal, and the honest line says what happened to the
          // Picks that were already committed to it.
          <span className="text-ink-muted">
            Voided at its deadline. No proof arrived in time, so nothing scored and the
            committed Picks spent nothing.
          </span>
        ) : settlement === undefined ? (
          <span className="text-ink-muted">
            {view.locked ? "Settles by proof after " : "Locks "}
            <span className="text-ink">
              <Countdown
                targetSec={view.locked ? view.sourceWindowOpen : view.lockTime}
                absolute={formatUtc(view.locked ? view.sourceWindowOpen : view.lockTime)}
                passed={view.locked ? "the source window is open" : "lock time has passed"}
              />
            </span>
            <span className="ml-2 hidden text-ink-muted sm:inline">
              {formatUtc(view.locked ? view.sourceWindowOpen : view.lockTime)}
            </span>
          </span>
        ) : (
          <span className="text-ink-muted">
            Settled at <span className="text-ink">{settlement.valueLabel}</span> on{" "}
            {formatUtc(settlement.resolvedAt)}
          </span>
        )}
        <span className="flex items-center gap-3">
          {settlement?.proofTxHash == null ? null : (
            <a
              href={`${explorerBase}/tx/${settlement.proofTxHash}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 uppercase tracking-widest text-ink-muted hover:text-ink"
            >
              <Mark id="creditcoin" size={12} />
              Proof
            </a>
          )}
          <Link
            href={`/markets/${view.marketId}`}
            className="uppercase tracking-widest text-ink-muted underline hover:text-ink"
          >
            {settlement === undefined ? "How it settles" : "How this settled"}
          </Link>
        </span>
      </div>
    </article>
  );
}
