"use client";

import { kindLineOf, type Family } from "../event/family.js";
import { Mark } from "../marks.js";
import type { Band } from "./bands.js";
import { Gauge } from "./gauge.js";
import { Windows } from "./windows.js";

// The front of a card (design frame A/B): the family strip with its crest, name and kind
// line and the head clock; the question; what decides it; the instrument; then YOUR CALL
// beside the three clocks. The same component draws the 530px desktop card and the
// phone card, switching only the sizes the design changes.

export type Clock = { readonly k: string; readonly v: string };

export type CardFrontProps = {
  readonly family: Family;
  readonly marketId: string;
  readonly question: string;
  readonly decides: string;
  readonly headClock: string;
  readonly clocks: readonly Clock[];
  readonly bands: readonly Band[];
  readonly windowRanges: readonly string[];
  readonly selected: number | undefined;
  readonly onSelect: (optionIndex: number) => void;
  readonly disabled: boolean;
  readonly needle: { readonly optionIndex: number; readonly value: string } | undefined;
  readonly callText: string | undefined;
  readonly pays: number;
  readonly settleBlock: number | undefined;
  readonly blocksToGo: number | undefined;
  readonly measuredNote: string;
  readonly compact?: boolean;
  readonly dealing?: boolean;
};

export function CardFront(props: CardFrontProps) {
  const { family, compact = false } = props;
  const chosen = props.callText !== undefined;
  return (
    <div
      className={`face fam-${family.id} relative overflow-hidden border-[3px] border-ink bg-stock ${compact ? "rounded-[18px] shadow-[8px_9px_0_rgba(0,0,0,.34)]" : "rounded-[22px] shadow-[12px_14px_0_rgba(0,0,0,.36)]"} ${props.dealing ? "anim-deal" : ""}`}
    >
      <div className={`flex items-center border-b-[3px] border-ink bg-(--fam) ${compact ? "gap-[9px] px-[13px] py-2.5" : "gap-[13px] px-5 py-3.5"}`}>
        <div className={`flex shrink-0 items-center justify-center rounded-[11px] border-2 border-ink bg-stock text-(--fam) ${compact ? "h-7 w-7 rounded-lg" : "h-10 w-10"}`}>
          <Mark id={family.crest} size={compact ? 15 : 22} title={family.name} />
        </div>
        <div className="min-w-0">
          <div className={`font-display font-extrabold leading-[1.1] tracking-[-.01em] text-stock ${compact ? "text-[13px]" : "text-[17px]"}`}>{family.name}</div>
          <div className={`font-data text-stock/80 ${compact ? "mt-0.5 text-[8px] tracking-[.1em]" : "mt-[3px] text-[9.5px] tracking-[.14em]"}`}>
            {kindLineOf(compact ? family.kindShort : family.kind, props.marketId)}
          </div>
        </div>
        <div className={`ml-auto shrink-0 rounded-full border-2 border-ink bg-stock font-data font-bold text-ink ${compact ? "px-2 py-1 text-[8.5px] tracking-[.1em]" : "px-[11px] py-[5px] text-[9.5px] tracking-[.14em]"}`}>
          {props.headClock}
        </div>
      </div>

      <div className={compact ? "px-[15px] pt-[13px] pb-[15px]" : "px-6 pt-5 pb-[22px]"}>
        <h2 className={`font-display font-extrabold text-ink text-balance ${compact ? "text-[21px] leading-[1.08] tracking-[-.035em]" : "text-[31px] leading-[1.06] tracking-[-.035em]"}`}>
          {props.question}
        </h2>
        {compact ? null : <p className="mt-2.5 font-body text-[14px] leading-[1.5] text-stock-2">{props.decides}</p>}

        {family.instrument === "gauge" ? (
          <div className={compact ? "mt-3" : "mt-[18px]"}>
            <Gauge
              bands={props.bands}
              selected={props.selected}
              onSelect={props.onSelect}
              disabled={props.disabled}
              needle={props.needle}
              compact={compact}
              measuredNote={props.measuredNote}
            />
          </div>
        ) : (
          <Windows
            ranges={props.windowRanges}
            selected={props.selected}
            onSelect={props.onSelect}
            disabled={props.disabled}
            settleBlock={props.settleBlock}
            blocksToGo={props.blocksToGo}
            revealed={props.needle}
            compact={compact}
          />
        )}

        <div className={`flex items-end justify-between border-t-2 border-dashed border-ink/20 ${compact ? "mt-3 pt-[11px]" : "mt-4 pt-3.5"}`}>
          <div>
            <div className={`font-data text-stock-3 ${compact ? "text-[8px] tracking-[.16em]" : "text-[9.5px] tracking-[.18em]"}`}>YOUR CALL</div>
            <div className={`font-display font-extrabold tracking-[-.035em] ${compact ? "mt-1 text-[19px]" : "mt-[5px] text-[27px]"} ${chosen ? "text-(--fam)" : "text-stock-4"}`}>
              {props.callText ?? (family.instrument === "windows" ? "PRESS A WINDOW" : "PRESS A BAND")}
            </div>
          </div>
          {compact ? (
            <div className="text-right">
              <div className="font-data text-[8px] tracking-[.16em] text-stock-3">PAYS</div>
              <div className="mt-1 font-display text-[19px] font-extrabold text-ink">{props.pays}</div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-0.5 overflow-hidden rounded-[9px] border-2 border-ink bg-ink">
              {props.clocks.map((clock) => (
                <div key={clock.k} className="bg-stock-well px-[11px] py-[7px]">
                  <div className="font-data text-[8px] tracking-[.14em] text-stock-3">{clock.k}</div>
                  <div className="mt-[3px] font-data text-[12.5px] font-bold text-ink">{clock.v}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
