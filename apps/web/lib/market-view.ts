import { DEPLOYED, SOURCE_EMITTERS } from "@proof-league/chain";
import {
  deriveMarketChip,
  expectedSettlementSecOf,
  utcDayOf,
  type ContractMarketState,
  type MarketChip,
} from "@proof-league/shared";
import { isHostedRound } from "../components/hosted-round-label.js";

// THE canonical Market view model (AD-23; Stories 3.4, 3.5, 3.6, 3.9). Every surface that
// shows a Market builds one of these and renders it: the board, the detail page, the
// Cards, Reels. A surface that derived its own state, option labels or bucket would be a
// second reading of the same chain rows, and two readings drift.
//
// Nothing here computes an outcome. State comes from shared `deriveMarketChip`, the
// winning option comes from the emitted resolution, and every number rendered is a
// projection of a chain value that a reader can go and check.

// -- what a decoded value means, and what it is about --------------------------------
//
// Two different questions, decided by two different pieces of chain configuration, and
// collapsing them is how a fixture market ends up describing itself as a real one:
//
//   UNITS come from the DECODER. The decoder is the on-chain object that turns log bytes
//   into a number, so it is what makes 1e18 fixed point mean percentage points here and a
//   raw draw there.
//
//   SUBJECT comes from the EMITTER. Any decoder can be pointed at any contract, and every
//   verify run creates markets that do precisely that. A Market is about Lido only when
//   Lido's contract emitted its event, so the plain-language question is keyed on the
//   emitter address in chain config and nothing else.
//
// A source this build does not recognise keeps its decoder's units and gets honest
// generic copy: not knowing what a number is about is a fact worth showing, and a
// plausible guess here is a lie a judge cannot catch.

export type Units = {
  readonly suffix: string;
  // Decimal places the raw int256 carries. Lido's rate ratio is 1e18 fixed point where
  // 1e16 is one percentage point, so rendering it as a percentage divides by 1e16.
  readonly exponent: number;
  readonly digits: number;
};

const PERCENT: Units = { suffix: "%", exponent: 16, digits: 4 };
const PLAIN: Units = { suffix: "", exponent: 18, digits: 4 };

export const unitsOf = (decoderId: number): Units =>
  decoderId === DEPLOYED.lidoRateRatioDecoderId ? PERCENT : PLAIN;

type Subject = {
  readonly question: string;
  readonly sourceLine: string;
  readonly units: Units;
};

const sameAddress = (left: string, right: string | undefined): boolean =>
  right !== undefined && left.toLowerCase() === right.toLowerCase();

const subjectOf = (emitter: string, decoderId: number): Subject => {
  const units = unitsOf(decoderId);
  if (isHostedRound(emitter)) {
    return {
      question: "Where will this round's draw land?",
      sourceLine: "Sepolia, a draw fixed by the hash of a block that had not been mined yet",
      units,
    };
  }
  if (sameAddress(emitter, SOURCE_EMITTERS.lidoSteth)) {
    return {
      question: "Where will Lido's next daily staking rate land?",
      sourceLine: "Ethereum mainnet, the daily rebase report published by the stETH contract",
      units,
    };
  }
  return {
    question: "Where will this event's decoded value land?",
    sourceLine: "A source contract this build does not have a plain description for. Its exact chain, contract, event and subject are listed on the Market page.",
    units,
  };
};

// int256 values arrive as decimal strings because JS numbers cannot hold them (config.ts's
// law). A value this cannot parse is rendered verbatim rather than coerced: BigInt("")
// is 0n, and a wrong-but-plausible number is the one output that must never appear.
const INT256_STRING = /^-?\d+$/;

export const formatDecoded = (raw: string, units: Units): string => {
  if (!INT256_STRING.test(raw)) return raw;
  const negative = raw.startsWith("-");
  const magnitude = BigInt(negative ? raw.slice(1) : raw);
  const scale = 10n ** BigInt(units.exponent);
  const shown = 10n ** BigInt(units.digits);
  // Round half away from zero on the magnitude, then reapply the sign, so a displayed
  // edge never reads as the neighbouring bucket by a truncated digit.
  const scaled = (magnitude * shown * 2n + scale) / (scale * 2n);
  const whole = (scaled / shown).toString();
  const fraction = (scaled % shown).toString().padStart(units.digits, "0");
  const body = units.digits === 0 ? whole : `${whole}.${fraction}`;
  return `${negative ? "-" : ""}${body}${units.suffix}`;
};

