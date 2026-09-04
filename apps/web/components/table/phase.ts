import { isStuckStage, isVoidedStage, type CardStage } from "@proof-league/shared";
import type { Lamp } from "../../lib/table-data.js";
import type { MarketView } from "../../lib/market-view.js";

// The table's beats (design: HAND · IN PLAY · SEALED · WAITING · ATTESTED · PROVEN ·
// REVEAL · TABLE · SCORED · SLABBED), derived from canonical facts only: the player's Card
// stage, the Market, the lamps, and where the reveal ceremony has got to on this device.
// The ceremony steps are the only client-side beats, and they can only begin once the
// canonical result exists.

export type TablePhase =
  | "HAND"
  | "IN PLAY"
  | "CALLS CLOSED"
  | "SEALED"
  | "WAITING"
  | "ATTESTED"
  | "PROVEN"
  | "REVEAL"
  | "TABLE"
  | "SCORED"
  | "SLABBED"
  | "VOID"
  | "STUCK"
  | "SETTLED";

export type CeremonyStep = "none" | "reveal" | "table" | "scored" | "slabbed";

export type PhaseFacts = {
  readonly view: MarketView;
  readonly stage: CardStage | undefined;
  readonly lamps: readonly Lamp[];
  readonly chose: boolean;
  readonly ceremony: CeremonyStep;
  readonly revealed: boolean;
};

export const phaseOf = (facts: PhaseFacts): TablePhase => {
  const { view, stage, lamps, chose, ceremony, revealed } = facts;
  if (stage === undefined) {
    if (view.voided) return "VOID";
    if (view.settlement !== undefined) return "SETTLED";
    if (view.locked) return "CALLS CLOSED";
    return chose ? "IN PLAY" : "HAND";
  }
  if (isVoidedStage(stage)) return "VOID";
  if (isStuckStage(stage)) return "STUCK";
  switch (stage.kind) {
    case "private":
    case "open-call":
      return "SEALED";
    case "locked":
    case "committed":
    case "awaiting":
      return lamps[0]?.lit ? "ATTESTED" : "WAITING";
    case "scoring":
    case "settled-unread":
      return "PROVEN";
    case "correct":
    case "incorrect":
      if (ceremony === "reveal") return "REVEAL";
      if (ceremony === "table") return "TABLE";
      if (ceremony === "scored") return "SCORED";
      if (ceremony === "slabbed" || revealed) return "SLABBED";
      return "PROVEN";
    default:
      return "WAITING";
  }
};

/// Whether the card faces the player with its sealed side (design: from the seal until
/// the reveal flips it home).
export const showsBack = (phase: TablePhase): boolean =>
  phase === "SEALED" || phase === "WAITING" || phase === "ATTESTED" || phase === "PROVEN" || phase === "STUCK";

export const isCeremonyOrAfter = (phase: TablePhase): boolean =>
  phase === "REVEAL" || phase === "TABLE" || phase === "SCORED" || phase === "SLABBED";

/// The reveal ceremony, one beat after another (design: the room dims at REVEAL, seats
/// flip at TABLE, beats land at SCORED, the slab drops at SLABBED). Timings are the
/// design's own transitions: the needle takes 1.8s, each beat 0.4s.
export const CEREMONY_BEATS: readonly { readonly step: CeremonyStep; readonly afterMs: number }[] = [
  { step: "reveal", afterMs: 0 },
  { step: "table", afterMs: 2200 },
  { step: "scored", afterMs: 3600 },
  { step: "slabbed", afterMs: 5200 },
];
