import { formatUtc } from "@proof-league/shared";
import { readEndpoints } from "@proof-league/chain";
import { Table, type HeldCard } from "../../../components/table/table.js";
import { conceptHand, type HandCard } from "../../../components/table/hand-data.js";
import { DECK_ORDER, FAMILIES, familyOfEmitter } from "../../../components/event/family.js";
import { chainClock } from "../../../lib/chain-clock.js";
import { boardMarketViews } from "../../../lib/market-board.js";
import { latestSettledOf, nextToLockOf, reelOrderOf, type MarketView } from "../../../lib/market-view.js";
import { lampsOf, phaseRowsFor, seatsFor } from "../../../lib/table-data.js";
import { roundConfigFor, sepoliaHead } from "../../../lib/sepolia.js";
import { EmptyTable } from "../../../components/table/empty-table.js";

// PLAY: the table (design frame A/B). The hand is what the projection dealt today plus
// the settled replays; the held card is `?m=` or the next to lock, failing that the most
// recently settled. Everything the table renders is read here, against chain time.

export const dynamic = "force-dynamic";

const hm = (sec: number): string => formatUtc(sec).slice(11, 16);

const handCardOf = (view: MarketView): HandCard | undefined => {
  const family = familyOfEmitter(view.emitter);
  if (family === undefined) return undefined;
  const live = view.settlement === undefined && !view.voided;
  return {
    key: `m-${view.marketId}`,
    family,
    chip: live ? "LIVE" : "REPLAY",
    question: family.deckQuestion,
    clock: live ? (view.locked ? `LOCKED · REPORT ${hm(view.sourceWindowOpen)} UTC` : `LOCKS ${hm(view.lockTime)} UTC`) : view.voided ? "VOIDED" : `CARD ${view.marketId.padStart(3, "0")} SETTLED`,
    marketId: view.marketId,
  };
};

export default async function PlayPage({ searchParams }: { searchParams: Promise<{ m?: string; note?: string; band?: string }> }) {
  const params = await searchParams;
  const clock = await chainClock();
  const views = await boardMarketViews(clock.chainNowSec);
  const playable = reelOrderOf(views).filter((view) => familyOfEmitter(view.emitter) !== undefined);
  const notAdmitted = DECK_ORDER.filter((id) => FAMILIES[id].status !== "LIVE" && FAMILIES[id].status !== "CAPABLE").length;
  const hand: HandCard[] = [
    ...playable.slice(0, 3).map(handCardOf).filter((card): card is HandCard => card !== undefined),
    ...conceptHand(),
  ];

  const requested = params.m !== undefined ? playable.find((view) => view.marketId === params.m) : undefined;
  // The card on the table: the one still to be decided with the nearest lock (locked and
  // waiting counts, that is the live drama), failing that the most recently settled.
  const undecided = playable.filter((view) => view.settlement === undefined && !view.voided).sort((a, b) => a.lockTime - b.lockTime)[0];
  const view = requested ?? undecided ?? latestSettledOf(playable) ?? playable[0];
  const family = view === undefined ? undefined : familyOfEmitter(view.emitter);
  if (view === undefined || family === undefined) {
    return <EmptyTable note={params.note} nextSlot={nextSlotLabel(views)} />;
  }

  const [seats, rows, round, head] = await Promise.all([
    seatsFor(view.marketId, view.options.length),
    phaseRowsFor(view.marketId, view.sourceKey),
    family.instrument === "windows" ? roundConfigFor(view.subjectFilter) : Promise.resolve(undefined),
    family.instrument === "windows" ? sepoliaHead() : Promise.resolve(undefined),
  ]);
  const held: HeldCard = {
    view,
    family,
    seats,
    lamps: lampsOf(rows, view.settlement),
    settleBlock: round?.settleBlock,
    blocksToGo: round !== undefined && head !== undefined ? Math.max(0, round.settleBlock - head) : undefined,
    explorerBase: readEndpoints(process.env).EXPLORER_BASE_CC3,
  };
  return (
    <>
      {params.note === "moved" ? (
        <p className="px-4 pt-2 text-center font-data text-[9.5px] tracking-[.14em] text-felt-3 md:px-7">THAT PAGE MOVED. HERE IS THE TABLE.</p>
      ) : null}
      <Table hand={hand} held={held} chainNowSec={clock.chainNowSec} notAdmitted={notAdmitted} presetBand={params.band !== undefined && /^\d$/.test(params.band) ? Number(params.band) : undefined} />
    </>
  );
}

/// The next deal, in the words the design uses, from the next Market still to lock. A
/// league between slots says when the next one opens rather than inventing a card.
const nextSlotLabel = (views: readonly MarketView[]): string | undefined => {
  const next = nextToLockOf(views);
  if (next === undefined) return undefined;
  return `${formatUtc(next.lockTime).slice(0, 10)} · LOCKS ${hm(next.lockTime)} UTC`;
};
