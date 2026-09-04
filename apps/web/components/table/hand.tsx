"use client";

import { Mark } from "../marks.js";
import type { HandCard } from "./hand-data.js";

// Your hand (design frame A: TODAY'S DEAL as fanned 96x112 minis, the held one lifted,
// the ones that cannot be played dimmed, and a dashed face-down card counting what is in
// the deck but not admitted). Live and settled cards come from the projection; NEXT and
// CONCEPT come from the family registry and are never inventory.

const ROTATIONS = ["-rotate-[7deg] translate-y-1.5", "-rotate-[2deg] translate-y-0", "rotate-[3deg] translate-y-0.5", "rotate-[8deg] translate-y-2", "rotate-[11deg] translate-y-3"];

export function Hand({ cards, heldId, onHold, notAdmitted }: { cards: readonly HandCard[]; heldId: string | undefined; onHold: (marketId: string) => void; notAdmitted: number }) {
  return (
    <div className="flex flex-col gap-[9px]">
      <div className="font-data text-[9.5px] tracking-[.18em] text-felt-2">YOUR HAND · TODAY&apos;S DEAL</div>
      <div className="flex h-28 items-end pl-4">
        {cards.map((card, index) => {
          const held = card.marketId !== undefined && card.marketId === heldId;
          const playable = card.marketId !== undefined;
          return (
            <button
              key={card.key}
              type="button"
              disabled={!playable}
              onClick={() => { if (card.marketId !== undefined) onHold(card.marketId); }}
              aria-label={`${card.family.name}: ${card.question}`}
              className={`fam-${card.family.id} -ml-4 h-28 w-24 origin-bottom overflow-hidden rounded-[11px] border-[3px] border-ink bg-stock text-left shadow-[0_6px_0_rgba(0,0,0,.32)] transition-transform duration-200 ${ROTATIONS[index] ?? ""} ${held ? "-translate-y-[22px]" : ""} ${playable ? "hover:-translate-y-4 hover:rotate-0" : "opacity-60"}`}
            >
              <div className="flex h-[26px] items-center justify-between border-b-2 border-ink bg-(--fam) px-[7px]">
                <span className="flex h-4 w-4 items-center justify-center text-stock"><Mark id={card.family.crest} size={12} /></span>
                <span className="font-data text-[7px] tracking-[.08em] text-stock/85">{card.chip}</span>
              </div>
              <div className="p-[7px]">
                <div className="font-display text-[10.5px] font-bold leading-[1.2] tracking-[-.02em] text-ink">{card.question}</div>
                <div className="mt-1.5 font-data text-[7px] text-stock-3">{card.clock}</div>
              </div>
            </button>
          );
        })}
        <div className="ml-[22px] flex flex-col items-center gap-1.5">
          <div className="seat-back-soft flex h-[88px] w-[66px] items-center justify-center rounded-[10px] border-2 border-dashed border-gold/35">
            <span className="font-display text-[19px] font-extrabold text-gold/55">{notAdmitted}</span>
          </div>
          <div className="text-center font-data text-[8px] leading-[1.6] tracking-[.1em] text-felt-4">
            IN THE DECK
            <br />
            NOT ADMITTED
          </div>
        </div>
      </div>
    </div>
  );
}
