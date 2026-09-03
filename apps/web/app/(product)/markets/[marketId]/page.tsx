import { notFound } from "next/navigation";
import { readEndpoints } from "@proof-league/chain";
import { formatUtc } from "@proof-league/shared";
import { Countdown } from "../../../../components/countdown.js";
import { SectionHead } from "../../../../components/shell/section-head.js";
import { StateChip } from "../../../../components/state-chip.js";
import { SettledRecordCard } from "../../../../components/settled-record.js";
import { HostedRoundLabel } from "../../../../components/hosted-round-label.js";
import { marketDetail } from "../../../../lib/market-data.js";
import { marketViewOf } from "../../../../lib/market-view.js";

export const dynamic = "force-dynamic";

export default async function MarketDetailPage({ params }: { params: Promise<{ marketId: string }> }) {
  const { marketId } = await params;
  const market = await marketDetail(marketId);
  if (market === undefined) notFound();
  const explorerBase = readEndpoints(process.env).EXPLORER_BASE_CC3;
  const nowSec = Math.floor(Date.now() / 1000);
  // The same canonical view the board builds, over the same row: the question, the state
  // and the option bands are decided once, in one place, for every surface (AD-23).
  const view = marketViewOf(market, nowSec, market.resolution);
  return (
    <div className="py-10">
      <SectionHead number={market.marketId.padStart(2, "0")} title={`Market ${market.marketId}`} accent="the derivation" />
      <div className="grid gap-10 lg:grid-cols-[7fr_5fr]">
        <div className="flex flex-col gap-8">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">{view.question}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <StateChip chip={view.chip} />
              <span className="font-data text-xs text-ink-muted">league day {view.leagueDay}</span>
              {view.settlement === undefined ? (
                <span className="font-data text-xs text-ink-muted">
                  {view.locked ? "Source window opens " : "Locks "}
                  <span className="text-ink">
                    <Countdown
                      targetSec={view.locked ? view.sourceWindowOpen : view.lockTime}
                      absolute={formatUtc(view.locked ? view.sourceWindowOpen : view.lockTime)}
                      passed={view.locked ? "the source window is open" : "lock time has passed"}
                    />
                  </span>
                </span>
              ) : null}
            </div>
          </div>

          {view.hostedRound ? <HostedRoundLabel /> : null}

          <section>
            <h2 className="font-display text-base font-bold">Where the answer comes from</h2>
            <p className="mt-2 max-w-xl font-body text-sm text-ink-muted">
              This Market settles on one specific log, emitted by one specific contract on one
              specific chain. All four are fixed in the config below before anyone can Pick, and
              the contract compares a submitted proof against exactly these values. A proof of any
              other event, however similar, is refused.
            </p>
            <dl className="mt-4 divide-y divide-rule border-y border-rule font-data text-xs">
              {[
                ["Source chain key", market.sourceChainKey],
                ["Emitting contract", market.emitter],
                ["Event signature", market.eventSignature],
                ["Subject filter", market.subjectFilter === `0x${"00".repeat(32)}` ? "none (any subject on this event)" : market.subjectFilter],
                ["Decoder", `id ${market.decoderId}`],
                ["Source key", market.sourceKey],
              ].map(([label, value]) => (
                <div key={label} className="flex flex-wrap justify-between gap-2 py-2">
                  <dt className="text-ink-muted">{label}</dt>
                  <dd className="break-all text-right">{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section>
            <h2 className="font-display text-base font-bold">Why nobody can fake it</h2>
            <p className="mt-2 max-w-xl font-body text-sm text-ink-muted">
              The commit window closes before the source window opens, so a Pick cannot be added
              once the answer can be known. The published pick-set is pinned on-chain by hash: the
              bytes below are the whole set, signatures included, and any change to them breaks
              the hash the contract already stored.
            </p>
            <dl className="mt-4 divide-y divide-rule border-y border-rule font-data text-xs">
              <div className="flex flex-wrap justify-between gap-2 py-2">
                <dt className="text-ink-muted">Lock time</dt>
                <dd>{formatUtc(market.lockTime)}</dd>
              </div>
              <div className="flex flex-wrap justify-between gap-2 py-2">
                <dt className="text-ink-muted">Source window opens</dt>
                <dd>{formatUtc(market.sourceWindowOpen)}</dd>
              </div>
              <div className="flex flex-wrap justify-between gap-2 py-2">
                <dt className="text-ink-muted">Void deadline</dt>
                <dd>{formatUtc(market.voidDeadline)}</dd>
              </div>
              {market.committedAt === null ? (
                <div className="py-2 text-ink-muted">No pick-set committed for this Market.</div>
              ) : (
                <>
                  <div className="flex flex-wrap justify-between gap-2 py-2">
                    <dt className="text-ink-muted">Picks committed</dt>
                    <dd>{formatUtc(market.committedAt)}</dd>
                  </div>
                  <div className="flex flex-wrap justify-between gap-2 py-2">
                    <dt className="text-ink-muted">Pick-set hash</dt>
                    <dd className="break-all text-right">{market.commitSha256}</dd>
                  </div>
                </>
              )}
            </dl>
          </section>

          <section>
            <h2 className="font-display text-base font-bold">The option boundaries</h2>
            <p className="mt-2 max-w-xl font-body text-sm text-ink-muted">
              {market.payoutN} options, fixed at creation and immutable afterwards. Each band runs
              up to but not including its upper edge, and the outer two are open ended, so the
              decoded value falls into exactly one of them however far it moves.
            </p>
            <ol className="mt-4 border-y border-rule font-data text-xs">
              {view.options.map((option) => (
                <li
                  key={option.index}
                  className="flex justify-between gap-2 border-b border-rule py-2 last:border-b-0"
                >
                  <span className="text-ink-muted">Option {option.index + 1}</span>
                  <span className={option.won ? "text-up" : ""}>
                    {option.label}
                    {option.won ? " (this is where it landed)" : ""}
                  </span>
                </li>
              ))}
            </ol>
            <p className="mt-3 max-w-xl font-body text-xs text-ink-muted">
              The raw thresholds these are rendered from are stored on-chain as fixed-point
              integers: {market.boundaries.join(", ")}.
            </p>
          </section>
        </div>

        <aside className="lg:pt-1">
          {view.settlement === undefined ? (
            <div className="crop-ticks border border-rule bg-surface p-5">
              <span className="font-data text-xs uppercase tracking-widest text-ink-muted">Outcome</span>
              <p className="mt-3 font-body text-sm text-ink-muted">
                {view.voided
                  ? "This Market was voided at its deadline: no proof of its source event arrived in time. Void is permissionless and terminal, so nothing scored, and the Picks committed to it spent nothing."
                  : "Not settled yet. When the source event happens, a proof of it is submitted and the outcome and its transaction appear here."}
              </p>
            </div>
          ) : (
            <SettledRecordCard view={view} explorerBase={explorerBase} />
          )}
        </aside>
      </div>
    </div>
  );
}
