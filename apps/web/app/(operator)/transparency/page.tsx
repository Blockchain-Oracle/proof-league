import { readEndpoints } from "@proof-league/chain";
import { formatUtc } from "@proof-league/shared";
import { SectionHead } from "../../../components/shell/section-head.js";
import { transparencyLog } from "../../../lib/market-data.js";

// The transparency page (Story 3.8, AD-18): the worker's own phase log, shown with the
// distinction that matters. Rows here are OBSERVATIONS the worker made about itself, and
// a reader has no reason to take our word for them. The exception is a row carrying a
// Creditcoin transaction, which is not our claim but the chain's — those are labelled
// separately and linked, so the page never launders one class of evidence as the other.
export const dynamic = "force-dynamic";

const PHASE_COPY: Record<string, string> = {
  event: "source event seen",
  attested: "attestation covers it",
  proven: "proof submitted",
  note: "pipeline note",
};

export default async function TransparencyPage() {
  const rows = await transparencyLog();
  const explorerBase = readEndpoints(process.env).EXPLORER_BASE_CC3;
  return (
    <div className="py-10">
      <SectionHead number="06" title="Transparency" accent="observed, then proven" />

      <div className="mb-8 grid max-w-3xl gap-4 sm:grid-cols-2">
        <div className="border-l-2 border-rule pl-4">
          <p className="font-data text-[11px] uppercase tracking-widest text-ink-muted">Observed</p>
          <p className="mt-1 font-body text-sm text-ink-muted">
            The worker saying what it saw and when. Useful for watching a settlement move, but it
            is our own account of our own behaviour, so it proves nothing on its own.
          </p>
        </div>
        <div className="border-l-2 border-up pl-4">
          <p className="font-data text-[11px] uppercase tracking-widest text-up">Proven</p>
          <p className="mt-1 font-body text-sm text-ink-muted">
            A row that carries a Creditcoin transaction. That transaction is the evidence, and it
            is there to open. Nothing here asks you to trust the worker.
          </p>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="max-w-xl font-body text-sm text-ink-muted">
          The log is empty. Phase timestamps appear here as the settlement worker records them,
          one row per phase as it completes.
        </p>
      ) : (
        <ul className="divide-y divide-rule border-y border-rule">
          {rows.map((row) => (
            <li key={row.id} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 py-3">
              <span className="font-data text-xs text-ink-muted">{formatUtc(row.atSec)}</span>
              <span
                className={`font-data text-[11px] uppercase tracking-widest ${
                  row.evidenceClass === "proven" ? "text-up" : "text-ink-muted"
                }`}
              >
                {row.evidenceClass}
              </span>
              <span className="font-display text-sm font-semibold">{PHASE_COPY[row.phase] ?? row.phase}</span>
              <span className="font-data text-xs text-ink-muted">
                market{row.marketIds.length === 1 ? "" : "s"} {row.marketIds.join(", ")}
              </span>
              {row.overCliff === true ? (
                <span className="font-data text-[11px] uppercase tracking-widest text-waiting">over cliff</span>
              ) : null}
              {row.txHash === null ? null : (
                <a
                  href={`${explorerBase}/tx/${row.txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-data text-[11px] underline hover:text-ink"
                >
                  transaction
                </a>
              )}
              {row.note === null ? null : (
                <span className="w-full font-body text-xs text-ink-muted">{row.note}</span>
              )}
            </li>
          ))}
        </ul>
      )}

      <p className="mt-8 max-w-2xl border-l-2 border-rule pl-4 font-body text-sm text-ink-muted">
        None of this feeds a score. Every number the league pays out on is reconstructed from the
        chain and the published pick-sets by <span className="font-data">pnpm rebuild</span>, which
        fails if the database disagrees. This log exists so a settlement can be watched in
        progress, not so it can be believed.
      </p>
    </div>
  );
}
