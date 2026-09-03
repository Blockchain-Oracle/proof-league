import Link from "next/link";
import { deriveMarketChip, expectedSettlementSecOf, formatUtc } from "@proof-league/shared";
import { StateChip } from "../../components/state-chip.js";
import { nextMarketToLock } from "../../lib/market-data.js";

// The landing hero (REFERENCE-DESIGN §5): Sora headline, ONE Noto Serif JP phrase, live
// featured Market evidence, one vermilion primary action and one proof-oriented
// secondary action. The evidence slot renders the real next-lock market from the class-1
// projection or an honest absence, never a fabricated row (FR-2).
export const dynamic = "force-dynamic";

export default async function Home() {
  const featured = await nextMarketToLock();
  const nowSec = Math.floor(Date.now() / 1000);
  return (
    <div className="flex flex-col gap-10 py-14 md:py-20">
      <div className="max-w-3xl">
        <h1 className="font-display text-5xl font-extrabold tracking-tight md:text-6xl">
          Predict real events. <span className="editorial-accent font-normal text-brand">Proof settles it.</span>
        </h1>
        <p className="mt-6 max-w-2xl font-body text-lg text-ink-muted">
          A prediction league where real Ethereum events are the matches and a cryptographic proof
          is the referee. Free points, a public record, no money.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/markets"
          className="bg-brand px-5 py-2.5 font-display text-sm font-bold text-white hover:bg-brand-deep"
        >
          Open the Markets
        </Link>
        <Link
          href="/record"
          className="border border-rule px-5 py-2.5 font-display text-sm font-semibold text-ink hover:border-ink"
        >
          Read the settled record
        </Link>
      </div>
      <div className="crop-ticks max-w-xl border border-rule bg-surface p-5">
        {featured === undefined ? (
          <p className="font-data text-sm text-ink-muted">
            No market is currently open. The first proof-backed settlement appears here when it is
            real, never sooner.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <span className="font-data text-xs uppercase tracking-widest text-ink-muted">
                Next to lock: market {featured.marketId}
              </span>
              <StateChip
                chip={deriveMarketChip(
                  featured.state,
                  {
                    lockTimeSec: featured.lockTime,
                    sourceWindowOpenSec: featured.sourceWindowOpen,
                    voidDeadlineSec: featured.voidDeadline,
                    expectedSettlementSec: expectedSettlementSecOf(featured.sourceWindowOpen),
                  },
                  nowSec,
                )}
              />
            </div>
            <p className="font-data text-sm">
              Locks {formatUtc(featured.lockTime)} · settles by proof after {formatUtc(featured.sourceWindowOpen)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
