"use client";

import type { Lamp } from "../../lib/table-data.js";
import type { Band } from "../card/bands.js";
import { useOverlay } from "../overlay.js";
import { GuideDock } from "./dock.js";
import { GuideDrawer } from "./drawer.js";

// Dock plus drawer for the held card. The drawer opens through the overlay (one sheet at
// a time, Escape, focus return); the dock knows it is open by the sheet's label.

const LABEL = "YOUR TABLE GUIDE";

export type GuideProps = {
  readonly marketId: string;
  readonly lockTime: number;
  readonly nowSec: number;
  readonly open: boolean;
  readonly clocks: readonly { readonly k: string; readonly v: string }[];
  readonly lamps: readonly Lamp[];
  readonly bands: readonly Band[];
};

export function Guide({ marketId, lockTime, nowSec, open, clocks, lamps, bands }: GuideProps) {
  const overlay = useOverlay();
  return (
    <GuideDock
      lockTime={lockTime}
      nowSec={nowSec}
      open={open}
      drawerOpen={overlay.sheetLabel === LABEL}
      onOpen={() => overlay.openSheet(LABEL, <GuideDrawer marketId={marketId} clocks={clocks} lamps={lamps} bands={bands} open={open} />)}
    />
  );
}
