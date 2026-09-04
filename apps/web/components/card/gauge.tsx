"use client";

import { useRef } from "react";
import type { Band } from "./bands.js";

// The Yield Signal instrument (design frame A: five rows in a black frame, pips for
// measured history, the word beside each band, the selected row filled in the family
// color with a black tab). Press a row, or press and drag down the gauge; arrow keys move
// the selection. The needle is a 4px bar that travels to the winning row after proof.

export type GaugeProps = {
  readonly bands: readonly Band[];
  readonly selected: number | undefined;
  readonly onSelect: (optionIndex: number) => void;
  readonly disabled: boolean;
  /// After proof: the winning option and the observed value the needle carries.
  readonly needle: { readonly optionIndex: number; readonly value: string } | undefined;
  readonly compact?: boolean;
  readonly measuredNote: string;
};

const ROW = "flex items-center border-b border-ink/15 last:border-b-0 transition-colors duration-150";

export function Gauge({ bands, selected, onSelect, disabled, needle, compact = false, measuredNote }: GaugeProps) {
  const dragging = useRef(false);
  const rowIndexOf = (optionIndex: number): number => bands.findIndex((band) => band.optionIndex === optionIndex);
  const move = (delta: number) => {
    if (disabled) return;
    const current = selected === undefined ? -1 : rowIndexOf(selected);
    const next = bands[Math.min(bands.length - 1, Math.max(0, current + delta))];
    if (next !== undefined) onSelect(next.optionIndex);
  };
  const height = compact ? "h-[50px] gap-[9px] px-3" : "h-14 gap-3 px-3.5";
  const gauge = (
    <div
      role="radiogroup"
      aria-label="Choose a band"
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(event) => {
        if (event.key === "ArrowDown") { event.preventDefault(); move(1); }
        if (event.key === "ArrowUp") { event.preventDefault(); move(-1); }
      }}
      onPointerDown={() => { dragging.current = !disabled; }}
      onPointerUp={() => { dragging.current = false; }}
      onPointerLeave={() => { dragging.current = false; }}
      className={`relative overflow-hidden rounded-[14px] border-[3px] border-ink bg-stock-well ${disabled ? "" : "cursor-grab active:cursor-grabbing"} outline-none focus-visible:ring-4 focus-visible:ring-gold/60`}
    >
      {bands.map((band) => {
        const sel = selected === band.optionIndex;
        const won = needle?.optionIndex === band.optionIndex;
        return (
          <div
            key={band.optionIndex}
            role="radio"
            aria-checked={sel}
            aria-label={`${band.label}, ${band.word}`}
            onPointerDown={() => { if (!disabled) onSelect(band.optionIndex); }}
            onPointerEnter={() => { if (dragging.current) onSelect(band.optionIndex); }}
            className={`${ROW} ${height} relative ${sel ? "bg-(--fam)" : won ? "bg-(--fam-soft)" : "bg-transparent"}`}
          >
            <div className="flex w-[15px] flex-col gap-0.5" aria-hidden="true">
              {Array.from({ length: band.pips }, (_, index) => (
                <div key={index} className={`h-[3px] w-[13px] ${sel ? "bg-stock/75" : "bg-ink/28"}`} />
              ))}
            </div>
            <div className={`font-display font-extrabold tracking-[-.03em] ${compact ? "text-[16px]" : "text-[19px]"} ${sel ? "text-stock" : "text-ink"}`}>
              {band.label}
            </div>
            <div className={`ml-auto font-data tracking-[.16em] ${compact ? "text-[8px]" : "text-[9.5px]"} ${sel ? "text-stock/80" : "text-stock-3"}`}>
              {band.word}
            </div>
            {sel ? <div className="absolute -right-px top-1/2 h-[38px] w-4 -translate-y-1/2 rounded-l-[6px] bg-ink" aria-hidden="true" /> : null}
          </div>
        );
      })}
      {needle === undefined ? null : (
        <div className={`needle needle-${rowIndexOf(needle.optionIndex)} pointer-events-none absolute inset-x-0 h-0`} aria-hidden="true">
          <div className="h-1 bg-ink" />
          <div className={`absolute right-2 rounded-md bg-ink px-2.5 py-1 font-display font-extrabold text-stock ${compact ? "-top-3 text-[13px]" : "-top-3.5 text-[15px]"}`}>
            {needle.value}
          </div>
        </div>
      )}
    </div>
  );
  if (compact) return gauge;
  return (
    <div className="grid grid-cols-[1fr_84px] gap-[13px]">
      {gauge}
      <div className="flex flex-col justify-between py-0.5 font-data text-[8.5px] leading-[1.7] tracking-[.1em] text-stock-3">
        <div>
          MEASURED
          <br />
          {measuredNote}
        </div>
        <div>
          PIPS ARE
          <br />
          HISTORY.
          <br />
          NOT ODDS.
        </div>
        <div>
          BANDS
          <br />
          RE-CENTRE
          <br />
          DAILY
        </div>
      </div>
    </div>
  );
}
