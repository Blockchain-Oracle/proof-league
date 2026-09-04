import { formatUtc } from "@proof-league/shared";
import { DeckCard, type DeckPill } from "../../../components/deck/deck-card.js";
import { DECK_ORDER, FAMILIES, familyOfEmitter } from "../../../components/event/family.js";
import { chainClock } from "../../../lib/chain-clock.js";
import { boardMarketViews } from "../../../lib/market-board.js";
import { reelOrderOf, type MarketView } from "../../../lib/market-view.js";

// DECK (design: THE DECK): the cards on the table first, real and linked, then the eight
// card types. Only LIVE and CAPABLE families are inventory; the rest are drawn as types and
// say what they wait on. Nothing here is invented to make the shelf look fuller.

export const dynamic = "force-dynamic";

const hm = (sec: number): string => formatUtc(sec).slice(11, 16);

const pillOf = (view: MarketView): DeckPill =>
  view.voided ? "VOIDED" : view.settlement !== undefined ? "SETTLED" : view.locked ? "LOCKED" : "LIVE";

const captionOf = (view: MarketView): string =>
  view.voided
    ? `CARD ${view.marketId.padStart(3, "0")} · VOIDED AT ITS DEADLINE`
    : view.settlement !== undefined
      ? `CARD ${view.marketId.padStart(3, "0")} · PROVEN ${view.settlement.valueLabel}`
      : view.locked
        ? `CARD ${view.marketId.padStart(3, "0")} · REPORT ${hm(view.sourceWindowOpen)} UTC`
        : `CARD ${view.marketId.padStart(3, "0")} · LOCKS ${hm(view.lockTime)} UTC`;

export default async function DeckPage() {
  const clock = await chainClock();
  const views = reelOrderOf(await boardMarketViews(clock.chainNowSec)).filter((view) => familyOfEmitter(view.emitter) !== undefined);
  return (
    <div className="flex flex-col gap-12 px-4 py-8 md:px-10 md:py-12">
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h1 className="font-display text-[34px] font-extrabold tracking-[-.04em] text-stock">On the table</h1>
          <span className="font-serif text-[26px] italic text-gold">{views.length === 0 ? "nothing dealt yet" : `${views.length} card${views.length === 1 ? "" : "s"}`}</span>
          <span className="font-data text-[10.5px] tracking-[.12em] text-felt-3">EVERY CARD THAT EXISTS ON-CHAIN · LIVE, LOCKED, SETTLED OR VOIDED</span>
        </div>
        {views.length === 0 ? (
          <p className="max-w-[520px] font-body text-[14px] leading-relaxed text-felt-1">
            No card exists on-chain right now. The table shows one the moment the engine mints it, never before.
          </p>
        ) : (
          <div className="flex gap-3.5 overflow-x-auto py-3.5 pb-6">
            {views.map((view, index) => {
              const family = familyOfEmitter(view.emitter);
              if (family === undefined) return null;
              return (
                <DeckCard
                  key={view.marketId}
                  family={family}
                  pill={pillOf(view)}
                  question={family.deckQuestion}
                  caption={captionOf(view)}
                  index={index}
                  href={`/play?m=${view.marketId}`}
                  selected={view.settlement?.winningOption}
                />
              );
            })}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h2 className="font-display text-[34px] font-extrabold tracking-[-.04em] text-stock">The deck</h2>
          <span className="font-serif text-[26px] italic text-gold">eight card types</span>
          <span className="font-data text-[10.5px] tracking-[.12em] text-felt-3">
            EACH FAMILY IS A DIFFERENT OBJECT · COVER THE LABELS AND YOU STILL KNOW WHICH IS WHICH · ONLY LIVE ONES ARE INVENTORY
          </span>
        </div>
        <div className="flex gap-3.5 overflow-x-auto py-3.5 pb-6">
          {DECK_ORDER.map((id, index) => {
            const family = FAMILIES[id];
            return <DeckCard key={id} family={family} pill={family.status} question={family.deckQuestion} caption={family.caption} index={index} />;
          })}
        </div>
      </section>
    </div>
  );
}
