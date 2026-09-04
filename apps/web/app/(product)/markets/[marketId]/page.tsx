import { notFound } from "next/navigation";
import { readEndpoints } from "@proof-league/chain";
import { formatUtc } from "@proof-league/shared";
import { Countdown } from "../../../../components/countdown.js";
import { SectionHead } from "../../../../components/shell/section-head.js";
import { StateChip } from "../../../../components/state-chip.js";
import { MarketReceipt } from "../../../../components/market/market-receipt.js";
import { OptionRows } from "../../../../components/market/option-rows.js";
import { PointsComposer } from "../../../../components/market/composer.js";
import { HostedRoundLabel } from "../../../../components/hosted-round-label.js";
import { composerAvailabilityOf } from "../../../../features/picks/availability.js";
import { chainClock } from "../../../../lib/chain-clock.js";
import { marketDetail } from "../../../../lib/market-data.js";
import { marketPickCounts } from "../../../../lib/market-board.js";
import { marketViewOf } from "../../../../lib/market-view.js";

// The Market page, in the order a person actually needs it (rebaseline section 7).
//
// Until the 2026-09-03 review this page opened with the source chain key, the emitting
// contract, an event signature, a subject filter, a decoder id, a source key and a pick-set
// hash, and never offered a way to make a Pick at all. Every one of those facts is still
// here and none of them has been softened. They are simply no longer the first thing a
// visitor meets, because the first four questions are what is being predicted, what my
// choices are, what it costs me and when it locks. Proof is the referee. It is not the game.
//
// Disclosure runs in three levels: the source in ordinary language, then why the answer
// cannot be faked, then the full technical receipt behind an explicit control.

export const dynamic = "force-dynamic";

const H2 = "font-display text-base font-bold";
const PROSE = "mt-2 max-w-xl font-body text-sm text-ink-muted";
const FACTS = "mt-4 divide-y divide-rule border-y border-rule font-data text-xs";

export default async function MarketDetailPage({ params }: { params: Promise<{ marketId: string }> }) {
  const { marketId } = await params;
  const market = await marketDetail(marketId);
  if (market === undefined) notFound();
  const explorerBase = readEndpoints(process.env).EXPLORER_BASE_CC3;
  // Chain time, not this server's clock: it is the clock the contracts compare against and
  // the one intake will admit against, so the page and the door agree about whether this
  // Market is still open (AD-10).
  const { chainNowSec } = await chainClock();
  const counts = await marketPickCounts(marketId, market.payoutN, market.committedAt);
  // The same canonical view the board builds, over the same row: the question, the state
  // and the option bands are decided once, in one place, for every surface (AD-23).
  const view = marketViewOf(market, chainNowSec, market.resolution, counts);
  const availability = composerAvailabilityOf(view, chainNowSec);

  return (
    <div className="py-10">
      <SectionHead number={market.marketId.padStart(2, "0")} title={`Market ${market.marketId}`} accent="the call" />

      <div className="grid gap-10 lg:grid-cols-[7fr_5fr]">
        <div className="flex flex-col gap-8">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">{view.question}</h1>
            <p className="mt-2 max-w-xl font-body text-sm text-ink-muted">{view.sourceLine}</p>
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

          <section className="flex flex-col gap-4">
            <div>
              <h2 className={H2}>Your choices</h2>
              <p className={PROSE}>
                {market.payoutN} options, fixed on-chain at creation and immutable afterwards. Each band runs
                up to but not including its upper edge, and the outer two are open ended, so the decoded
                value falls into exactly one of them however far it moves.
              </p>
            </div>
            <OptionRows view={view} />
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          {view.settlement === undefined ? (
            <PointsComposer
              market={{
                marketId: view.marketId,
                question: view.question,
                sourceLine: view.sourceLine,
                options: view.options.map((option) => ({ index: option.index, label: option.label })),
                lockTimeSec: view.lockTime,
                expectedSettlementSec: view.expectedSettlement,
              }}
              availability={availability}
            />
          ) : (
            <MarketReceipt view={view} explorerBase={explorerBase} />
          )}
        </aside>
      </div>

      <div className="mt-12 grid gap-10 border-t border-rule pt-10 lg:grid-cols-[7fr_5fr]">
        <div className="flex flex-col gap-8">
          <section>
            <h2 className={H2}>Why this result cannot be faked</h2>
            <p className={PROSE}>
              This Market settles on one specific log, emitted by one specific contract on one specific
              chain. All of that is fixed before anyone can Pick, and the contract compares a submitted
              proof against exactly those values. A proof of any other event, however similar, is refused.
            </p>
            <p className={PROSE}>
              The commit window closes before the source window opens, so a Pick cannot be added once the
              answer can be known. The published set of Picks is pinned on-chain by hash: it is the whole
              set, signatures included, and any change to it breaks the hash the contract already stored.
              Nobody reports the outcome to us, and no operator decision sits anywhere in that path.
            </p>
            <dl className={FACTS}>
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
            </dl>
          </section>

          <section>
            {/* Level 3 (rebaseline section 8): complete, unsoftened, and behind an explicit
                control so it can never precede the question and the choices again. */}
            <details className="border border-rule bg-surface">
              <summary className="cursor-pointer px-4 py-3 font-data text-[11px] uppercase tracking-widest text-ink-muted hover:text-ink">
                The technical receipt
              </summary>
              <div className="border-t border-rule px-4 pb-4">
                <p className={PROSE}>
                  The exact values the contract checks a proof against. These are the Market{"'"}s config
                  on Creditcoin, written before it opened and immutable since.
                </p>
                <dl className={FACTS}>
                  {[
                    ["Source chain key", market.sourceChainKey],
                    ["Emitting contract", market.emitter],
                    ["Event signature", market.eventSignature],
                    [
                      "Subject filter",
                      market.subjectFilter === `0x${"00".repeat(32)}`
                        ? "none (any subject on this event)"
                        : market.subjectFilter,
                    ],
                    ["Decoder", `id ${market.decoderId}`],
                    ["Source key", market.sourceKey],
                    ["Option boundaries, raw", market.boundaries.join(", ")],
                  ].map(([label, value]) => (
                    <div key={label} className="flex flex-wrap justify-between gap-2 py-2">
                      <dt className="text-ink-muted">{label}</dt>
                      <dd className="break-all text-right">{value}</dd>
                    </div>
                  ))}
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
              </div>
            </details>
          </section>
        </div>

        <aside>
          {view.settlement === undefined ? (
            <div className="crop-ticks border border-rule bg-surface p-5">
              <span className="font-data text-xs uppercase tracking-widest text-ink-muted">Outcome</span>
              <p className="mt-3 font-body text-sm text-ink-muted">
                {view.voided
                  ? "Nothing settled here. The Market voided at its deadline, so no outcome was ever decided."
                  : "Not settled yet. When the source event happens, a proof of it is submitted and the outcome and its transaction appear here."}
              </p>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
