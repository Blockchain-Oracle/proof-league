import { notFound } from "next/navigation";
import { readEndpoints } from "@proof-league/chain";
import { deriveMarketChip, expectedSettlementSecOf, formatUtc } from "@proof-league/shared";
import { SectionHead } from "../../../../components/shell/section-head.js";
import { StateChip } from "../../../../components/state-chip.js";
import { SettledRecordCard } from "../../../../components/settled-record.js";
import { HostedRoundLabel, isHostedRound } from "../../../../components/hosted-round-label.js";
import { marketDetail } from "../../../../lib/market-data.js";

export const dynamic = "force-dynamic";

export default async function MarketDetailPage({ params }: { params: Promise<{ marketId: string }> }) {
  const { marketId } = await params;
  const market = await marketDetail(marketId);
  if (market === undefined) notFound();
  const explorerBase = readEndpoints(process.env).EXPLORER_BASE_CC3;
  const nowSec = Math.floor(Date.now() / 1000);
  const chip = deriveMarketChip(
    market.state,
    {
      lockTimeSec: market.lockTime,
      sourceWindowOpenSec: market.sourceWindowOpen,
      voidDeadlineSec: market.voidDeadline,
      expectedSettlementSec: expectedSettlementSecOf(market.sourceWindowOpen),
    },
    nowSec,
  );
  return (
    <div className="py-10">
      <SectionHead number={market.marketId.padStart(2, "0")} title={`Market ${market.marketId}`} accent="the derivation" />
      <div className="grid gap-10 lg:grid-cols-[7fr_5fr]">
        <div className="flex flex-col gap-8">
          <div className="flex items-center gap-3">
            <StateChip chip={chip} />
            <span className="font-data text-xs text-ink-muted">league day {market.leagueDay}</span>
          </div>

          {isHostedRound(market.emitter) ? <HostedRoundLabel /> : null}

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
              {market.payoutN} options, fixed at creation and immutable afterwards. The decoded
              value falls into exactly one of them, so no outcome is unrepresentable.
            </p>
            <ol className="mt-4 border-y border-rule font-data text-xs">
              {market.boundaries.map((boundary, index) => (
                <li key={boundary} className="flex justify-between gap-2 border-b border-rule py-2 last:border-b-0">
                  <span className="text-ink-muted">Threshold {index + 1}</span>
                  <span>{boundary}</span>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="lg:pt-1">
          {market.resolution === undefined ? (
            <div className="crop-ticks border border-rule bg-surface p-5">
              <span className="font-data text-xs uppercase tracking-widest text-ink-muted">Outcome</span>
              <p className="mt-3 font-body text-sm text-ink-muted">
                Not settled yet. When the source event happens, a proof of it is submitted and the
                outcome and its transaction appear here.
              </p>
            </div>
          ) : (
            <SettledRecordCard record={market.resolution} explorerBase={explorerBase} />
          )}
        </aside>
      </div>
    </div>
  );
}
