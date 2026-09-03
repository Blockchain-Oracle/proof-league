import Link from "next/link";
import { formatUtc } from "@proof-league/shared";
import { StateChip } from "./state-chip.js";
import { Mark } from "./marks.js";
import type { MarketView } from "../lib/market-view.js";

// The settled exhibit (Story 3.2, REFERENCE-DESIGN section 5 Record Card): the proof
// leads, the links go somewhere real, and the option the value landed in is shown beside
// the band it fell into. A settled record with a dead proof link would undercut the one
// claim the product makes, so the link renders only when the transaction exists.
//
// It takes a canonical view rather than a row of its own: the decoded value is a number
// in its decoder's units, and the view model is where that is decided once.

export function SettledRecordCard({ view, explorerBase }: { view: MarketView; explorerBase: string }) {
  const settlement = view.settlement;
  if (settlement === undefined) return null;
  const landed = view.options[settlement.winningOption];
  return (
    <article className="crop-ticks border border-rule bg-surface p-5">
      <div className="flex items-center justify-between gap-3">
        <span className="font-data text-xs uppercase tracking-widest text-ink-muted">
          Settled record: market {view.marketId}
        </span>
        <StateChip chip={view.chip} />
      </div>
      <p className="mt-4 font-display text-3xl font-bold tracking-tight">{settlement.valueLabel}</p>
      <p className="mt-1 font-body text-sm text-ink-muted">
        The decoded value the source event carried. It landed in option{" "}
        {settlement.winningOption + 1} of {view.options.length}
        {landed === undefined ? "" : `, ${landed.label}`}.
      </p>
      <dl className="mt-4 space-y-1 border-t border-rule pt-3 font-data text-xs text-ink-muted">
        <div className="flex justify-between gap-3">
          <dt>Event occurred</dt>
          <dd className="text-ink">{formatUtc(settlement.occurredAt)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>Settled on Creditcoin</dt>
          <dd className="text-ink">{formatUtc(settlement.resolvedAt)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>Time to settle</dt>
          <dd className="text-ink">{Math.round((settlement.resolvedAt - settlement.occurredAt) / 60)} min</dd>
        </div>
      </dl>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {settlement.proofTxHash === null ? null : (
          <a
            href={`${explorerBase}/tx/${settlement.proofTxHash}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 border border-rule px-3 py-1.5 font-data text-[11px] uppercase tracking-widest hover:border-ink"
          >
            <Mark id="creditcoin" size={13} />
            The proof transaction
          </a>
        )}
        <Link
          href={`/markets/${view.marketId}`}
          className="font-data text-[11px] uppercase tracking-widest text-ink-muted underline hover:text-ink"
        >
          How this settled
        </Link>
      </div>
    </article>
  );
}
