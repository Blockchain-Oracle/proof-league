import { readEndpoints } from "@proof-league/chain";
import { formatUtc } from "@proof-league/shared";
import { transparencyLog } from "../../../lib/market-data.js";

// PROOF (Story 3.8, AD-18): the worker's own phase log, shown with the distinction that
// matters. Rows are OBSERVATIONS the worker made about itself, and a reader has no reason
// to take our word for them. The exception is a row carrying a Creditcoin transaction,
// which is the chain's claim, not ours: lit as a lamp and linked, never laundered.
export const dynamic = "force-dynamic";

const PHASE_COPY: Record<string, string> = {
  event: "EVENT SEEN",
  attested: "ATTESTED",
  proven: "PROVEN",
  note: "PIPELINE NOTE",
};

export default async function ProofPage({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const params = await searchParams;
  const all = await transparencyLog(200);
  const rows = params.m === undefined ? all : all.filter((row) => row.marketIds.includes(params.m ?? ""));
  const explorerBase = readEndpoints(process.env).EXPLORER_BASE_CC3;
  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 py-8 md:px-10 md:py-12">
      <div className="flex items-baseline gap-4">
        <h1 className="font-display text-[34px] font-extrabold tracking-[-.04em] text-stock">The proof</h1>
        <span className="font-serif text-[26px] italic text-gold">observed, then proven</span>
      </div>
      <p className="mt-2 font-data text-[10.5px] tracking-[.12em] text-felt-3">
        {params.m === undefined ? "EVERY SETTLEMENT TO DATE · ONE ROW PER PHASE AS IT COMPLETED" : `CARD ${params.m.padStart(3, "0")} · ITS OWN ROWS ONLY`}
      </p>

      <div className="mt-8 grid max-w-3xl gap-4 sm:grid-cols-2">
        <div className="rounded-[12px] border border-white/15 px-4 py-3.5">
          <p className="font-data text-[9.5px] tracking-[.16em] text-felt-2">OBSERVED</p>
          <p className="mt-1.5 font-body text-[13.5px] leading-relaxed text-felt-1">
            The worker saying what it saw and when. Useful for watching a settlement move, but it is our own
            account of our own behaviour, so it proves nothing on its own.
          </p>
        </div>
        <div className="rounded-[12px] border border-gold/40 px-4 py-3.5">
          <p className="font-data text-[9.5px] tracking-[.16em] text-gold">PROVEN</p>
          <p className="mt-1.5 font-body text-[13.5px] leading-relaxed text-felt-1">
            A row that carries a Creditcoin transaction. That transaction is the evidence, and it is there to
            open. Nothing here asks you to trust the worker.
          </p>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="mt-8 max-w-xl font-body text-[13.5px] text-felt-1">
          The log is empty. Phase timestamps appear here as the settlement worker records them, one row per
          phase as it completes.
        </p>
      ) : (
        <ul className="mt-8 divide-y divide-white/10 border-y border-white/10">
          {rows.map((row) => (
            <li key={row.id} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 py-3">
              <span className="font-data text-[11px] text-felt-3">{formatUtc(row.atSec)}</span>
              <span className={`inline-flex items-center gap-2 font-data text-[9.5px] tracking-[.14em] ${row.evidenceClass === "proven" ? "text-gold" : "text-felt-2"}`}>
                <span className={`h-2.5 w-2.5 rounded-full border border-felt-edge ${row.evidenceClass === "proven" ? "lamp-lit" : "bg-black/35"}`} />
                {PHASE_COPY[row.phase] ?? row.phase.toUpperCase()}
              </span>
              <span className="font-data text-[11px] text-felt-3">
                CARD{row.marketIds.length === 1 ? "" : "S"} {row.marketIds.map((id) => id.padStart(3, "0")).join(", ")}
              </span>
              {row.overCliff === true ? <span className="font-data text-[9.5px] tracking-[.14em] text-gold-light">OVER CLIFF</span> : null}
              {row.txHash === null ? null : (
                <a href={`${explorerBase}/tx/${row.txHash}`} target="_blank" rel="noreferrer" className="font-data text-[10.5px] text-gold underline">
                  transaction
                </a>
              )}
              {row.note === null ? null : <span className="w-full font-body text-[12px] text-felt-2">{row.note}</span>}
            </li>
          ))}
        </ul>
      )}

      <p className="mt-8 max-w-2xl border-l-2 border-gold/40 pl-4 font-body text-[13.5px] leading-relaxed text-felt-1">
        None of this feeds a score. Every number the league pays out on is reconstructed from the chain and the
        published pick-sets by <span className="font-data">pnpm rebuild</span>, which fails if the database
        disagrees. This log exists so a settlement can be watched in progress, not so it can be believed.
      </p>
    </div>
  );
}
