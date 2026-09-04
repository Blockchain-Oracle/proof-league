import { formatDecoded, unitsOf, type MarketView } from "../../lib/market-view.js";
import type { Family } from "../event/family.js";

// The bands as the card prints them (design: OVER 2.260 / 2.235 to 2.260 / ... / UNDER
// 2.200, highest reading at the top), derived from the Market's own thresholds. The
// gauge reads top to bottom, so row 0 is the highest option index. The en dash is the
// design's; it is written as an escape so the copy scan sees ASCII while the card shows
// the glyph.

export type Band = {
  /// The contract's option index (0 = lowest bucket), which is what a Call signs.
  readonly optionIndex: number;
  readonly label: string;
  readonly word: string;
  /// Measured reports that landed in this band (history, never odds).
  readonly pips: number;
};

const DASH = "\u2013";

/// Twelve consecutive daily Lido reports, read from Ethereum mainnet on 2026-09-03
/// (docs/launch-lineup.md). History for the pips, labelled as such on the card, and the
/// only place a number that is not a chain projection is allowed onto the instrument.
export const MEASURED_LIDO: readonly { readonly date: string; readonly apr: number }[] = [
  { date: "2026-08-21", apr: 2.2408 },
  { date: "2026-08-22", apr: 2.3785 },
  { date: "2026-08-23", apr: 2.2139 },
  { date: "2026-08-24", apr: 2.284 },
  { date: "2026-08-25", apr: 2.2591 },
  { date: "2026-08-26", apr: 2.2002 },
  { date: "2026-08-27", apr: 2.1936 },
  { date: "2026-08-28", apr: 2.2202 },
  { date: "2026-08-29", apr: 2.2089 },
  { date: "2026-08-31", apr: 2.264 },
  { date: "2026-09-01", apr: 2.2112 },
  { date: "2026-09-02", apr: 2.1813 },
];
export const MEASURED_LIDO_DATE = "2026-09-03";

/// Thresholds as plain percentages, for the measured-history fold only. Display never
/// goes through floats; the labels below come from formatDecoded on the raw strings.
const thresholdsAsPercent = (view: MarketView): number[] =>
  view.boundaries.map((boundary) => Number(BigInt(boundary) / 10n ** 12n) / 10_000);

const bucketOf = (value: number, thresholds: readonly number[]): number =>
  thresholds.filter((threshold) => value >= threshold).length;

export const bandsOf = (view: MarketView, family: Family): Band[] => {
  const units = unitsOf(view.decoderId);
  const edgeUnits = { suffix: "", exponent: units.exponent, digits: family.id === "yield" ? 3 : 1 };
  const edges = view.boundaries.map((boundary) => formatDecoded(boundary, edgeUnits));
  const count = view.options.length;
  const pips = new Array<number>(count).fill(0);
  if (family.id === "yield") {
    const thresholds = thresholdsAsPercent(view);
    for (const report of MEASURED_LIDO) {
      const bucket = bucketOf(report.apr, thresholds);
      pips[bucket] = (pips[bucket] ?? 0) + 1;
    }
  }
  const rows: Band[] = [];
  for (let optionIndex = count - 1; optionIndex >= 0; optionIndex--) {
    const label =
      optionIndex === count - 1
        ? `OVER ${edges[optionIndex - 1]}`
        : optionIndex === 0
          ? `UNDER ${edges[0]}`
          : `${edges[optionIndex - 1]} ${DASH} ${edges[optionIndex]}`;
    const word = family.bandWords[count - 1 - optionIndex] ?? `BAND ${optionIndex + 1}`;
    rows.push({ optionIndex, label, word, pips: pips[optionIndex] ?? 0 });
  }
  return rows;
};

/// The window labels for a draw (design: 0.0 to 0.2 ... 0.8 to 1.0), lowest first.
export const windowRangesOf = (view: MarketView): string[] => {
  const units = { suffix: "", exponent: unitsOf(view.decoderId).exponent, digits: 1 };
  const edges = view.boundaries.map((boundary) => formatDecoded(boundary, units));
  const count = view.options.length;
  return Array.from({ length: count }, (_, index) => {
    const low = index === 0 ? "0.0" : edges[index - 1];
    const high = index === count - 1 ? "1.0" : edges[index];
    return `${low}${DASH}${high}`;
  });
};

/// The card's short call text: the band label for a gauge, WINDOW N for a draw.
export const callTextOf = (view: MarketView, family: Family, optionIndex: number | undefined): string | undefined => {
  if (optionIndex === undefined) return undefined;
  if (family.instrument === "windows") return `WINDOW ${optionIndex + 1}`;
  return bandsOf(view, family).find((band) => band.optionIndex === optionIndex)?.label;
};

/// The foil line after proof: value, band, transaction.
export const shortHash = (hash: string): string => `${hash.slice(0, 6)}…${hash.slice(-4)}`;
