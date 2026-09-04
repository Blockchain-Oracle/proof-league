"use client";

import { useRef } from "react";
import { Mark } from "../marks.js";

// The stage a card sits on (design frame A): a perspective box, a tilter that leans with
// the pointer, the flipper with its two faces, the stamp pressed onto the front, and the
// slab with its foil once proof has been accepted. The lean and the foil's sheen are
// written straight to the nodes on pointer move so they never trigger a render; that is
// the one place this file touches element style, and the rule that forbids the style prop
// does not cover it.

export type StampWord = "SEALED" | "CORRECT" | "MISS";

export type SlabProps = {
  readonly foilLine: string;
  readonly serial: string;
  readonly resultWord: "CORRECT" | "MISS" | "VOID";
};

export type CardStageProps = {
  readonly front: React.ReactNode;
  readonly back: React.ReactNode | undefined;
  readonly flipped: boolean;
  readonly stamp: StampWord | undefined;
  readonly slab: SlabProps | undefined;
  readonly compact?: boolean;
  readonly children?: React.ReactNode;
};

const STAMP_COLOR: Record<StampWord, string> = {
  SEALED: "border-(--fam) text-(--fam)",
  CORRECT: "border-correct text-correct",
  MISS: "border-ash text-ash",
};

export function CardStage({ front, back, flipped, stamp, slab, compact = false, familyId }: CardStageProps & { readonly familyId: string }) {
  const tilter = useRef<HTMLDivElement>(null);
  const foil = useRef<HTMLDivElement>(null);

  const tilt = (event: React.PointerEvent<HTMLDivElement>) => {
    const node = tilter.current;
    if (node === null || compact) return;
    const rect = node.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    node.style.transform = `rotateY(${(x * 9).toFixed(2)}deg) rotateX(${(-y * 7).toFixed(2)}deg) translateZ(0)`;
    if (foil.current !== null) foil.current.style.backgroundPosition = `${(50 + x * 90).toFixed(1)}% 0`;
  };
  const untilt = () => {
    if (tilter.current !== null) tilter.current.style.transform = "rotateY(0deg) rotateX(0deg)";
    if (foil.current !== null) foil.current.style.backgroundPosition = "50% 0";
  };

  return (
    <div onPointerMove={tilt} onPointerLeave={untilt} className={`stage-3d ${compact ? "" : "flex justify-center"}`}>
      <div ref={tilter} className={`tilt fam-${familyId} relative ${compact ? "w-full" : "w-[530px] max-w-full"} ${slab === undefined ? "" : "scale-[.94]"}`}>
        {slab === undefined ? null : (
          <>
            <div className="anim-slab slab-glass pointer-events-none absolute -inset-x-[22px] -top-5 -bottom-[78px] rounded-[26px] border-2 border-white/50 shadow-[0_22px_54px_rgba(0,0,0,.45)]" aria-hidden="true" />
            <div
              ref={foil}
              className={`anim-slab-late absolute -inset-x-2 -bottom-[66px] z-[2] flex items-center justify-between rounded-[12px] border-2 border-ink px-4 py-3 shadow-[0_9px_20px_rgba(0,0,0,.4)] ${slab.resultWord === "CORRECT" ? "foil-gold" : slab.resultWord === "MISS" ? "foil-ash" : "foil-void"}`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-ink-green text-gold">
                  <Mark id="creditcoin" size={16} title="Creditcoin" />
                </div>
                <div>
                  <div className="font-display text-[14.5px] font-extrabold tracking-[.02em] text-ink-green">
                    {slab.resultWord === "VOID" ? "VOID · POINTS RETURNED" : "PROVEN ON CREDITCOIN"}
                  </div>
                  <div className="mt-[3px] font-data text-[9.5px] text-ink-green/75">{slab.foilLine}</div>
                </div>
              </div>
              <div className="text-right font-data text-[9.5px] leading-[1.6] text-ink-green/80">
                SLAB {slab.serial}
                <br />
                {slab.resultWord}
              </div>
            </div>
          </>
        )}

        <div className="flipper relative" data-flipped={flipped ? "true" : "false"}>
          {front}
          {back}
        </div>

        {stamp === undefined ? null : (
          <div className={`anim-stamp pointer-events-none absolute z-[4] ${compact ? "right-[13px] top-[72px]" : "right-6 top-[104px]"}`} aria-hidden="true">
            <div className={`rotate-[-9deg] rounded-[12px] border-[5px] opacity-90 ${compact ? "px-[13px] py-1.5" : "px-[17px] py-2"} ${STAMP_COLOR[stamp]}`}>
              <div className={`font-display font-extrabold tracking-[.06em] ${compact ? "text-[20px]" : "text-[30px]"}`}>{stamp}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
