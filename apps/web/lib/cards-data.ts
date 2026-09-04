import { PICK_POINTS_DAILY, deriveCardStage, isDecidedStage, utcDayOf, type CardResolutionFacts, type CardStage } from "@proof-league/shared";
import { and, committedPicks, eq, inArray, markets, pendingPicks, resolutions, scores, seasonStandings } from "@proof-league/shared/db";
import { deployedCore, projectionDb } from "./market-data.js";
import { marketViewOf, type MarketView } from "./market-view.js";

// A player's Cards (rebaseline section 4, AD-28), read for the table, the shelf and the
// share route. Every Call the player ever signed is a Card: the drafts still at the door
// (class 2, keyed by the verifying contract) and the Calls the worker committed at lock
// (class 1, keyed by the core, with the leaf that scoring reads). A superseded Call keeps
// its own Card; `live` marks the one the contract will score.

export type CardRecord = {
  readonly player: string;
  readonly marketId: string;
  readonly nonce: number;
  readonly optionIndex: number;
  readonly stake: number;
  readonly receivedAtSec: number | undefined;
  /// The UTC day the Call was signed for: the day whose rack it spends from (intake.ts).
  readonly utcDay: number;
  readonly committed: boolean;
  readonly live: boolean;
  readonly stage: CardStage;
  readonly view: MarketView;
};

export type PlayerStanding = {
  readonly address: string;
  readonly rackLeft: number;
  readonly rackTotal: number;
  readonly streak: number;
  readonly rank: number | undefined;
  readonly seasonPoints: number;
  readonly dayFinal: boolean;
};

const lower = (address: string): string => address.toLowerCase();

export const cardsFor = async (player: string, chainNowSec: number): Promise<CardRecord[]> => {
  const db = projectionDb();
  const core = await deployedCore();
  if (db === undefined || core === undefined) return [];
  const scoped = core.toLowerCase();
  try {
    const [drafts, committed] = await Promise.all([
      db
        .select()
        .from(pendingPicks)
        .where(and(eq(pendingPicks.verifyingContract, scoped), eq(pendingPicks.player, lower(player)))),
      db
        .select()
        .from(committedPicks)
        .where(and(eq(committedPicks.core, scoped), eq(committedPicks.player, lower(player)))),
    ]);
    const ids = [...new Set([...drafts.map((row) => row.marketId), ...committed.map((row) => row.marketId)])];
    if (ids.length === 0) return [];
    const [rows, settled, scored] = await Promise.all([
      db.select().from(markets).where(and(eq(markets.core, scoped), inArray(markets.marketId, ids))),
      db.select().from(resolutions).where(and(eq(resolutions.core, scoped), inArray(resolutions.marketId, ids))),
      db.select().from(scores).where(and(eq(scores.core, scoped), eq(scores.player, lower(player)))),
    ]);
    const rowBy = new Map(rows.map((row) => [row.marketId, row]));
    const settledBy = new Map(settled.map((row) => [row.marketId, row]));
    const scoreBy = new Map(scored.map((row) => [`${row.marketId}:${row.leafIndex}`, row]));

    // Committed rows win over drafts of the same (market, nonce): the door kept the draft,
    // the worker published it, and only the published leaf can be scored.
    const byKey = new Map<string, { marketId: string; nonce: number; optionIndex: number; stake: number; utcDay: number; receivedAtSec: number | undefined; leafIndex: number | undefined }>();
    for (const draft of drafts) byKey.set(`${draft.marketId}:${draft.nonce}`, { ...draft, leafIndex: undefined });
    for (const leaf of committed) byKey.set(`${leaf.marketId}:${leaf.nonce}`, { ...leaf, receivedAtSec: undefined, leafIndex: leaf.leafIndex });

    const liveNonce = new Map<string, number>();
    for (const card of byKey.values()) {
      if (card.stake === 0) continue;
      const held = liveNonce.get(card.marketId);
      if (held === undefined || card.nonce > held) liveNonce.set(card.marketId, card.nonce);
    }

    const cards: CardRecord[] = [];
    for (const card of byKey.values()) {
      const row = rowBy.get(card.marketId);
      if (row === undefined) continue;
      const resolution = settledBy.get(card.marketId);
      const view = marketViewOf(row, chainNowSec, resolution);
      const scoreRow = card.leafIndex === undefined ? undefined : scoreBy.get(`${card.marketId}:${card.leafIndex}`);
      let facts: CardResolutionFacts | undefined;
      if (view.settlement !== undefined) {
        const outcome = { valueLabel: view.settlement.valueLabel, winningOption: view.settlement.winningOption, proofTxHash: view.settlement.proofTxHash };
        facts =
          scoreRow !== undefined && scoreRow.outcome === "scored"
            ? { outcome, score: { pointsAwarded: Number(scoreRow.pointsAwarded ?? "0") } }
            : { outcome };
      }
      cards.push({
        player: lower(player),
        marketId: card.marketId,
        nonce: card.nonce,
        optionIndex: card.optionIndex,
        stake: card.stake,
        receivedAtSec: card.receivedAtSec,
        utcDay: card.utcDay,
        committed: card.leafIndex !== undefined,
        live: liveNonce.get(card.marketId) === card.nonce,
        stage: deriveCardStage(
          { optionIndex: card.optionIndex, published: false },
          { state: row.state, timing: { lockTimeSec: row.lockTime, sourceWindowOpenSec: row.sourceWindowOpen, voidDeadlineSec: row.voidDeadline, expectedSettlementSec: view.expectedSettlement } },
          chainNowSec,
          facts,
        ),
        view,
      });
    }
    return cards.sort((left, right) => right.view.lockTime - left.view.lockTime || right.nonce - left.nonce);
  } catch {
    return [];
  }
};

/// The player's standing for the rail: what is left in today's rack (every live Call of
/// the UTC day, drafts and committed alike, spends from the same 100), the season row if
/// the chain has one. Never recorded is undefined, not zero.
export const standingFor = async (player: string, chainNowSec: number): Promise<PlayerStanding> => {
  const cards = await cardsFor(player, chainNowSec);
  const today = utcDayOf(chainNowSec);
  const spent = cards.filter((card) => card.live && card.utcDay === today).reduce((sum, card) => sum + card.stake, 0);
  const db = projectionDb();
  const core = await deployedCore();
  let row: { seasonPoints: string; streak: number; rank: number } | undefined;
  if (db !== undefined && core !== undefined) {
    try {
      [row] = await db
        .select({ seasonPoints: seasonStandings.seasonPoints, streak: seasonStandings.streak, rank: seasonStandings.rank })
        .from(seasonStandings)
        .where(and(eq(seasonStandings.core, core.toLowerCase()), eq(seasonStandings.player, lower(player))))
        .limit(1);
    } catch {
      row = undefined;
    }
  }
  const dayCards = cards.filter((card) => card.live && card.utcDay === today);
  return {
    address: lower(player),
    rackLeft: Math.max(0, PICK_POINTS_DAILY - spent),
    rackTotal: PICK_POINTS_DAILY,
    streak: row?.streak ?? 0,
    rank: row?.rank,
    seasonPoints: Number(row?.seasonPoints ?? "0"),
    dayFinal: dayCards.length > 0 && dayCards.every((card) => isDecidedStage(card.stage)),
  };
};
