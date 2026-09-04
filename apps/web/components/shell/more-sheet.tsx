"use client";

import Link from "next/link";
import { useOverlay } from "../overlay.js";
import { MORE_ROUTES } from "./navigation.js";
import { SettingsSheet } from "./settings-sheet.js";

// The complete remainder of the product (Masayume's "Everything in" drawer, in the
// table's words): every live destination as a link, every unbuilt one as text naming
// exactly what it waits on. The sheet closes on selection so the drawer never lingers
// over the page it just navigated to.

export function MoreSheet() {
  const overlay = useOverlay();
  const live = MORE_ROUTES.filter((route) => route.status === "live");
  const planned = MORE_ROUTES.filter((route) => route.status === "planned");
  return (
    <div className="space-y-7">
      <p className="font-body text-[13.5px] leading-relaxed text-felt-1">
        Play, read the proof, or learn the rules. Every destination has one home.
      </p>
      <ul className="space-y-5">
        {live.map((route) =>
          route.status === "live" ? (
            <li key={route.label}>
              <Link href={route.href} onClick={overlay.closeSheet} className="font-display text-[17px] font-extrabold tracking-[-.02em] text-felt-text hover:text-gold">
                {route.label}
              </Link>
              <p className="mt-1 font-body text-[13px] text-felt-2">{route.blurb}</p>
            </li>
          ) : null,
        )}
      </ul>
      <button type="button" onClick={() => overlay.openSheet("SETTINGS", <SettingsSheet />)} className="block text-left">
        <span className="font-display text-[17px] font-extrabold tracking-[-.02em] text-felt-text hover:text-gold">Settings</span>
        <span className="mt-1 block font-body text-[13px] text-felt-2">Sound, haptics and motion. Kept on this device.</span>
      </button>
      <div className="border-t border-gold/25 pt-5">
        <p className="font-data text-[9.5px] tracking-[.18em] text-felt-3">NOT CONNECTED YET</p>
        <ul className="mt-4 space-y-5">
          {planned.map((route) =>
            route.status === "planned" ? (
              <li key={route.label}>
                <p className="font-display text-[17px] font-extrabold tracking-[-.02em] text-felt-2">{route.label}</p>
                <p className="mt-1 font-body text-[13px] text-felt-2">{route.blurb}</p>
                <p className="mt-1 font-data text-[9.5px] leading-relaxed tracking-[.06em] text-felt-4">WAITING ON · {route.gate}</p>
              </li>
            ) : null,
          )}
        </ul>
      </div>
    </div>
  );
}
