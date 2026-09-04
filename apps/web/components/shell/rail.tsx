"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useOverlay } from "../overlay.js";
import { AccountControl } from "./account.js";
import { MoreSheet } from "./more-sheet.js";
import { PRIMARY_JOBS, isActiveRoute } from "./navigation.js";
import { usePlayer } from "./player.js";

// The brass rail (design frame A): wordmark and italic "table one", the four job pills,
// then the engraved beat plate, the streak medallion and the seat. On a phone (frame B)
// the same facts split into the status row (clock, beat word) and the header row
// (medallion, rack line, seat); the jobs move to the bottom bar.

const MONO = "font-data text-[11px] tracking-[.1em]";

function utcClock(): string {
  const now = new Date();
  return `${String(now.getUTCHours()).padStart(2, "0")}:${String(now.getUTCMinutes()).padStart(2, "0")}`;
}

function Medallion({ size }: { size: "rail" | "phone" }) {
  const { state } = usePlayer();
  // Loading and signed-out are not zero. The medallion shows a dash until the chain has
  // said a number, so a fresh seat never reads as a broken streak.
  const streak = state.kind === "ready" ? String(state.standing.streak) : "\u2013";
  const note = state.kind === "ready" ? (state.standing.dayFinal ? "KEPT" : "AT RISK") : "";
  const box = size === "rail" ? "h-9 w-9 text-[16px]" : "h-[30px] w-[30px] text-[14px]";
  return (
    <div className="flex items-center gap-2.5">
      <div className={`medallion ${box} flex items-center justify-center rounded-full border-2 border-ink-green font-display font-extrabold text-ink-green shadow-[0_3px_0_rgba(0,0,0,.4)]`}>
        {streak}
      </div>
      {size === "rail" ? (
        <div className="font-data text-[9px] leading-[1.6] tracking-[.14em] text-felt-2">
          STREAK
          <br />
          {note}
        </div>
      ) : null}
    </div>
  );
}

function RackLine() {
  const { state } = usePlayer();
  if (state.kind !== "ready") return <span className="font-data text-[9px] tracking-[.1em] text-felt-2">TAKE A SEAT TO PLAY</span>;
  return (
    <span className="font-data text-[9px] tracking-[.1em] text-felt-2">
      {state.standing.rackLeft} / {state.standing.rackTotal} PTS IN RACK
    </span>
  );
}

export function Rail() {
  const pathname = usePathname();
  const overlay = useOverlay();
  const { beat } = usePlayer();
  const [clock, setClock] = useState("");
  useEffect(() => {
    setClock(utcClock());
    const timer = setInterval(() => setClock(utcClock()), 15_000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      {/* Desktop: the brass rail. */}
      <header className="brass-rail relative z-[6] hidden h-[76px] shrink-0 items-center justify-between px-7 md:flex">
        <div className="flex items-center gap-[30px]">
          <Link href="/play" className="flex items-baseline gap-[9px]" aria-label="Proof League, table one">
            <span className="font-display text-[19px] font-extrabold tracking-[-.03em] text-felt-text">PROOF LEAGUE</span>
            <span className="font-serif text-[17px] italic text-gold">table one</span>
          </Link>
          <nav aria-label="Primary" className="flex gap-1">
            {PRIMARY_JOBS.map((job) => {
              const active = isActiveRoute(pathname, job.href);
              return (
                <Link
                  key={job.href}
                  href={job.href}
                  aria-current={active ? "page" : undefined}
                  className={`${MONO} rounded-full px-3.5 py-2 ${active ? "bg-gold font-bold text-ink-green" : "text-felt-2 hover:text-felt-text"}`}
                >
                  {job.label}
                </Link>
              );
            })}
            <button type="button" onClick={() => overlay.openSheet("EVERYTHING AT THE TABLE", <MoreSheet />)} className={`${MONO} rounded-full px-3.5 py-2 text-felt-2 hover:text-felt-text`}>
              MORE
            </button>
          </nav>
        </div>
        <div className="flex items-center gap-5">
          <div className="beat-plate flex items-center gap-[11px] rounded-lg border-2 border-ink-green px-[15px] py-[7px] shadow-[0_3px_0_rgba(0,0,0,.4)]">
            <span className="anim-live h-[7px] w-[7px] rounded-full bg-ink-green" />
            <span className="font-data text-[10.5px] font-bold tracking-[.2em] text-ink-green">{beat}</span>
          </div>
          <div className="border-l border-black/35 pl-5">
            <Medallion size="rail" />
          </div>
          <div className="border-l border-black/35 pl-5">
            <AccountControl />
          </div>
        </div>
      </header>

      {/* Phone: status row, then the header row. */}
      <div className="relative z-[6] flex h-[34px] shrink-0 items-center justify-between px-4 md:hidden">
        <span className="font-data text-[11px] font-bold text-felt-text">{clock ? `${clock} UTC` : ""}</span>
        <span className="font-data text-[9px] tracking-[.14em] text-felt-2">{beat}</span>
      </div>
      <div className="relative z-[6] flex h-[50px] shrink-0 items-center justify-between px-4 md:hidden">
        <div className="flex items-center gap-[9px]">
          <Medallion size="phone" />
          <RackLine />
        </div>
        <AccountControl compact />
      </div>
    </>
  );
}
