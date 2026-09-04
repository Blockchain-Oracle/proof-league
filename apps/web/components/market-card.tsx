import Link from "next/link";
import { formatUtc } from "@proof-league/shared";
import { Countdown } from "./countdown.js";
import { Mark } from "./marks.js";
import { StateChip } from "./state-chip.js";
import { OptionRows } from "./market/option-rows.js";
import type { MarketView } from "../lib/market-view.js";

// One Market, rendered question first (Story 3.4, UX-DR3). Every value comes from the
// canonical view model, so the board, Reels and the Cards cannot disagree about what a
// Market says. Nothing here decides anything: it reads a view and lays it out.
//
// The options and their distribution moved to market/option-rows.tsx when the Market page
// needed the identical block, so there is still exactly one renderer of that.

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

      <OptionRows view={view} />

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
