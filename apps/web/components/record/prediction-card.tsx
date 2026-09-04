import Link from "next/link";
import { CARD_STAGE_COPY, formatUtc, type CardStage, type CardTone } from "@proof-league/shared";
import { Mark, PlayerMark } from "../marks.js";

// The personal Card (rebaseline section 4, FR-10). The thing that appears the moment a
// Pick is accepted, and the SAME record that later carries the result.
//
// It is not the Market's receipt. `market-receipt.tsx` answers "what did this Market
// settle to"; this answers "what did I call, and what happened to it". The two were one
// component until the 2026-09-03 review, which is how a settled screen ended up with no
// player, no choice and no lifecycle on it.
//
// 4:5 silhouette because that is the shape it will be exported and shared in, and a Card
// that changes proportion when it becomes an image is two designs. Unlike the reference
// this is NOT a forced-dark island: it lives in the page's theme in both directions, with
// the same information either way (CONVENTIONS section 7). The exported artifact gets its
// own deterministic composition when sharing ships.

export type PredictionCardView = {
  readonly marketId: string;
  /// Stable and short enough to say out loud. Built by `cardSerialOf`.
  readonly serial: string;
  readonly player: string;
  readonly question: string;
  readonly sourceLine: string;
  readonly choiceLabel: string;
  readonly stake: number;
  /// Gross points a correct call returns, from the shared payout law. Never money.
  readonly returnIfCorrect: number;
  readonly createdAtSec: number;
  readonly lockTimeSec: number;
  readonly stage: CardStage;
};

/// Tone decides the accent, and only the tone map may reach for green. `earned` is
/// reachable from exactly one stage, after a proof was accepted AND the Pick was scored,
/// which is what makes the colour mean something.
const TONE_ACCENT: Record<CardTone, string> = {
  anticipatory: "text-brand",
  waiting: "text-waiting",
  earned: "text-up",
  ash: "text-recorded",
  recorded: "text-recorded",
};

const TONE_RULE: Record<CardTone, string> = {
  anticipatory: "border-brand",
  waiting: "border-waiting",
  earned: "border-up",
  ash: "border-rule",
  recorded: "border-rule",
};

const shortAddress = (address: string): string => `${address.slice(0, 6)}...${address.slice(-4)}`;

export function PredictionCard({ view, explorerBase }: { view: PredictionCardView; explorerBase?: string }) {
  const copy = CARD_STAGE_COPY[view.stage.kind];
  const outcome = "outcome" in view.stage ? view.stage.outcome : undefined;
  const score = "score" in view.stage ? view.stage.score : undefined;
  return (
    <article
      className={`crop-ticks flex aspect-[4/5] flex-col border-t-2 ${TONE_RULE[copy.tone]} border-x border-b border-x-rule border-b-rule bg-surface p-5`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 font-data text-[10px] uppercase tracking-widest text-ink-muted">
          <Mark id="proof-league" size={13} />
          Proof League
        </span>
        <span className="font-data text-[10px] tracking-widest text-ink-muted">N{"°"} {view.serial}</span>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <PlayerMark address={view.player} size={18} title={view.player} />
        <span className="font-data text-[11px] text-ink-muted">{shortAddress(view.player)}</span>
      </div>

      <p className="mt-4 font-body text-sm text-ink-muted">{view.question}</p>
      <p className={`mt-2 font-display text-2xl font-bold leading-tight tracking-tight ${TONE_ACCENT[copy.tone]}`}>
        {view.choiceLabel}
      </p>

      <div className="mt-4 flex items-stretch justify-between gap-4 border-y border-rule py-3">
        <div>
          <div className="font-data text-[9px] uppercase tracking-widest text-ink-muted">Points committed</div>
          <div className="mt-1 font-display text-xl font-bold tabular-nums">{view.stake}</div>
        </div>
        <div className="text-right">
          <div className="font-data text-[9px] uppercase tracking-widest text-ink-muted">
            {score === undefined ? "If this call is correct" : "Points awarded"}
          </div>
          <div className={`mt-1 font-display text-xl font-bold tabular-nums ${score === undefined ? "" : TONE_ACCENT[copy.tone]}`}>
            {score === undefined ? view.returnIfCorrect : score.pointsAwarded}
          </div>
        </div>
      </div>

      <div className="mt-3 space-y-1 font-data text-[10px] text-ink-muted">
        <div className="flex justify-between gap-3">
          <span>Called</span>
          <span className="text-ink">{formatUtc(view.createdAtSec)}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span>Locks</span>
          <span className="text-ink">{formatUtc(view.lockTimeSec)}</span>
        </div>
        {outcome === undefined ? null : (
          <div className="flex justify-between gap-3">
            <span>Decoded value</span>
            <span className="text-ink">{outcome.valueLabel}</span>
          </div>
        )}
        {score?.streakAfter === undefined ? null : (
          <div className="flex justify-between gap-3">
            <span>Streak</span>
            <span className="text-ink">{score.streakAfter}</span>
          </div>
        )}
      </div>

      <div className="mt-auto pt-4">
        <p className={`font-data text-[11px] uppercase tracking-widest ${TONE_ACCENT[copy.tone]}`}>{copy.label}</p>
        <p className="mt-1.5 font-body text-xs text-ink-muted">{copy.body}</p>
        <p className="mt-2 font-body text-[11px] text-ink-muted">{view.sourceLine}</p>
        <div className="mt-3 flex flex-wrap items-center gap-3 font-data text-[10px] uppercase tracking-widest">
          <Link href={`/markets/${view.marketId}`} className="text-ink-muted underline hover:text-ink">
            The Market
          </Link>
          {outcome?.proofTxHash == null || explorerBase === undefined ? null : (
            <a
              href={`${explorerBase}/tx/${outcome.proofTxHash}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-ink-muted hover:text-ink"
            >
              <Mark id="creditcoin" size={11} />
              The proof
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
