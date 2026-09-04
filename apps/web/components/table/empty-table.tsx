import Link from "next/link";
import { conceptHand } from "./hand-data.js";
import { Mark } from "../marks.js";

// The table with no card on it: the projection is unreachable, or nothing is dealt yet.
// It says which, names the next deal when it knows one, and never lays a fake card down.

export function EmptyTable({ note, nextSlot }: { note: string | undefined; nextSlot: string | undefined }) {
  const concepts = conceptHand();
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-12 text-center">
      {note === "moved" ? <p className="font-data text-[9.5px] tracking-[.14em] text-felt-3">THAT PAGE MOVED. HERE IS THE TABLE.</p> : null}
      <div className="seat-back-soft flex h-[190px] w-[140px] items-center justify-center rounded-[16px] border-2 border-dashed border-gold/35">
        <Mark id="proof-league" size={44} title="Proof League" />
      </div>
      <div>
        <div className="font-display text-[28px] font-extrabold tracking-[-.03em] text-stock">No card on the table</div>
        <p className="mt-2 max-w-[440px] font-body text-[14px] leading-relaxed text-felt-1">
          {nextSlot === undefined
            ? "Nothing is dealt right now. The table only shows a card once it exists on-chain, so it stays empty rather than pretending."
            : `The next deal is ${nextSlot}. Cards appear here the moment the engine mints them.`}
        </p>
      </div>
      <div className="flex gap-3">
        {concepts.map((card) => (
          <div key={card.key} className={`fam-${card.family.id} w-24 overflow-hidden rounded-[11px] border-[3px] border-ink bg-stock text-left opacity-60`}>
            <div className="flex h-[26px] items-center justify-between border-b-2 border-ink bg-(--fam) px-[7px]">
              <span className="text-stock"><Mark id={card.family.crest} size={12} /></span>
              <span className="font-data text-[7px] tracking-[.08em] text-stock/85">{card.chip}</span>
            </div>
            <div className="p-[7px]">
              <div className="font-display text-[10.5px] font-bold leading-[1.2] tracking-[-.02em] text-ink">{card.question}</div>
              <div className="mt-1.5 font-data text-[7px] text-stock-3">{card.clock}</div>
            </div>
          </div>
        ))}
      </div>
      <Link href="/deck" className="font-data text-[10px] tracking-[.14em] text-gold">SEE THE DECK</Link>
    </div>
  );
}