// N-1 thresholds carve N buckets, each threshold the INCLUSIVE lower edge of the bucket
// above it (shared/outcome.ts, mirroring LeagueCore.winningOptionOf). The outer two are
// open ended, which is what makes every possible value representable.
const optionLabelsOf = (boundaries: readonly string[], payoutN: number, units: Units): readonly string[] => {
  if (boundaries.length !== payoutN - 1) {
    // The config disagrees with itself, so label positionally rather than mislabel a band.
    return Array.from({ length: payoutN }, (_, index) => `Option ${index + 1}`);
  }
  const edges = boundaries.map((boundary) => formatDecoded(boundary, units));
  return edges.map((edge, index) => (index === 0 ? `below ${edge}` : `${edges[index - 1]} to ${edge}`)).concat(
    `${edges[edges.length - 1]} and above`,
  );
};

// -- the view model -------------------------------------------------------------------

export type MarketBucket = "today" | "upcoming" | "settled";

export type MarketOptionView = {
  readonly index: number; // zero based, exactly how the contract counts options
  readonly label: string;
  readonly picks: number;
  readonly won: boolean;
};

/// Which pick population the shares were counted over. AD-18's two classes reach the UI
/// here: a committed count is class 1 (it is the published set the chain pinned by hash),
/// an intake count is class 2 (a draft the worker has not committed yet) and is labelled
/// as an observation wherever it renders.
export type DistributionClass = "committed" | "intake" | "none";

export type MarketSettlementView = {
  readonly value: string;
  readonly valueLabel: string;
  readonly winningOption: number;
  readonly occurredAt: number;
  readonly resolvedAt: number;
  readonly proofTxHash: string | null;
};

export type MarketView = {
  readonly marketId: string;
  readonly leagueDay: number;
  readonly question: string;
  readonly sourceLine: string;
  readonly chip: MarketChip;
  /// The raw contract state, carried alongside the derived chip. The chip is a display
  /// string with one renderer and no surface may branch on its text, but "can this still
  /// take a Pick" and "which lifecycle stage is my Card in" are real questions that need
  /// the state itself, and re-reading the row to answer them would be a second reading.
  readonly state: ContractMarketState;
  readonly bucket: MarketBucket;
  readonly hostedRound: boolean;
  readonly lockTime: number;
  readonly sourceWindowOpen: number;
  readonly expectedSettlement: number;
  readonly voidDeadline: number;
  readonly locked: boolean;
  /// Terminal without a proof: the deadline passed, so nothing settled and nothing scored.
  /// Carried as its own fact rather than read off the chip, because the chip is a display
  /// string with exactly one renderer and no surface may branch on its text.
  readonly voided: boolean;
  readonly options: readonly MarketOptionView[];
  readonly distribution: DistributionClass;
  readonly totalPicks: number;
  readonly settlement: MarketSettlementView | undefined;
  /// The identity a family renderer keys on and the raw thresholds it draws from. Carried
  /// on the view so the table never re-reads a row to decide which instrument to print.
  readonly emitter: string;
  readonly decoderId: number;
  readonly boundaries: readonly string[];
  readonly sourceKey: string;
  readonly subjectFilter: string;
};

/// Every projection field the model reads. Board rows and the detail row both satisfy it,
/// so one adapter serves both without either query shaping itself for a specific screen.
export type MarketViewSource = {
  readonly marketId: string;
  readonly leagueDay: number;
  readonly lockTime: number;
  readonly sourceWindowOpen: number;
  readonly voidDeadline: number;
  readonly state: ContractMarketState;
  readonly payoutN: number;
  readonly decoderId: number;
  readonly emitter: string;
  readonly boundaries: readonly string[];
  readonly sourceKey: string;
  readonly subjectFilter: string;
};

export type MarketResolutionSource = {
  readonly value: string;
  readonly winningOption: number;
  readonly occurredAt: number;
  readonly resolvedAt: number;
  readonly proofTxHash: string | null;
};

export type MarketPickCounts = {
  readonly kind: DistributionClass;
  readonly byOption: readonly number[];
};

