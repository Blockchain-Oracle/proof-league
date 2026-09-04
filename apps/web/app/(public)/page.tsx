import Link from "next/link";
import { readEndpoints } from "@proof-league/chain";
import { formatUtc } from "@proof-league/shared";
import { Countdown } from "../../components/countdown.js";
import { StateChip } from "../../components/state-chip.js";
import { MarketReceipt } from "../../components/market/market-receipt.js";
import { Mark } from "../../components/marks.js";
import { chainClock } from "../../lib/chain-clock.js";
import { boardMarketViews } from "../../lib/market-board.js";
import { latestSettledOf, nextToLockOf } from "../../lib/market-view.js";

// The landing (Story 3.2): a visitor sees what is being predicted and how it settles in
// the first viewport, then one real proof-backed record with links that resolve publicly.
// Both exhibits render structural empty states when the league has nothing real yet —
// never a blank, never a fabricated hero (FR-2, PRODUCT-FLOWS §4).
export const dynamic = "force-dynamic";

const STEPS = [
  {
    number: "01",
    title: "Picks commit before the answer exists",
    body: "Every Pick is signed, published in full, and its hash goes on-chain after Lock Time and before the event's window opens. The chain refuses a late one.",
  },
  {
    number: "02",
    title: "A real event settles it",
    body: "Something happens on Ethereum. A proof of that log is checked on Creditcoin against seven conditions: right chain, right contract, right event, right subject, not replayed, not early, real prover.",
  },
  {
    number: "03",
    title: "The contract scores everyone",
    body: "The decoded value lands in one option and the contract pays the Picks that called it. Nobody reports the outcome, and no operator decision sits anywhere in that path.",
  },
] as const;

export default async function Home() {
  // Chain time (AD-10): the landing quotes the same clock the Market page and intake do.
  const { chainNowSec } = await chainClock();
  // One board read serves both exhibits, through the same view model the Markets page
  // uses, so the landing cannot describe a Market differently from the board it links to.
  const views = await boardMarketViews(chainNowSec);
  const featured = nextToLockOf(views);
  const settled = latestSettledOf(views);
  const explorerBase = readEndpoints(process.env).EXPLORER_BASE_CC3;
  return (
    <div className="flex flex-col gap-16 py-14 md:gap-24 md:py-20">
      <section className="grid gap-10 lg:grid-cols-[7fr_5fr] lg:items-start lg:gap-12">
        <div>
          <h1 className="font-display text-5xl font-extrabold tracking-tight md:text-6xl">
            Predict real events. <span className="editorial-accent font-normal text-brand">Proof settles it.</span>
          </h1>
          <p className="mt-6 max-w-xl font-body text-lg text-ink-muted">
            A prediction league where real Ethereum events are the matches and a cryptographic proof
            is the referee. Free points, a public record, no money.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/markets"
              className="bg-brand px-5 py-2.5 font-display text-sm font-bold text-white hover:bg-brand-deep"
            >
              Open the Markets
            </Link>
            <Link
              href="/transparency"
              className="border border-rule px-5 py-2.5 font-display text-sm font-semibold text-ink hover:border-ink"
            >
              See how settlement works
            </Link>
          </div>
          <div className="crop-ticks mt-10 max-w-xl border border-rule bg-surface p-5">
            {featured === undefined ? (
              <p className="font-data text-sm text-ink-muted">
                No market is open right now. The next one appears here the moment it exists on-chain,
                with its lock and settlement clocks.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-data text-xs uppercase tracking-widest text-ink-muted">
                    Open now: market {featured.marketId}
                  </span>
                  <StateChip chip={featured.chip} />
                </div>
                <Link href={`/markets/${featured.marketId}`} className="font-display text-lg font-bold hover:text-brand">
                  {featured.question}
                </Link>
                <p className="font-data text-sm text-ink-muted">
                  Locks{" "}
                  <span className="text-ink">
                    <Countdown
                      targetSec={featured.lockTime}
                      absolute={formatUtc(featured.lockTime)}
                      passed="lock time has passed"
                    />
                  </span>{" "}
                  · settles by proof after {formatUtc(featured.sourceWindowOpen)}
                </p>
              </div>
            )}
          </div>
        </div>
        <div className="lg:pt-2">
          {settled === undefined ? (
            <div className="crop-ticks border border-rule bg-surface p-5">
              <span className="font-data text-xs uppercase tracking-widest text-ink-muted">
                Latest settled Market
              </span>
              <p className="mt-3 font-body text-sm text-ink-muted">
                Nothing has settled on this deployment yet. When the first proof lands, the record
                and the transaction that proved it appear here. We will not show one before then.
              </p>
            </div>
          ) : (
            <MarketReceipt view={settled} explorerBase={explorerBase} />
          )}
        </div>
      </section>

      <section>
        <div className="crop-ticks mb-8 border-b border-rule pb-3">
          <div className="flex items-baseline gap-3">
            <span className="font-data text-xs text-ink-muted">02</span>
            <span className="text-ink-muted">
              <Mark id="proof-league" size={14} />
            </span>
            <h2 className="font-display text-xl font-bold tracking-tight">How a Pick becomes a record</h2>
            <span className="editorial-accent hidden text-sm text-ink-muted sm:inline">three steps</span>
          </div>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {STEPS.map((step) => (
            <div key={step.number}>
              <span className="font-data text-xs text-brand">{step.number}</span>
              <h3 className="mt-2 font-display text-base font-bold">{step.title}</h3>
              <p className="mt-2 font-body text-sm text-ink-muted">{step.body}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 max-w-2xl border-l-2 border-rule pl-4 font-body text-sm text-ink-muted">
          Points are free and have no monetary value. A Pick spends from a small daily allowance
          that resets, so the only thing at stake is your record.
        </p>
      </section>
    </div>
  );
}
