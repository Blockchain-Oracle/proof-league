"use client";

import type { Lamp } from "../../lib/table-data.js";
import { shortHash } from "../card/bands.js";

// The right rail (design frame A): SETTLEMENT LAMPS · ELAPSED, NOT PROGRESS; the three
// beats after scoring; HOW THE TABLE CALLED IT after proof; then the action stack. The
// same pieces are reused under the phone card (frame B), where the lamps are a list.

export type LampView = Lamp & { readonly sub: string; readonly short: string; readonly waiting: boolean };

export const lampViews = (lamps: readonly Lamp[], elapsed: string | undefined, sourceChain: string): LampView[] =>
  lamps.map((lamp) => {
    const waiting = !lamp.lit && elapsed !== undefined;
    const sub = lamp.lit
      ? lamp.name === "ATTESTED"
        ? "ATTESTCOIN GATEWAY COVERS THE BLOCK"
        : `${lamp.name === "PROVEN" ? "CREDITCOIN" : sourceChain.toUpperCase()} TX ${lamp.txHash === null ? "RECORDED" : shortHash(lamp.txHash)} · ${lamp.evidence === "observed" ? "OBSERVED" : "PROVEN"}`
      : waiting
        ? `WAITING · ELAPSED ${elapsed}`
        : "NOT STARTED";
    const short = lamp.lit ? (lamp.txHash === null ? "GATEWAY" : shortHash(lamp.txHash)) : "\u2013";
    return { ...lamp, sub, short, waiting };
  });

export function Lamps({ lamps, compact = false }: { lamps: readonly LampView[]; compact?: boolean }) {
  if (compact) {
    return (
      <div className="mt-[11px] flex flex-col gap-[7px]">
        {lamps.map((lamp) => (
          <div key={lamp.name} className="flex items-center gap-2.5">
            <span className={`h-3.5 w-3.5 shrink-0 rounded-full border-2 border-felt-edge ${lamp.lit ? "lamp-lit" : "bg-black/35"} ${lamp.waiting ? "anim-pulse" : ""}`} />
            <span className={`font-data text-[9px] tracking-[.14em] ${lamp.lit ? "text-felt-text" : "text-felt-2"}`}>{lamp.name}</span>
            <span className="ml-auto font-data text-[8.5px] text-felt-3">{lamp.short}</span>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div>
      <div className="font-data text-[10px] tracking-[.18em] text-felt-2">SETTLEMENT LAMPS · ELAPSED, NOT PROGRESS</div>
      <div className="mt-3.5 flex flex-col gap-[11px]">
        {lamps.map((lamp) => (
          <div key={lamp.name} className="flex items-start gap-[13px]">
            <span className={`mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 border-felt-edge ${lamp.lit ? "lamp-lit" : "bg-black/35"} ${lamp.waiting ? "anim-pulse" : ""}`} />
            <div className="min-w-0 flex-1">
              <div className={`font-display text-[15px] font-extrabold tracking-[-.01em] ${lamp.lit ? "text-stock" : "text-felt-2"}`}>{lamp.name}</div>
              <div className="mt-[3px] break-all font-data text-[9.5px] text-felt-3">{lamp.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export type Beat = { readonly k: string; readonly v: string; readonly tone: "won" | "plain" | "gold" | "broken" };

export function Beats({ beats }: { beats: readonly Beat[] }) {
  if (beats.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      {beats.map((beat) => (
        <div key={beat.k} className={`anim-beat flex items-center justify-between rounded-[12px] border-2 border-felt-edge px-[15px] py-[13px] ${beat.tone === "won" ? "bg-correct/22" : "bg-black/25"}`}>
          <span className="font-data text-[9.5px] tracking-[.16em] text-felt-2">{beat.k}</span>
          <span className={`font-display text-[20px] font-extrabold tracking-[-.02em] ${beat.tone === "won" ? "text-correct-light" : beat.tone === "gold" ? "text-gold" : beat.tone === "broken" ? "text-broken" : "text-stock"}`}>{beat.v}</span>
        </div>
      ))}
    </div>
  );
}

export type TallyRow = { readonly label: string; readonly n: number; readonly won: boolean };

export function Tally({ rows }: { rows: readonly TallyRow[] }) {
  const max = Math.max(1, ...rows.map((row) => row.n));
  return (
    <div className="anim-rise rounded-[12px] border border-white/15 px-[15px] py-3.5">
      <div className="font-data text-[9.5px] tracking-[.16em] text-felt-2">HOW THE TABLE CALLED IT</div>
      <div className="mt-[11px] flex flex-col gap-[7px]">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center gap-[9px]">
            <span className={`w-[84px] shrink-0 whitespace-nowrap font-data text-[9px] tracking-[.04em] ${row.won ? "text-correct-light" : "text-felt-2"}`}>{row.label}</span>
            <div className="h-[9px] flex-1 overflow-hidden rounded-full bg-black/30">
              <div className={`h-full bar-${Math.round((row.n / max) * 12)} ${row.won ? "bg-gradient-to-r from-correct-light to-correct" : "bg-stock/30"}`} />
            </div>
            <span className={`w-5 text-right font-data text-[9px] ${row.won ? "text-correct-light" : "text-felt-2"}`}>{row.n}</span>
          </div>
        ))}
      </div>
      <div className="mt-[11px] font-data text-[8.5px] leading-[1.8] tracking-[.08em] text-felt-4">
        COUNTS OF COMMITTED CALLS, SHOWN ONLY AFTER PROOF. NEVER ODDS, NEVER BEFORE YOU CALL.
      </div>
    </div>
  );
}

export type Action = { readonly label: string; readonly tone: "gold" | "stock" | "quiet"; readonly onClick: () => void };

export function Actions({ actions, row = false }: { actions: readonly Action[]; row?: boolean }) {
  if (actions.length === 0) return null;
  return (
    <div className={row ? "flex gap-2" : "flex flex-col gap-[9px]"}>
      {actions.map((action) => (
        <button
          key={action.label}
          type="button"
          onClick={action.onClick}
          className={`rounded-[12px] border-2 text-center font-display font-extrabold tracking-[-.01em] ${row ? "flex-1 px-2 py-[13px] text-[12.5px]" : "px-3.5 py-3.5 text-[15px]"} ${
            action.tone === "gold"
              ? "border-felt-edge bg-gold text-ink-green"
              : action.tone === "stock"
                ? "border-white/35 bg-transparent text-stock"
                : "border-white/20 bg-transparent text-felt-2"
          }`}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}
