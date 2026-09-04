"use client";

import { useEffect, useState } from "react";
import { motionReduced } from "../../lib/settings.js";

// The Guide's dock on the felt: a gold pill with a ring that drains toward this card's
// lock (key-free, always live), pulsing inside the last half hour. Teaser bubbles run
// Masayume's clock exactly (3.5 s in, hold 4.8 s, gap 4.5 s, three times, then rest) and
// stay quiet while the drawer is open, when motion is reduced, or once Calls have locked.

const TEASERS = ["Which band?", "Want a read?", "Sit this one out?"];
const FIRST_MS = 3500;
const HOLD_MS = 4800;
const GAP_MS = 4500;
const CYCLES = 3;
const DAY_SEC = 86_400;
const URGENT_SEC = 1800;
const RADIUS = 9;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export type GuideDockProps = {
  readonly lockTime: number;
  readonly nowSec: number;
  readonly open: boolean;
  readonly drawerOpen: boolean;
  readonly onOpen: () => void;
};

export function GuideDock({ lockTime, nowSec, open, drawerOpen, onOpen }: GuideDockProps) {
  const [teaser, setTeaser] = useState<string | undefined>(undefined);
  const quiet = drawerOpen || !open;

  useEffect(() => {
    if (quiet || motionReduced()) {
      setTeaser(undefined);
      return;
    }
    const timers: ReturnType<typeof setTimeout>[] = [];
    let at = FIRST_MS;
    for (let cycle = 0; cycle < CYCLES; cycle++) {
      const text = TEASERS[cycle % TEASERS.length];
      timers.push(setTimeout(() => setTeaser(text), at));
      timers.push(setTimeout(() => setTeaser(undefined), at + HOLD_MS));
      at += HOLD_MS + GAP_MS;
    }
    return () => {
      timers.forEach(clearTimeout);
      setTeaser(undefined);
    };
  }, [quiet]);

  const remaining = Math.max(0, lockTime - nowSec);
  const fraction = open ? Math.min(1, remaining / DAY_SEC) : 0;
  const urgent = open && remaining > 0 && remaining < URGENT_SEC;

  return (
    <div className="pointer-events-none z-[8] flex w-full flex-row-reverse items-center justify-start gap-2 px-4 pb-1.5 md:absolute md:left-[34px] md:top-2 md:w-auto md:flex-row md:px-0 md:pb-0">
      <button
        type="button"
        onClick={onOpen}
        aria-label={open ? `Open the League Guide. Calls lock in ${Math.floor(remaining / 60)} minutes.` : "Open the League Guide"}
        className={`pointer-events-auto flex items-center gap-2 rounded-full border-2 border-ink-green bg-gold py-1 pr-3 pl-1.5 font-data text-[9.5px] tracking-[.16em] text-ink-green shadow-[0_3px_0_rgba(0,0,0,.4)] active:translate-y-[2px] active:shadow-[0_1px_0_rgba(0,0,0,.4)] ${urgent ? "anim-pulse" : ""}`}
      >
        <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
          <circle cx="11" cy="11" r={RADIUS} fill="none" stroke="rgba(20,32,26,.3)" strokeWidth="2.5" />
          <circle
            cx="11"
            cy="11"
            r={RADIUS}
            fill="none"
            stroke="#14201A"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - fraction)}
            transform="rotate(-90 11 11)"
          />
        </svg>
        GUIDE
      </button>
      {teaser === undefined ? null : (
        <span className="anim-rise rounded-[10px] border-2 border-ink bg-stock px-2.5 py-1 font-body text-[12px] text-ink shadow-[0_3px_0_rgba(0,0,0,.32)]" aria-hidden="true">
          {teaser}
        </span>
      )}
    </div>
  );
}
