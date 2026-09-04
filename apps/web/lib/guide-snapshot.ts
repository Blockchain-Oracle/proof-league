import { formatUtc } from "@proof-league/shared";
import { bandsOf, MEASURED_LIDO, MEASURED_LIDO_DATE } from "../components/card/bands.js";
import { familyOfEmitter } from "../components/event/family.js";
import { chainClock } from "./chain-clock.js";
import { boardMarketViews } from "./market-board.js";
import { lampsOf, phaseRowsFor } from "./table-data.js";

// What the League Guide is allowed to know: the card exactly as the table prints it. Bands
// and their edges, the measured history behind the pips (dated, labelled history), the
// three clocks, the lamps, and the crowd's counts only once the proof exists. No
// probability, no intra-day reading, nothing the table does not show a player.

export type GuideSnapshot = {
  readonly marketId: string;
  readonly text: string;
  readonly bands: readonly { readonly optionIndex: number; readonly label: string; readonly word: string }[];
  readonly open: boolean;
};

const hm = (sec: number): string => formatUtc(sec).slice(11, 16);

export const guideSnapshot = async (marketId: string): Promise<GuideSnapshot | undefined> => {
  const clock = await chainClock();
  const views = await boardMarketViews(clock.chainNowSec);
  const view = views.find((held) => held.marketId === marketId);
  const family = view === undefined ? undefined : familyOfEmitter(view.emitter);
  if (view === undefined || family === undefined) return undefined;
  const rows = await phaseRowsFor(view.marketId, view.sourceKey);
  const lamps = lampsOf(rows, view.settlement);
  const bands = bandsOf(view, family);
  const proven = view.settlement !== undefined;
  const open = !view.locked && !proven && !view.voided;

  const lines: string[] = [
    `CARD ${view.marketId.padStart(3, "0")} · ${family.name} · ${family.kind.replace("{n}", view.marketId.padStart(3, "0"))}`,
    `Question: ${family.question}`,
    `Decides: ${family.decides}`,
    `Chain time now: ${formatUtc(clock.chainNowSec)} UTC`,
    `Calls lock: ${hm(view.lockTime)} UTC (${view.locked ? "already locked" : "still open"}). Report window opens: ${hm(view.sourceWindowOpen)} UTC. Proof expected: ${hm(view.expectedSettlement)} UTC. Voids if nothing lands by: ${formatUtc(view.voidDeadline)} UTC.`,
    `Bands, top to bottom (option index in brackets, index is what a Call signs): ${bands.map((band) => `[${band.optionIndex}] ${band.label} ${band.word}${family.id === "yield" ? ` (${band.pips} of the measured reports landed here)` : ""}`).join("; ")}`,
  ];
  if (family.id === "yield") {
    lines.push(`Measured history (${MEASURED_LIDO.length} daily Lido reports read from Ethereum mainnet, dated up to ${MEASURED_LIDO_DATE}; history, not odds): ${MEASURED_LIDO.map((report) => `${report.date} ${report.apr.toFixed(4)}%`).join(", ")}`);
  }
  lines.push(`Lamps: ${lamps.map((lamp) => `${lamp.name} ${lamp.lit ? "lit" : "dark"}`).join(", ")}`);
  if (proven && view.settlement !== undefined) {
    lines.push(`Proven result: ${view.settlement.valueLabel}, winning option index ${view.settlement.winningOption}${view.settlement.proofTxHash === null ? "" : `, proof tx ${view.settlement.proofTxHash}`}.`);
    lines.push(`How the table called it (committed Calls, shown only after proof): ${view.options.map((option) => `[${option.index}] ${option.picks}`).join(", ")}`);
  } else {
    lines.push("Crowd counts: not shown before proof. Do not estimate them.");
  }
  if (view.voided) lines.push("This card voided: no report landed inside the window, every chip came back.");
  return { marketId: view.marketId, text: lines.join("\n"), bands: bands.map(({ optionIndex, label, word }) => ({ optionIndex, label, word })), open };
};
