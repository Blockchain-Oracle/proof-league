import { deriveMarketChip, expectedSettlementSecOf, formatUtc } from "@proof-league/shared";
import Link from "next/link";
import { SectionHead } from "../../../components/shell/section-head.js";
import { StateChip } from "../../../components/state-chip.js";
import { listBoardMarkets } from "../../../lib/market-data.js";

// The Market Board's shell (Story 3.1; the full instrument-panel board is Story 3.2):
// question-first rows separated by rules, every row carrying state + absolute times.
// Rows come from the class-1 projection or the board renders its honest empty state.
export const dynamic = "force-dynamic";

export default async function MarketsPage() {
  const rows = await listBoardMarkets();
  const nowSec = Math.floor(Date.now() / 1000);
  return (
    <div className="py-10">
      <SectionHead number="01" title="Markets" accent="the floor" />
      {rows.length === 0 ? (
        <p className="max-w-xl font-body text-sm text-ink-muted">
          No markets are on the board yet. Markets appear here the moment they exist on-chain,
          with their lock and settlement clocks; nothing on this floor is ever staged.
        </p>
      ) : (
        <ul className="divide-y divide-rule border-y border-rule">
          {rows.map((market) => (
            <li key={market.marketId} className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div className="flex flex-col gap-1">
                <Link href={`/markets/${market.marketId}`} className="font-display text-sm font-semibold hover:text-brand">
                  Market {market.marketId}
                </Link>
                <span className="font-data text-xs text-ink-muted">
                  locks {formatUtc(market.lockTime)} · league day {market.leagueDay} · {market.payoutN} options
                </span>
              </div>
              <StateChip
                chip={deriveMarketChip(
                  market.state,
                  {
                    lockTimeSec: market.lockTime,
                    sourceWindowOpenSec: market.sourceWindowOpen,
                    voidDeadlineSec: market.voidDeadline,
                    expectedSettlementSec: expectedSettlementSecOf(market.sourceWindowOpen),
                  },
                  nowSec,
                )}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
