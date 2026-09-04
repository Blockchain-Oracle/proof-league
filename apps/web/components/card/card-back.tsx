"use client";

import { AvatarTile, shortAddress } from "../shell/account.js";

// The sealed side of a card (design: dark green with a gold hatch, PROOF LEAGUE and the
// italic "sealed", the serial, who called what in gold, chips down / pays / settles, the
// back note, and PRIVATE UNTIL YOU PUBLISH beside the seat's tile). It faces the player
// from the seal until the reveal flips the card home.

export type CardBackProps = {
  readonly serial: string;
  readonly player: string;
  readonly callText: string;
  readonly points: number;
  readonly pays: number;
  readonly settleAt: string;
  readonly backNote: string;
  readonly published: boolean;
  readonly compact?: boolean;
};

export function CardBack(props: CardBackProps) {
  const { compact = false } = props;
  const who = `${shortAddress(props.player).toUpperCase()} CALLED`;
  return (
    <div
      className={`face face-back card-back absolute inset-0 flex flex-col overflow-hidden border-[3px] border-ink text-felt-text ${compact ? "rounded-[18px] shadow-[8px_9px_0_rgba(0,0,0,.34)]" : "rounded-[22px] shadow-[12px_14px_0_rgba(0,0,0,.36)]"}`}
    >
      <div className={`flex items-center justify-between border-b-2 border-gold/30 ${compact ? "px-[15px] py-[13px]" : "px-[22px] py-[18px]"}`}>
        <div className="flex items-baseline gap-[9px]">
          <span className={`font-display font-extrabold tracking-[-.02em] ${compact ? "text-[13px]" : "text-[15px]"}`}>PROOF LEAGUE</span>
          {compact ? null : <span className="font-serif text-[15px] italic text-gold">sealed</span>}
        </div>
        <span className={`font-data text-felt-3 ${compact ? "text-[8.5px] tracking-[.12em]" : "text-[9.5px] tracking-[.14em]"}`}>
          {compact ? props.serial : `SERIAL ${props.serial}`}
        </span>
      </div>
      <div className={`flex flex-1 flex-col justify-center ${compact ? "gap-3.5 px-[15px] py-5" : "gap-[18px] px-[22px] py-[26px]"}`}>
        <div>
          <div className={`font-data text-felt-3 ${compact ? "text-[8.5px] tracking-[.2em]" : "text-[9.5px] tracking-[.2em]"}`}>{who}</div>
          <div className={`font-display font-extrabold text-gold ${compact ? "mt-[7px] text-[30px] leading-[1.04] tracking-[-.04em]" : "mt-2 text-[42px] leading-[1.02] tracking-[-.04em]"}`}>
            {props.callText}
          </div>
        </div>
        <div className={`flex ${compact ? "gap-[18px]" : "gap-6"}`}>
          {[
            ["CHIPS DOWN", `${props.points}${compact ? "" : " PTS"}`],
            ["PAYS", `${props.pays}${compact ? "" : " PTS"}`],
            ["SETTLES", props.settleAt],
          ].map(([k, v]) => (
            <div key={k}>
              <div className={`font-data text-felt-3 ${compact ? "text-[8px] tracking-[.14em]" : "text-[9px] tracking-[.16em]"}`}>{compact && k === "CHIPS DOWN" ? "CHIPS" : k}</div>
              <div className={`font-display font-extrabold text-felt-text ${compact ? "mt-1 text-[17px]" : "mt-[5px] text-[22px]"}`}>{v}</div>
            </div>
          ))}
        </div>
        <div className={`border-t border-gold/25 font-data leading-[1.9] text-felt-3 ${compact ? "pt-[13px] text-[9px] tracking-[.04em]" : "pt-4 text-[10px] tracking-[.06em]"}`}>{props.backNote}</div>
      </div>
      {compact ? null : (
        <div className="flex items-center justify-between border-t-2 border-gold/30 px-[22px] py-3.5">
          <span className="font-data text-[9.5px] tracking-[.16em] text-felt-3">{props.published ? "PUBLISHED" : "PRIVATE UNTIL YOU PUBLISH"}</span>
          <AvatarTile address={props.player} className="h-[34px] w-[34px] border-felt-edge" />
        </div>
      )}
    </div>
  );
}
