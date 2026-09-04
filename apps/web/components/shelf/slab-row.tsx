"use client";

import Link from "next/link";
import { formatUtc, type CardStage } from "@proof-league/shared";
import { callTextOf, shortHash } from "../card/bands.js";
import { familyOfEmitter } from "../event/family.js";
import { Mark } from "../marks.js";
import type { MarketView } from "../../lib/market-view.js";

// A slab on the shelf (design: THE SHELF, 262px): the card with its family strip and
// date, MY CALL, a rule, two mono lines, then the foil that carries the verdict. Gold with
// a travelling sheen for correct, ash with no sheen for a miss, flat grey for void. An open
// Call sits unslabbed in its sealed colors until the chain decides.

export type ShelfCard = {
  readonly marketId: string;
  readonly nonce: number;
  readonly optionIndex: number;
  readonly stake: number;
  readonly live: boolean;
  readonly stage: CardStage;
  readonly view: MarketView;
};

const dateOf = (sec: number): string => {
  const [year, month, day] = formatUtc(sec).slice(0, 10).split("-");
  const names = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  return `${day} ${names[Number(month) - 1] ?? month} ${year?.slice(2) ?? ""}`.trim();
};

export function SlabRow({ card }: { card: ShelfCard }) {
  const family = familyOfEmitter(card.view.emitter);
  if (family === undefined) return null;
  const stage = card.stage;
  const call = callTextOf(card.view, family, card.optionIndex) ?? `OPTION ${card.optionIndex + 1}`;
  const pays = card.stake * card.view.options.length;
  const decided = stage.kind === "correct" || stage.kind === "incorrect";
  const won = stage.kind === "correct";
  const voided = card.view.voided;
  const settled = card.view.settlement;
  const line1 = decided && settled !== undefined
    ? `PROVEN ${settled.valueLabel} · ${won ? "CORRECT" : "MISS"}`
    : voided
      ? "NO EVENT INSIDE THE DEADLINE"
      : settled !== undefined
        ? `PROVEN ${settled.valueLabel} · SCORING`
        : card.view.locked
          ? `LOCKED · REPORT ${formatUtc(card.view.sourceWindowOpen).slice(11, 16)} UTC`
          : `OPEN · LOCKS ${formatUtc(card.view.lockTime).slice(11, 16)} UTC`;
  const line2 = decided
    ? `${card.stake} PTS IN · ${won ? pays : 0} OUT${stage.score.streakAfter === undefined ? "" : ` · STREAK ${stage.score.streakAfter}`}`
    : voided
      ? `VOID · ${card.stake} PTS RETURNED IN FULL`
      : `${card.stake} PTS DOWN · PAYS ${pays}`;
  const foil = won ? "foil-gold foil-sheen" : decided ? "foil-ash" : voided ? "foil-void" : "";
  const foilText = won || decided ? "PROVEN ON CREDITCOIN" : voided ? "VOID · POINTS RETURNED" : card.live ? "SEALED" : "SUPERSEDED";
  const tx = decided && settled?.proofTxHash ? shortHash(settled.proofTxHash) : voided ? "NO PROOF" : `SERIAL ${card.marketId}-${card.nonce}`;
  const slabbed = decided || voided;

  return (
    <Link href={`/play?m=${card.marketId}`} className="flex w-[262px] shrink-0 flex-col gap-[11px]" aria-label={`${family.name}, ${call}`}>
      <div className={`fam-${family.id} relative rounded-[20px] p-[14px_12px_12px] ${slabbed ? "slab-glass-shelf border-2 border-white/40 shadow-[0_14px_34px_rgba(0,0,0,.4)]" : "border-2 border-dashed border-gold/30"}`}>
        <div className="overflow-hidden rounded-[13px] border-[3px] border-ink bg-stock">
          <div className="flex items-center gap-2 border-b-[3px] border-ink bg-(--fam) px-[11px] py-2">
            <span className="flex h-[22px] w-[22px] items-center justify-center rounded-md border-2 border-ink bg-stock text-(--fam)"><Mark id={family.crest} size={12} /></span>
            <span className="font-display text-[11px] font-extrabold text-stock">{family.name}</span>
            <span className="ml-auto font-data text-[8px] text-stock/80">{dateOf(card.view.lockTime)}</span>
          </div>
          <div className="p-3">
            <div className="font-data text-[8.5px] tracking-[.16em] text-stock-3">MY CALL</div>
            <div className="mt-[5px] font-display text-[21px] font-extrabold tracking-[-.035em] text-ink">{call}</div>
            <div className="my-[11px] h-0.5 bg-ink" />
            <div className="font-data text-[9.5px] leading-[1.8] text-stock-2">
              {line1}
              <br />
              {line2}
            </div>
          </div>
        </div>
        <div className={`mt-[11px] flex items-center justify-between rounded-[9px] border-2 border-ink px-[11px] py-2 ${foil === "" ? "card-back" : foil}`}>
          <span className={`font-display text-[12px] font-extrabold tracking-[.02em] ${foil === "" ? "text-gold" : "text-ink-green"}`}>{foilText}</span>
          <span className={`font-data text-[8.5px] ${foil === "" ? "text-felt-3" : "text-ink-green/80"}`}>{tx}</span>
        </div>
      </div>
    </Link>
  );
}
