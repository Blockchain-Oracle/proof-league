import Link from "next/link";
import { readEndpoints } from "@proof-league/chain";
import { SectionHead } from "../../../components/shell/section-head.js";
import { MarketCard } from "../../../components/market-card.js";
import { LiveRefresh } from "../../../components/live-refresh.js";
import { ReelKeys } from "../../../components/reel-keys.js";
import { PointsComposer } from "../../../components/market/composer.js";
import { composerAvailabilityOf } from "../../../features/picks/availability.js";
import { chainClock } from "../../../lib/chain-clock.js";
import { boardMarketViews } from "../../../lib/market-board.js";
import { reelOrderOf } from "../../../lib/market-view.js";

// Reels (Story 3.9, FR-23): one real Market at a time, for a Player moving fast on a
// phone. It is deliberately thin. Every fact on screen comes from the canonical view
// model and the Market renders through the SAME card the board uses, because a discovery
// surface that grew its own idea of a Market would be a second product with the first
// one's data.
//
// The eslint zone for this route forbids importing signing, payout or submission code
// (AD-23, UX-DR14): the integrity model stays singular by construction, not by review.
//
// The cursor is the URL, which makes it shareable, restorable and back-button correct,
// and it is bounded: no wrap around, and the end of the feed says so.
export const dynamic = "force-dynamic";

export default async function ReelsPage({ searchParams }: { searchParams: Promise<{ at?: string }> }) {
  const { at } = await searchParams;
  // Chain time, the clock the contracts and intake use (AD-10), so a Market this feed shows
  // as still open is one the door agrees is still open.
  const { chainNowSec } = await chainClock();
  const views = reelOrderOf(await boardMarketViews(chainNowSec));
  const explorerBase = readEndpoints(process.env).EXPLORER_BASE_CC3;

  if (views.length === 0) {
    return (
      <div className="py-10">
        <SectionHead number="02" title="Reels" accent="one market at a time" />
        <p className="max-w-xl font-body text-sm text-ink-muted">
          There is nothing to move through yet. Markets appear the moment they exist on-chain,
          and this feed follows the same list the board shows.
        </p>
        <Link
          href="/markets"
          className="mt-4 inline-block border border-rule px-4 py-1.5 font-data text-[11px] uppercase tracking-widest hover:border-ink"
        >
          Open the Markets board
        </Link>
      </div>
    );
  }

  // An unknown or stale cursor resolves to the start rather than to an error: a link
  // shared after its Market left the feed should still land somewhere real.
  const found = at === undefined ? 0 : views.findIndex((view) => view.marketId === at);
  const index = found < 0 ? 0 : found;
  const view = views[index];
  if (view === undefined) return null;
  const previous = views[index - 1];
  const next = views[index + 1];
  const hrefOf = (target: typeof view | undefined): string | undefined =>
    target === undefined ? undefined : `/reels?at=${target.marketId}`;

  return (
    <div className="flex min-h-[calc(100svh-13rem)] flex-col py-6">
      <LiveRefresh />
      <ReelKeys prevHref={hrefOf(previous)} nextHref={hrefOf(next)} />
      <div className="flex items-baseline justify-between gap-3 border-b border-rule pb-3">
        <h2 className="font-display text-xl font-bold tracking-tight">Reels</h2>
        <span className="font-data text-xs text-ink-muted">
          {index + 1} of {views.length}
        </span>
      </div>

      <div className="flex-1">
        <MarketCard view={view} explorerBase={explorerBase} />
        {/* The SAME composer the Market page opens (rebaseline section 5.1): a Game or a
            feed may change how a Market is presented, and may never change what a Pick
            costs, when it closes or what the signature covers. Reels imports the component
            rather than growing a fast-feed version of it, which is the whole point of the
            import ban on this route. */}
        <div className="mt-6">
          <PointsComposer
            market={{
              marketId: view.marketId,
              question: view.question,
              sourceLine: view.sourceLine,
              options: view.options.map((option) => ({ index: option.index, label: option.label })),
              lockTimeSec: view.lockTime,
              expectedSettlementSec: view.expectedSettlement,
            }}
            availability={composerAvailabilityOf(view, chainNowSec)}
          />
        </div>
      </div>

      <nav className="flex items-center justify-between gap-3 border-t border-rule pt-4" aria-label="Reels navigation">
        {previous === undefined ? (
          <span className="font-data text-[11px] uppercase tracking-widest text-ink-muted">Start of the feed</span>
        ) : (
          <Link
            href={`/reels?at=${previous.marketId}`}
            rel="prev"
            className="border border-rule px-4 py-2 font-data text-[11px] uppercase tracking-widest hover:border-ink"
          >
            Previous
          </Link>
        )}
        {next === undefined ? (
          <span className="flex flex-wrap items-center gap-3 font-data text-[11px] uppercase tracking-widest text-ink-muted">
            You are caught up
            <Link href="/markets?view=today" className="underline hover:text-ink">
              Today
            </Link>
            <Link href="/markets?view=upcoming" className="underline hover:text-ink">
              Upcoming
            </Link>
          </span>
        ) : (
          <Link
            href={`/reels?at=${next.marketId}`}
            rel="next"
            className="border border-rule px-4 py-2 font-data text-[11px] uppercase tracking-widest hover:border-ink"
          >
            Next
          </Link>
        )}
      </nav>
      <p className="mt-3 font-data text-[11px] text-ink-muted">
        Arrow keys, j and k, or a swipe move between Markets. Market Rooms and the sharing
        lifecycle arrive with their own stories.
      </p>
    </div>
  );
}
