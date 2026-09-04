"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { cardSerialOf, deriveCardStage, formatUtc, grossPayout, type CardStage } from "@proof-league/shared";
import { composerAvailabilityOf } from "../../features/picks/availability.js";
import { usePickComposer } from "../../features/picks/use-pick-composer.js";
import type { Lamp, Seat } from "../../lib/table-data.js";
import type { MarketView } from "../../lib/market-view.js";
import { bandsOf, callTextOf, shortHash, windowRangesOf, MEASURED_LIDO, MEASURED_LIDO_DATE } from "../card/bands.js";
import { CardBack } from "../card/card-back.js";
import { CardFront } from "../card/card-front.js";
import { CardStage as Stage, type SlabProps, type StampWord } from "../card/card-stage.js";
import { ProofSheet } from "../card/proof-sheet.js";
import { ShareSheet } from "../card/share-sheet.js";
import { useOverlay } from "../overlay.js";
import { roomGlowOf, type Family } from "../event/family.js";
import { useRoom } from "../shell/felt.js";
import { usePlayer } from "../shell/player.js";
import { Hand } from "./hand.js";
import type { HandCard } from "./hand-data.js";
import { LockButton, lockStateOf } from "./lock-button.js";
import { CEREMONY_BEATS, isCeremonyOrAfter, phaseOf, showsBack, type CeremonyStep } from "./phase.js";
import { Actions, Beats, Lamps, Tally, lampViews, type Action, type Beat, type TallyRow } from "./right-rail.js";
import { SeatsArc } from "./seats-arc.js";
import { TheSpot, type ChipDenom } from "./the-spot.js";
import { useYourCard } from "./use-your-card.js";
import { buzz, play, unlockSound } from "../../lib/sound.js";
import { applyMotion } from "../../lib/settings.js";
import { Guide } from "../guide/guide.js";

// The table (design frames A and B): the held card on its stage, the seats around it,
// your hand and the spot below, the lamps and the action stack on the rail. One
// composer drives the gauge, the spot and LOCK IT IN; everything the card says comes
// from the Market view, the player's own Card and the worker's phase log.

export type HeldCard = {
  readonly view: MarketView;
  readonly family: Family;
  readonly seats: readonly Seat[];
  readonly lamps: readonly Lamp[];
  readonly settleBlock: number | undefined;
  readonly blocksToGo: number | undefined;
  readonly explorerBase: string;
};

export type TableProps = {
  readonly hand: readonly HandCard[];
  readonly held: HeldCard;
  readonly chainNowSec: number;
  readonly notAdmitted: number;
  /// A band the Guide's action card asked the table to pre-select (`?band=`).
  readonly presetBand: number | undefined;
};

const hm = (sec: number): string => formatUtc(sec).slice(11, 16);

const elapsedLabel = (sinceSec: number, nowSec: number): string => {
  const total = Math.max(0, nowSec - sinceSec);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
};

