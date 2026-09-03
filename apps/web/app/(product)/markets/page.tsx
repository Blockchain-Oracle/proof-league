import Link from "next/link";
import { readEndpoints } from "@proof-league/chain";
import { SectionHead } from "../../../components/shell/section-head.js";
import { MarketCard } from "../../../components/market-card.js";
import { LiveRefresh } from "../../../components/live-refresh.js";
import { boardMarketViews } from "../../../lib/market-board.js";
import { featuredOf, type MarketView } from "../../../lib/market-view.js";

// The Markets board (Story 3.4): Featured, Today, Upcoming and Settled are four filters
// over ONE canonical query and ONE view model, so a Market cannot say different things
// depending on which tab you found it in. The board is a Server Component; only the live
// clock and the refresh poll are client behaviour.
export const dynamic = "force-dynamic";

const FILTERS = ["featured", "today", "upcoming", "settled"] as const;
type Filter = (typeof FILTERS)[number];

const LABEL: Record<Filter, string> = {
  featured: "Featured",
  today: "Today",
  upcoming: "Upcoming",
  settled: "Settled",
};

const isFilter = (value: string | undefined): value is Filter =>
  value !== undefined && (FILTERS as readonly string[]).includes(value);

const select = (views: readonly MarketView[], filter: Filter): MarketView[] => {
  if (filter === "featured") {
    const featured = featuredOf(views);
    return featured === undefined ? [] : [featured];
  }
  return views.filter((view) => view.bucket === filter);
};

/// Every empty state ends somewhere a visitor can go. An empty tab is a fact about this
/// league right now, so it says which tab is not empty rather than inventing a Market to
/// fill itself with (FR-2, PRODUCT-FLOWS section 4).
const EmptyState = ({ filter, counts }: { filter: Filter; counts: Record<Filter, number> }) => {
  const elsewhere = FILTERS.filter((other) => other !== filter && counts[other] > 0);
  return (
    <div className="max-w-xl py-10">
      <p className="font-body text-sm text-ink-muted">
        {filter === "today"
          ? "Nothing locks today. Markets are minted by the on-chain engine from its registered Series, so this fills itself when the next slot comes due."
          : filter === "upcoming"
            ? "Nothing is scheduled beyond today yet."
            : filter === "settled"
              ? "Nothing has settled on this deployment yet. When the first proof lands, the record and the transaction that proved it appear here."
              : "No Market is on the board yet. Markets appear the moment they exist on-chain, with their lock and settlement clocks."}
      </p>
      <div className="mt-4 flex flex-wrap gap-3 font-data text-[11px] uppercase tracking-widest">
        {elsewhere.map((other) => (
          <Link key={other} href={`/markets?view=${other}`} className="underline text-ink-muted hover:text-ink">
            {LABEL[other]} ({counts[other]})
          </Link>
        ))}
        <Link href="/transparency" className="underline text-ink-muted hover:text-ink">
          How settlement works
        </Link>
      </div>
    </div>
  );
};

export default async function MarketsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  const filter: Filter = isFilter(view) ? view : "featured";
  const nowSec = Math.floor(Date.now() / 1000);
  const views = await boardMarketViews(nowSec);
  const explorerBase = readEndpoints(process.env).EXPLORER_BASE_CC3;
  const counts: Record<Filter, number> = {
    featured: views.length === 0 ? 0 : 1,
    today: views.filter((market) => market.bucket === "today").length,
    upcoming: views.filter((market) => market.bucket === "upcoming").length,
    settled: views.filter((market) => market.bucket === "settled").length,
  };
  const shown = select(views, filter);

  return (
    <div className="py-10">
      <LiveRefresh />
      <SectionHead number="01" title="Markets" accent="the floor" />
      <nav aria-label="Market filters" className="mb-2 flex flex-wrap gap-x-5 gap-y-2 border-b border-rule pb-3">
        {FILTERS.map((candidate) => (
          <Link
            key={candidate}
            href={`/markets?view=${candidate}`}
            aria-current={candidate === filter ? "page" : undefined}
            className={`font-data text-xs uppercase tracking-widest ${
              candidate === filter ? "text-ink" : "text-ink-muted hover:text-ink"
            }`}
          >
            {LABEL[candidate]}
            <span className="ml-1.5 text-ink-muted">{counts[candidate]}</span>
          </Link>
        ))}
      </nav>

      {shown.length === 0 ? (
        <EmptyState filter={filter} counts={counts} />
      ) : (
        <div className="divide-y divide-rule">
          {shown.map((market) => (
            <MarketCard key={market.marketId} view={market} explorerBase={explorerBase} />
          ))}
        </div>
      )}

      <p className="mt-8 max-w-2xl border-l-2 border-rule pl-4 font-body text-sm text-ink-muted">
        Times are UTC and count down against Creditcoin chain time, which is the clock the
        contracts use. Rows here refresh themselves while this page is open.
      </p>
    </div>
  );
}
