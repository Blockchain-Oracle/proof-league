"use client";

import { AvatarTile, shortAddress } from "../shell/account.js";
import type { Seat } from "../../lib/table-data.js";

// The other seats (design frame A: five face-down cards on an ellipse, each with its
// tile and name; frame B: a strip of five minis). They stay face down until proof and
// then flip to show the band letter, green where it won and ash where it did not. Seats
// are committed Calls only; before lock the arc is empty and says when it fills.

export type SeatsArcProps = {
  readonly seats: readonly Seat[];
  readonly you: string | undefined;
  readonly flipped: boolean;
  readonly winningOption: number | undefined;
  readonly lockLabel: string;
  readonly committed: boolean;
  readonly compact?: boolean;
};

const ROTATIONS = ["-rotate-[9deg] translate-y-3", "-rotate-[4deg] translate-y-0.5", "rotate-0 -translate-y-0.5", "rotate-[4deg] translate-y-0.5", "rotate-[9deg] translate-y-3"];
const LETTERS = "ABCDEF";

export function SeatsArc({ seats, you, flipped, winningOption, lockLabel, committed, compact = false }: SeatsArcProps) {
  const others = seats.filter((seat) => you === undefined || seat.player.toLowerCase() !== you.toLowerCase()).slice(0, 5);
  const note = !committed
    ? `SEATS FILL AT LOCK · ${lockLabel}`
    : others.length === 0
      ? "NO OTHER SEAT ON THIS CARD"
      : flipped
        ? `${others.length} OTHER SEAT${others.length === 1 ? "" : "S"} · FACES UP`
        : `${others.length} OTHER SEAT${others.length === 1 ? "" : "S"} · FACE DOWN UNTIL PROOF`;
  const letterOf = (optionIndex: number) => LETTERS[optionIndex] ?? String(optionIndex + 1);
  const slots = Array.from({ length: 5 }, (_, index) => others[index]);

  if (compact) {
    return (
      <div className="flex h-[46px] shrink-0 items-center gap-[7px] px-4">
        {slots.map((seat, index) => (
          <div key={seat?.player ?? index} className="seat-flipper relative h-11 w-[34px]" data-flipped={flipped && seat !== undefined ? "true" : "false"}>
            <div className={`face absolute inset-0 rounded-md border-2 ${seat === undefined ? "border-dashed border-gold/35 seat-back-soft" : "border-ink-green seat-back"}`} />
            {seat === undefined ? null : (
              <div className="face face-back absolute inset-0 flex items-center justify-center rounded-md border-2 border-ink-green bg-stock">
                <span className={`font-display text-[13px] font-extrabold ${seat.optionIndex === winningOption ? "text-correct" : "text-ash"}`}>{letterOf(seat.optionIndex)}</span>
              </div>
            )}
          </div>
        ))}
        <div className="ml-auto text-right font-data text-[8px] leading-[1.5] tracking-[.1em] text-felt-4">{note}</div>
      </div>
    );
  }

  return (
    <div className="relative flex h-[118px] w-full shrink-0 items-start justify-center">
      <div className="absolute left-1/2 top-14 h-[190px] w-[820px] -translate-x-1/2 rounded-[50%] border border-gold/15" aria-hidden="true" />
      <div className="flex items-start gap-[26px]">
        {slots.map((seat, index) => (
          <div key={seat?.player ?? index} className={`flex flex-col items-center gap-[7px] ${ROTATIONS[index]}`}>
            <div className="seat-flipper relative h-[82px] w-[62px]" data-flipped={flipped && seat !== undefined ? "true" : "false"}>
              <div className={`face absolute inset-0 flex items-center justify-center rounded-lg border-2 ${seat === undefined ? "border-dashed border-gold/35 seat-back-soft" : "border-ink-green seat-back shadow-[0_4px_0_rgba(0,0,0,.35)]"}`}>
                <div className="h-[22px] w-[22px] rounded-full border-2 border-gold/50" />
              </div>
              {seat === undefined ? null : (
                <div className="face face-back absolute inset-0 flex flex-col justify-between rounded-lg border-2 border-ink-green bg-stock p-1.5 shadow-[0_4px_0_rgba(0,0,0,.35)]">
                  <span className="font-data text-[7px] tracking-[.08em] text-stock-3">BAND {letterOf(seat.optionIndex)}</span>
                  <span className={`font-display text-[15px] font-extrabold tracking-[-.03em] ${seat.optionIndex === winningOption ? "text-correct" : "text-ash"}`}>{letterOf(seat.optionIndex)}</span>
                  <span className="font-data text-[7.5px] text-stock-3">{seat.stake} PTS</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-[5px]">
              {seat === undefined ? (
                <span className="font-data text-[8.5px] tracking-[.06em] text-felt-4">EMPTY</span>
              ) : (
                <>
                  <AvatarTile address={seat.player} className="h-[15px] w-[15px] rounded-[5px] border-[1.5px]" />
                  <span className="font-data text-[8.5px] tracking-[.06em] text-felt-2">{shortAddress(seat.player)}</span>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="absolute right-[34px] top-2 text-right font-data text-[9px] leading-[1.8] tracking-[.14em] text-felt-4">{note}</div>
    </div>
  );
}
