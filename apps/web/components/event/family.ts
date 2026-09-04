import { SOURCE_EMITTERS } from "@proof-league/chain";
import { isHostedRound } from "../hosted-round-label.js";
import type { MarkId } from "../marks.js";

// THE event-family registry (rebaseline section 4). A family is the presentation grammar
// of a Market: its crest, its color on the strip, its instrument, the words on its bands.
// It derives from the EMITTER (which contract produced the event), never from the decoder,
// so a fixture market pointed at an unreal emitter cannot dress itself as Lido.
//
// Colors, names and status words are lifted verbatim from the Matchday design (The Deal
// II, 2026-09-04). Only the two families with a registered decoder are inventory; the
// rest are drawn as card types in the deck and never as playable cards.

export type FamilyId = "yield" | "draw" | "harvest" | "race" | "milestone" | "governance" | "allocation" | "pulse";

export type FamilyStatus = "LIVE" | "CAPABLE" | "NEXT" | "CONCEPT";

export type Family = {
  readonly id: FamilyId;
  readonly name: string;
  /// The strip's second line on a held card, with {n} for the zero-padded card number,
  /// e.g. "LIDO ON ETHEREUM · SERIES 01 · CARD {n}". Plain data, so a family can cross the
  /// server/client boundary as props.
  readonly kind: string;
  readonly kindShort: string;
  readonly color: string;
  readonly crest: MarkId;
  readonly status: FamilyStatus;
  readonly question: string;
  readonly decides: string;
  /// One word per band, highest band first, the way the gauge reads top to bottom.
  readonly bandWords: readonly string[];
  readonly instrument: "gauge" | "windows" | "chamber" | "lanes" | "track" | "ballot" | "territory" | "pulse";
  readonly caption: string;
  /// The source and the proof chain in ordinary words, for the card and the proof sheet.
  readonly sourceChain: string;
  readonly deckQuestion: string;
};

/// The kind line with the card number in: "CARD 006" for market 6.
export const kindLineOf = (template: string, marketId: string): string => template.replace("{n}", marketId.padStart(3, "0"));

