"use client";

import { useEffect, useState } from "react";
import { PICK_POINTS_DAILY } from "@proof-league/shared";
import { useSigningProvider } from "../../features/auth/adapter.js";

// The one-time "you're at the table" card (Masayume's welcome grant, in the table's
// words): shown once, the first time a wallet lands in this browser, and gone by itself
// after eight seconds. It states the daily allowance and nothing else; later grants are
// toasts, not cards. Key `pl.seated.v1`; blocked storage shows it again, which is fine.

const KEY = "pl.seated.v1";
const HOLD_MS = 8000;

export function SeatedCard() {
  const provider = useSigningProvider();
  const [shown, setShown] = useState(false);
  const connected = provider.kind === "connected";

  useEffect(() => {
    if (!connected) return;
    try {
      if (localStorage.getItem(KEY) === "1") return;
      localStorage.setItem(KEY, "1");
    } catch {
      // Blocked storage: show it this once anyway.
    }
    setShown(true);
    const timer = setTimeout(() => setShown(false), HOLD_MS);
    return () => clearTimeout(timer);
  }, [connected]);

  if (!shown) return null;
  return (
    <output className="anim-rise safe-bottom fixed bottom-24 left-1/2 z-[46] w-[min(92vw,360px)] -translate-x-1/2 rounded-[16px] border-[3px] border-ink bg-stock px-4 py-3.5 shadow-[8px_9px_0_rgba(0,0,0,.34)] sm:bottom-8">
      <span className="block font-data text-[8.5px] tracking-[.18em] text-stock-3">YOU'RE AT THE TABLE</span>
      <span className="mt-1 block font-display text-[20px] font-extrabold leading-tight tracking-[-.03em] text-ink">{PICK_POINTS_DAILY} points a day, in your rack.</span>
      <span className="mt-1 block font-body text-[12.5px] text-stock-2">Refills at 00:00 UTC. Free points, no monetary value. Hold a card to start.</span>
      <button type="button" onClick={() => setShown(false)} className="mt-2 font-data text-[9px] tracking-[.14em] text-stock-3 underline">DISMISS</button>
    </output>
  );
}