export function Table({ hand, held, chainNowSec, notAdmitted, presetBand }: TableProps) {
  const router = useRouter();
  const { view, family } = held;
  const { setRoom } = useRoom();
  const { setBeat, setCards, state: player, refresh } = usePlayer();
  const overlay = useOverlay();
  const composer = usePickComposer({ marketId: view.marketId, optionCount: view.options.length });
  const [pot, setPot] = useState<ChipDenom[]>([]);
  const [ceremony, setCeremony] = useState<CeremonyStep>("none");
  const [nowSec, setNowSec] = useState(chainNowSec);
  const yours = useYourCard(view.marketId, composer.accepted);

  useEffect(() => {
    setRoom(roomGlowOf(family));
    applyMotion();
    return () => setRoom("none");
  }, [family, setRoom]);
  useEffect(() => {
    const unlock = () => unlockSound();
    window.addEventListener("pointerdown", unlock, { once: true });
    return () => window.removeEventListener("pointerdown", unlock);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNowSec((held) => held + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const availability = composerAvailabilityOf(view, nowSec);
  const potDown = pot.reduce((sum, chip) => sum + chip, 0);
  const { setStake } = composer;
  useEffect(() => setStake(potDown), [potDown, setStake]);

  const stage: CardStage | undefined = useMemo(() => {
    if (yours === undefined) return undefined;
    return deriveCardStage(
      { optionIndex: yours.optionIndex, published: yours.published },
      { state: view.state, timing: { lockTimeSec: view.lockTime, sourceWindowOpenSec: view.sourceWindowOpen, voidDeadlineSec: view.voidDeadline, expectedSettlementSec: view.expectedSettlement } },
      nowSec,
      yours.resolution,
    );
  }, [yours, view, nowSec]);

  const selected = yours?.optionIndex ?? composer.draft.optionIndex;
  const chose = selected !== undefined;
  const phase = phaseOf({ view, stage, lamps: held.lamps, chose, ceremony, revealed: yours?.revealed ?? false });
  useEffect(() => { setBeat(phase); }, [phase, setBeat]);
  useEffect(() => { setCards(hand.filter((card) => card.marketId !== undefined).length); }, [hand, setCards]);

  const runCeremony = useCallback(() => {
    const won = yours?.stage?.kind === "correct";
    for (const beat of CEREMONY_BEATS) {
      setTimeout(() => {
        setCeremony(beat.step);
        if (beat.step === "reveal") play("lamp");
        if (beat.step === "table") { play(won ? "chime" : "miss"); buzz(won ? "win" : "loss"); }
        if (beat.step === "slabbed") { play("stamp"); buzz("confirm"); }
      }, beat.afterMs);
    }
    setTimeout(() => { yours?.markRevealed(); refresh(); }, (CEREMONY_BEATS.at(-1)?.afterMs ?? 0) + 200);
  }, [yours, refresh]);
  // The seal: the stamp lands the moment the door accepts the Call.
  useEffect(() => {
    if (composer.accepted !== undefined) { play("stamp"); buzz("confirm"); }
  }, [composer.accepted]);

  const bands = useMemo(() => bandsOf(view, family), [view, family]);
  const ranges = useMemo(() => windowRangesOf(view), [view]);
  const settled = view.settlement;
  const showResult = isCeremonyOrAfter(phase) || phase === "SETTLED";
  const needle = showResult && settled !== undefined ? { optionIndex: settled.winningOption, value: settled.valueLabel } : undefined;
  const won = stage !== undefined && stage.kind === "correct";
  const stampWord: StampWord | undefined =
    phase === "SEALED" ? "SEALED" : phase === "TABLE" || phase === "SCORED" || phase === "SLABBED" ? (won ? "CORRECT" : "MISS") : undefined;
  const serial = yours === undefined ? undefined : cardSerialOf(view.marketId, yours.nonce);
  const foilLine = settled === undefined ? "" : `${settled.valueLabel} · ${(callTextOf(view, family, settled.winningOption) ?? "").toUpperCase()} · TX ${settled.proofTxHash === null ? "PENDING" : shortHash(settled.proofTxHash)}`;
  const slab: SlabProps | undefined =
    phase === "SLABBED" && serial !== undefined
      ? { foilLine, serial, resultWord: won ? "CORRECT" : "MISS" }
      : phase === "VOID" && serial !== undefined
        ? { foilLine: "NO EVENT INSIDE THE DEADLINE · EVERY CHIP RETURNED", serial, resultWord: "VOID" }
        : undefined;

  const rackLeft = composer.intake?.remaining ?? (player.kind === "ready" ? player.standing.rackLeft : undefined);
  const points = yours?.stake ?? potDown;
  const pays = grossPayout(points, view.options.length);
  const lockState = lockStateOf(composer, availability, chose, potDown, family.instrument === "windows" ? "windows" : "gauge", hm(view.lockTime));
  const onLock = () => {
    buzz("confirm");
    if (composer.provider.kind === "available") void composer.provider.connect();
    else void composer.sign();
  };
  const select = (optionIndex: number) => { composer.setOption(optionIndex); play("detent"); buzz("tap"); };
  const { setOption, draft } = composer;
  const presetOk = presetBand !== undefined && availability.kind === "open" && yours === undefined && presetBand < view.options.length;
  useEffect(() => {
    if (presetOk && presetBand !== undefined && draft.optionIndex === undefined) setOption(presetBand);
  }, [presetOk, presetBand, draft.optionIndex, setOption]);
  const toss = (chip: ChipDenom) => { setPot((held) => [...held, chip]); play("chip"); buzz("tap"); };
  const disabled = yours !== undefined || availability.kind === "closed" || composer.busy;
  const elapsed = phase === "WAITING" && nowSec >= view.sourceWindowOpen ? elapsedLabel(view.sourceWindowOpen, nowSec) : undefined;
  const lamps = lampViews(held.lamps, elapsed, family.sourceChain);

  const scoredStage = stage !== undefined && (stage.kind === "correct" || stage.kind === "incorrect") ? stage : undefined;
  const beats: Beat[] =
    (phase === "SCORED" || phase === "SLABBED") && scoredStage !== undefined
      ? [
          { k: "RESULT", v: won ? "CORRECT" : "MISS", tone: won ? "won" : "plain" },
          { k: "CHIPS BACK", v: won ? `+${scoredStage.score.pointsAwarded}` : "+0", tone: won ? "gold" : "plain" },
          { k: "DAY FINAL · STREAK", v: scoredStage.score.streakAfter === undefined ? "PROVISIONAL" : `${scoredStage.score.streakAfter}`, tone: won ? "gold" : "broken" },
        ]
      : [];
  const tally: TallyRow[] = showResult && settled !== undefined ? bands.map((band) => ({ label: `BAND ${"ABCDEF"[band.optionIndex] ?? band.optionIndex + 1} · ${band.word}`, n: view.options[band.optionIndex]?.picks ?? 0, won: band.optionIndex === settled.winningOption })) : [];

  const actions: Action[] =
    phase === "PROVEN" && settled !== undefined
      ? [{ label: "REVEAL THE RESULT", tone: "gold", onClick: runCeremony }]
      : phase === "SLABBED" || phase === "VOID"
        ? [
            { label: "SHARE THE SLAB", tone: "gold", onClick: () => { if (yours !== undefined) overlay.openSheet("SHARE THE SLAB", <ShareSheet facts={{ marketId: view.marketId, player: yours.player, nonce: yours.nonce, committed: yours.committed, callText: callText ?? "", family: family.name, verdict: phase === "VOID" ? "VOID" : won ? "CORRECT" : "MISS", lockLabel: `${hm(view.lockTime)} UTC` }} />); } },
            { label: "OPEN PROOF", tone: "stock", onClick: () => overlay.openSheet("THE PROOF", <ProofSheet view={view} family={family} lamps={held.lamps} explorerBase={held.explorerBase} />) },
            { label: "NEXT CARD", tone: "quiet", onClick: () => router.push("/deck") },
          ]
        : showsBack(phase)
          ? [
              { label: "TELL ME AT REVEAL", tone: "gold", onClick: () => yours?.watch() },
              { label: "PROOF SO FAR", tone: "stock", onClick: () => overlay.openSheet("THE PROOF", <ProofSheet view={view} family={family} lamps={held.lamps} explorerBase={held.explorerBase} />) },
              { label: "BACK TO THE DEAL", tone: "quiet", onClick: () => router.push("/deck") },
            ]
          : [];

  const clocks = family.instrument === "windows"
    ? [{ k: "LOCKS", v: hm(view.lockTime) }, { k: "SETTLE", v: held.settleBlock === undefined ? "BLOCK" : held.settleBlock.toLocaleString("en-US") }, { k: "PROOF", v: "ON BLOCK" }]
    : [{ k: "LOCKS", v: hm(view.lockTime) }, { k: "REPORT", v: hm(view.sourceWindowOpen) }, { k: "PROOF", v: hm(view.expectedSettlement) }];
  const headClock = settled !== undefined
    ? "SETTLED"
    : view.voided
      ? "VOIDED"
      : family.instrument === "windows"
        ? held.blocksToGo === undefined ? "SEALED BLOCK" : `${held.blocksToGo} BLOCKS`
        : view.locked ? `REPORT ${hm(view.sourceWindowOpen)} UTC` : `LOCKS ${hm(view.lockTime)} UTC`;

  const callText = callTextOf(view, family, selected);
  const frontProps = {
    family, marketId: view.marketId, question: family.question, decides: family.decides, headClock, clocks, bands, windowRanges: ranges,
    selected, onSelect: select, disabled, needle, callText, pays, settleBlock: held.settleBlock, blocksToGo: held.blocksToGo,
    measuredNote: family.id === "yield" ? `${MEASURED_LIDO.length} REPORTS · ${MEASURED_LIDO_DATE}` : "",
  };
  const backProps = yours === undefined || callText === undefined ? undefined : {
    serial: serial ?? "", player: yours.player, callText, points: yours.stake, pays: grossPayout(yours.stake, view.options.length),
    settleAt: family.instrument === "windows" ? "BLOCK" : hm(view.expectedSettlement), backNote: family.instrument === "windows" ? "THE SETTLE BLOCK IS FIXED IN ADVANCE. NO OPERATOR, INCLUDING US, CAN CHOOSE IT AFTER YOU CALL." : "IF NO REPORT LANDS INSIDE 24 H THE CARD VOIDS AND EVERY CHIP COMES BACK. NO SECOND WRITE, EVER.", published: yours.published,
  };
  const failure = composer.failure;
  const inline = composer.refusal !== undefined ? { headline: composer.refusal.message, next: composer.refusal.nextAction } : failure !== undefined ? { headline: failure.headline, next: failure.nextAction } : composer.intakeProblem !== undefined ? { headline: "The door is not answering.", next: composer.intakeProblem } : undefined;
  const dim = phase === "REVEAL" || phase === "TABLE" || phase === "SCORED";
  const flipped = showsBack(phase);

  return (
    <div className="relative grid flex-1 grid-cols-1 md:flex-none md:h-[calc(100dvh-76px)] md:overflow-hidden md:grid-cols-[1fr_380px] md:grid-rows-[minmax(0,1fr)]">
      <div className={`ceremony pointer-events-none absolute inset-0 z-[5] ${dim ? "opacity-100" : "opacity-0"}`} aria-hidden="true" />
      <div className="relative flex min-h-0 flex-col items-center overflow-visible pt-1.5 md:overflow-hidden md:pt-3.5">
        <div className="hidden w-full md:block"><SeatsArc seats={held.seats} you={yours?.player} flipped={phase === "TABLE" || phase === "SCORED" || phase === "SLABBED"} winningOption={settled?.winningOption} lockLabel={`${hm(view.lockTime)} UTC`} committed={view.state !== "Created"} /></div>
        <div className="w-full md:hidden"><SeatsArc compact seats={held.seats} you={yours?.player} flipped={phase === "TABLE" || phase === "SCORED" || phase === "SLABBED"} winningOption={settled?.winningOption} lockLabel={`${hm(view.lockTime)} UTC`} committed={view.state !== "Created"} /></div>
        <Guide marketId={view.marketId} lockTime={view.lockTime} nowSec={nowSec} open={availability.kind === "open" && yours === undefined} clocks={clocks} lamps={held.lamps} bands={bands} />

        <div className={`relative z-[3] w-full min-h-0 flex-1 px-4 md:px-0 ${slab === undefined ? "" : "pb-24"} ${dim ? "z-[7]" : ""}`}>
          <div className="hidden md:block"><Stage familyId={family.id} front={<CardFront {...frontProps} dealing />} back={backProps === undefined ? undefined : <CardBack {...backProps} />} flipped={flipped} stamp={stampWord} slab={slab} /></div>
          <div className="md:hidden"><Stage compact familyId={family.id} front={<CardFront {...frontProps} compact />} back={backProps === undefined ? undefined : <CardBack {...backProps} compact />} flipped={flipped} stamp={stampWord} slab={slab} /></div>
        </div>

        <div className="w-full px-4 md:hidden">
          <Lamps compact lamps={lamps} />
          <div className="mt-2.5">
            {inline === undefined ? null : <InlineNote headline={inline.headline} next={inline.next} />}
            {yours === undefined ? (
              <>
                <TheSpot compact pot={pot} rackLeft={rackLeft} rackTotal={100} onToss={toss} onClear={() => setPot([])} disabled={disabled} />
                <LockButton compact state={lockState} onPress={onLock} />
              </>
            ) : (
              <Actions row actions={actions} />
            )}
          </div>
        </div>

        <div className={`mt-auto hidden w-full grid-cols-[1fr_300px] items-end gap-6 px-[34px] pb-[26px] md:grid ${slab === undefined ? "z-[6]" : "z-[4]"}`}>
          <Hand cards={hand} heldId={view.marketId} onHold={(id) => router.push(`/play?m=${id}`)} notAdmitted={notAdmitted} />
          <TheSpot pot={pot} rackLeft={rackLeft} rackTotal={100} onToss={toss} onClear={() => setPot([])} disabled={disabled} />
        </div>
      </div>

      <aside className="right-rail relative z-[6] hidden flex-col gap-4 overflow-hidden border-l border-black/30 px-[22px] pt-[22px] pb-6 md:flex">
        <Lamps lamps={lamps} />
        <Beats beats={beats} />
        {tally.length > 0 ? <Tally rows={tally} /> : null}
        <div className="mt-auto flex flex-col gap-[9px]">
          {inline === undefined ? null : <InlineNote headline={inline.headline} next={inline.next} />}
          {composer.canResend ? <Actions actions={[{ label: failure?.kind === "unknown" ? "RESEND THE SAME CALL" : "TRY AGAIN", tone: "stock", onClick: () => void composer.resend() }]} /> : null}
          {yours === undefined && availability.kind === "open" ? (
            <>
              <LockButton state={lockState} onPress={onLock} />
              <p className="text-center font-data text-[9px] leading-[1.8] tracking-[.06em] text-felt-4">
                SIGN-IN IS ASKED HERE · YOUR DRAFT IS RESTORED AFTER
                <br />
                FREE POINTS · NO MONETARY VALUE
              </p>
            </>
          ) : yours === undefined ? (
            <LockButton state={lockState} onPress={onLock} />
          ) : null}
          <Actions actions={actions} />
        </div>
      </aside>
    </div>
  );
}

/// One persistent block for every non-success outcome, in the action slot: what happened,
/// what to do next, and that the points are untouched. Never a toast.
function InlineNote({ headline, next }: { headline: string; next: string }) {
  return (
    <div role="status" className="rounded-[12px] border-2 border-gold/40 bg-black/30 px-3.5 py-3">
      <p className="font-display text-[14px] font-extrabold text-stock">{headline}</p>
      <p className="mt-1 font-body text-[12.5px] leading-relaxed text-felt-1">{next}</p>
      <p className="mt-1.5 font-data text-[8.5px] tracking-[.14em] text-felt-3">YOUR POINTS ARE UNTOUCHED</p>
    </div>
  );
}