export const FAMILIES: Record<FamilyId, Family> = {
  yield: {
    id: "yield",
    name: "YIELD SIGNAL",
    kind: "LIDO ON ETHEREUM · SERIES 01 · CARD {n}",
    kindShort: "SERIES 01 · CARD {n}",
    color: "#2563C9",
    crest: "lido",
    status: "LIVE",
    question: "Which band will Lido’s next daily staking rate land in?",
    decides:
      "The oracle quorum builds tomorrow’s report from beacon rewards that accrue after your call locks. Nobody can compute it at lock.",
    bandWords: ["SURGE", "FIRM", "CENTRE", "EASING", "SOFT"],
    instrument: "gauge",
    caption: "GAUGE · 5 ZONES · LIDO ON ETHEREUM",
    sourceChain: "Ethereum",
    deckQuestion: "Which band will the daily staking rate land in?",
  },
  draw: {
    id: "draw",
    name: "BLOCK DRAW",
    kind: "SEPOLIA HOSTED ROUND · CARD {n}",
    kindShort: "HOSTED ROUND · CARD {n}",
    color: "#6B4BD6",
    crest: "eth",
    status: "CAPABLE",
    question: "Which window will the sealed future block select?",
    decides:
      "The draw is fixed by the hash of a block that has not been mined. Five windows, one settle block, no one can steer it.",
    bandWords: ["FIVE", "FOUR", "THREE", "TWO", "ONE"],
    instrument: "windows",
    caption: "SEALED WINDOWS · SEPOLIA BLOCK COUNTDOWN",
    sourceChain: "Sepolia",
    deckQuestion: "Which window will the sealed block select?",
  },
  harvest: {
    id: "harvest",
    name: "REWARD HARVEST",
    kind: "LIDO ON ETHEREUM · NEEDS A DECODER",
    kindShort: "NEEDS A DECODER",
    color: "#C9722B",
    crest: "lido",
    status: "NEXT",
    question: "How much will the daily reward chamber hold?",
    decides: "The same daily report carries the execution-layer rewards withdrawn. One proof would settle two cards.",
    bandWords: ["FULL", "HIGH", "MID", "LOW", "DRY"],
    instrument: "chamber",
    caption: "CHAMBER FILLS · SAME PROOF, NEW DECODER",
    sourceChain: "Ethereum",
    deckQuestion: "How much will the daily reward chamber hold?",
  },
  race: {
    id: "race",
    name: "POOL RACE",
    kind: "UNISWAP V4 ON ETHEREUM · NOT ADMITTED",
    kindShort: "NOT ADMITTED",
    color: "#D93C7A",
    crest: "uniswap",
    status: "CONCEPT",
    question: "Which pool category initializes first in the window?",
    decides: "Named lanes, a fixed finish rule, and progress that never outruns the indexed chain.",
    bandWords: [],
    instrument: "lanes",
    caption: "LANES · NEEDS POOL SET AND DECODER",
    sourceChain: "Ethereum",
    deckQuestion: "Which pool category initializes first in the window?",
  },
  milestone: {
    id: "milestone",
    name: "MILESTONE",
    kind: "BEACON DEPOSITS ON ETHEREUM · NOT ADMITTED",
    kindShort: "NOT ADMITTED",
    color: "#2E8B57",
    crest: "eth",
    status: "CONCEPT",
    question: "Which day does the deposit index cross the target?",
    decides: "A threshold and a deadline. Before and after are the only two answers.",
    bandWords: [],
    instrument: "track",
    caption: "TRACK AND DEADLINE · PICK A DAY",
    sourceChain: "Ethereum",
    deckQuestion: "Which day does the deposit index cross the target?",
  },
  governance: {
    id: "governance",
    name: "GOVERNANCE",
    kind: "AAVE ON ETHEREUM · NOT ADMITTED",
    kindShort: "NOT ADMITTED",
    color: "#7B3FA0",
    crest: "aave",
    status: "CONCEPT",
    question: "Will the proposal pass, and in which turnout band?",
    decides: "Only the terminal state counts. You are calling a result, never casting a vote.",
    bandWords: [],
    instrument: "ballot",
    caption: "BALLOT CHAMBER · TERMINAL STATE ONLY",
    sourceChain: "Ethereum",
    deckQuestion: "Will the proposal pass, and in which turnout band?",
  },
  allocation: {
    id: "allocation",
    name: "ALLOCATION",
    kind: "CURVE GAUGES ON ETHEREUM · NOT ADMITTED",
    kindShort: "NOT ADMITTED",
    color: "#1E7F8C",
    crest: "eth",
    status: "CONCEPT",
    question: "Which gauge takes the biggest weekly share?",
    decides: "Needs a snapshot keeper before it can be admitted.",
    bandWords: [],
    instrument: "territory",
    caption: "TERRITORY MAP · NEEDS SNAPSHOT KEEPER",
    sourceChain: "Ethereum",
    deckQuestion: "Which gauge takes the biggest weekly share?",
  },
  pulse: {
    id: "pulse",
    name: "NETWORK PULSE",
    kind: "ETHEREUM · NOT ADMITTED",
    kindShort: "NOT ADMITTED",
    color: "#4A5568",
    crest: "eth",
    status: "CONCEPT",
    question: "Which base fee band holds across the interval?",
    decides: "Needs a probe or an accumulator. Never a price chart.",
    bandWords: [],
    instrument: "pulse",
    caption: "PULSE FIELD · NEEDS A PROBE, NEVER A PRICE CHART",
    sourceChain: "Ethereum",
    deckQuestion: "Which base fee band holds across the interval?",
  },
};

/// The deck order, exactly as the design lays the eight card types out.
export const DECK_ORDER: readonly FamilyId[] = [
  "yield",
  "draw",
  "harvest",
  "race",
  "milestone",
  "governance",
  "allocation",
  "pulse",
];

const sameAddress = (left: string, right: string | undefined): boolean =>
  right !== undefined && left.toLowerCase() === right.toLowerCase();

/// A Market's family, decided by its emitter. An emitter this build does not recognise
/// gets no family and fails honestly at the renderer rather than dressing up as one.
export const familyOfEmitter = (emitter: string): Family | undefined => {
  if (isHostedRound(emitter)) return FAMILIES.draw;
  if (sameAddress(emitter, SOURCE_EMITTERS.lidoSteth)) return FAMILIES.yield;
  return undefined;
};

/// The room glow behind a held card, one per inventory family (the design's roomGlow).
export const roomGlowOf = (family: Family | undefined): "yield" | "draw" | "none" =>
  family?.id === "yield" ? "yield" : family?.id === "draw" ? "draw" : "none";