const EMPTY_COUNTS: MarketPickCounts = { kind: "none", byOption: [] };

/// A terminal Market is settled; otherwise the UTC day of its lock time decides, so
/// "Today" means the lock has arrived or arrives before this UTC day ends. League days are
/// UTC days on-chain, which is why this is a day comparison and not a rolling 24 hours.
const bucketOf = (state: ContractMarketState, lockTimeSec: number, nowSec: number): MarketBucket => {
  if (state === "Resolved" || state === "Voided") return "settled";
  return utcDayOf(lockTimeSec) <= utcDayOf(nowSec) ? "today" : "upcoming";
};

export const marketViewOf = (
  row: MarketViewSource,
  nowSec: number,
  resolution?: MarketResolutionSource | undefined,
  counts: MarketPickCounts = EMPTY_COUNTS,
): MarketView => {
  const subject = subjectOf(row.emitter, row.decoderId);
  const labels = optionLabelsOf(row.boundaries, row.payoutN, subject.units);
  const winning = resolution?.winningOption;
  return {
    marketId: row.marketId,
    leagueDay: row.leagueDay,
    question: subject.question,
    sourceLine: subject.sourceLine,
    state: row.state,
    chip: deriveMarketChip(
      row.state,
      {
        lockTimeSec: row.lockTime,
        sourceWindowOpenSec: row.sourceWindowOpen,
        voidDeadlineSec: row.voidDeadline,
        expectedSettlementSec: expectedSettlementSecOf(row.sourceWindowOpen),
      },
      nowSec,
    ),
    bucket: bucketOf(row.state, row.lockTime, nowSec),
    hostedRound: isHostedRound(row.emitter),
    lockTime: row.lockTime,
    sourceWindowOpen: row.sourceWindowOpen,
    expectedSettlement: expectedSettlementSecOf(row.sourceWindowOpen),
    voidDeadline: row.voidDeadline,
    locked: nowSec >= row.lockTime,
    voided: row.state === "Voided",
    options: labels.map((label, index) => ({
      index,
      label,
      picks: counts.byOption[index] ?? 0,
      won: winning === index,
    })),
    distribution: counts.kind,
    totalPicks: counts.byOption.reduce((sum, count) => sum + count, 0),
    settlement:
      resolution === undefined
        ? undefined
        : { ...resolution, valueLabel: formatDecoded(resolution.value, subject.units) },
    emitter: row.emitter,
    decoderId: row.decoderId,
    boundaries: row.boundaries,
    sourceKey: row.sourceKey,
    subjectFilter: row.subjectFilter,
  };
};

/// The next Market still open for Picks. Undefined is a real answer: a league between
/// slots has nothing open, and saying so is better than promoting a locked one.
export const nextToLockOf = (views: readonly MarketView[]): MarketView | undefined =>
  views
    .filter((view) => view.bucket !== "settled" && !view.locked)
    .sort((left, right) => left.lockTime - right.lockTime)[0];

/// The most recent proof-backed settlement.
export const latestSettledOf = (views: readonly MarketView[]): MarketView | undefined =>
  views
    .filter((view) => view.settlement !== undefined)
    .sort((left, right) => (right.settlement?.resolvedAt ?? 0) - (left.settlement?.resolvedAt ?? 0))[0];

/// Discovery order (Story 3.9): what a Player can still act on, soonest lock first, then
/// the record newest first. Shared with any surface that walks Markets one at a time, so
/// a cursor built on it means the same thing everywhere.
export const reelOrderOf = (views: readonly MarketView[]): MarketView[] => {
  const actionable = views
    .filter((view) => view.bucket !== "settled")
    .sort((left, right) => left.lockTime - right.lockTime);
  const record = views
    .filter((view) => view.bucket === "settled")
    .sort((left, right) => (right.settlement?.resolvedAt ?? right.voidDeadline) - (left.settlement?.resolvedAt ?? left.voidDeadline));
  return [...actionable, ...record];
};

/// The one Market a visitor should look at first: the next one still to lock, and failing
/// that the most recently settled, because a league with nothing open still has a record.
/// Selection only, never fabrication: an empty board yields nothing to feature.
export const featuredOf = (views: readonly MarketView[]): MarketView | undefined =>
  nextToLockOf(views) ?? latestSettledOf(views) ?? views[0];
