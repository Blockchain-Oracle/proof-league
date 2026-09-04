"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useOverlay } from "../overlay.js";
import { MoreSheet } from "./more-sheet.js";
import { isActiveRoute } from "./navigation.js";
import { usePlayer } from "./player.js";

// The phone's bottom bar (design frame B): DECK · LEAGUE · PLAY (a gold disc lifted out
// of the bar) · SHELF · MORE, on the deep felt with the felt-edge rule. The desktop rail
// carries the same jobs, so nothing here exists only on a phone.

const CELL = "text-center font-data text-[8.5px] tracking-[.1em]";

export function BottomBar() {
  const pathname = usePathname();
  const { cards: cardsOnTable } = usePlayer();
  const overlay = useOverlay();
  const cell = (href: string, label: string) => (
    <Link
      href={href}
      aria-current={isActiveRoute(pathname, href) ? "page" : undefined}
      className={`${CELL} flex h-full items-center justify-center ${isActiveRoute(pathname, href) ? "text-felt-text" : "text-felt-2"}`}
    >
      {label}
    </Link>
  );
  return (
    <nav
      aria-label="Primary"
      className="safe-bottom fixed inset-x-0 bottom-0 z-30 grid h-16 grid-cols-[1fr_1fr_78px_1fr_1fr] items-center border-t-2 border-felt-edge bg-felt-deep md:hidden"
    >
      {cell("/deck", "DECK")}
      {cell("/league", "LEAGUE")}
      <div className="flex justify-center">
        <Link
          href="/play"
          aria-current={isActiveRoute(pathname, "/play") ? "page" : undefined}
          className="play-disc -mt-4 flex h-[58px] w-[58px] flex-col items-center justify-center rounded-full border-[3px] border-felt-edge shadow-[0_5px_0_#0B1710]"
        >
          <span className="font-display text-[14px] font-extrabold leading-none text-ink-green">PLAY</span>
          <span className="mt-0.5 font-data text-[7px] tracking-[.06em] text-ink-green/70">
            {cardsOnTable === 1 ? "1 CARD" : `${cardsOnTable} CARDS`}
          </span>
        </Link>
      </div>
      {cell("/shelf", "SHELF")}
      <button
        type="button"
        onClick={() => overlay.openSheet("EVERYTHING AT THE TABLE", <MoreSheet />)}
        className={`${CELL} h-full text-felt-2`}
      >
        MORE
      </button>
    </nav>
  );
}
