import Link from "next/link";
import { formatUtc, RESOLVED_CHIP } from "@proof-league/shared";
import { StateChip } from "./state-chip.js";
import { Mark } from "./marks.js";
import type { SettledRecord } from "../lib/market-data.js";

// The landing's settled exhibit (Story 3.2, REFERENCE-DESIGN §5 Record Card): the proof
// leads, the links go somewhere real, and the option the value landed in is shown beside
// the boundary it crossed. A settled record with a dead proof link would undercut the one
// claim the product makes, so the link is only rendered when the transaction exists.

// Boundaries are 1e18 fixed point; a settled value reads as a plain decimal, not a hash.
const formatScaled = (raw: string): string => {
  const negative = raw.startsWith("-");
  const digits = (negative ? raw.slice(1) : raw).padStart(19, "0");
  const whole = digits.slice(0, -18).replace(/^0+(?=\d)/, "");
  const fraction = digits.slice(-18).replace(/0+$/, "");
  return `${negative ? "-" : ""}${whole}${fraction === "" ? "" : `.${fraction}`}`;
};

export function SettledRecordCard({
  record,
  explorerBase,
}: {
  record: SettledRecord;
  explorerBase: string;
}) {
  const optionLabel = `Option ${record.winningOption + 1} of ${record.payoutN}`;
  return (
    <article className="crop-ticks border border-rule bg-surface p-5">
      <div className="flex items-center justify-between gap-3">
        <span className="font-data text-xs uppercase tracking-widest text-ink-muted">
          Settled record: market {record.marketId}
        </span>
        <StateChip chip={RESOLVED_CHIP} />
      </div>
      <p className="mt-4 font-display text-3xl font-bold tracking-tight">{formatScaled(record.value)}</p>
      <p className="mt-1 font-body text-sm text-ink-muted">
        The decoded value the source event carried. It landed in {optionLabel}.
      </p>
      <dl className="mt-4 space-y-1 border-t border-rule pt-3 font-data text-xs text-ink-muted">
        <div className="flex justify-between gap-3">
          <dt>Event occurred</dt>
          <dd className="text-ink">{formatUtc(record.occurredAt)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>Settled on Creditcoin</dt>
          <dd className="text-ink">{formatUtc(record.resolvedAt)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>Time to settle</dt>
          <dd className="text-ink">{Math.round((record.resolvedAt - record.occurredAt) / 60)} min</dd>
        </div>
      </dl>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {record.proofTxHash === null ? null : (
          <a
            href={`${explorerBase}/tx/${record.proofTxHash}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 border border-rule px-3 py-1.5 font-data text-[11px] uppercase tracking-widest hover:border-ink"
          >
            <Mark id="creditcoin" size={13} />
            The proof transaction
          </a>
        )}
        <Link
          href={`/markets/${record.marketId}`}
          className="font-data text-[11px] uppercase tracking-widest text-ink-muted underline hover:text-ink"
        >
          How this settled
        </Link>
      </div>
    </article>
  );
}
