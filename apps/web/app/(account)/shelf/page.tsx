"use client";

import { useEffect, useState } from "react";
import { isDecidedStage } from "@proof-league/shared";
import { useSigningProvider } from "../../../features/auth/adapter.js";
import { SlabRow, type ShelfCard } from "../../../components/shelf/slab-row.js";
import { usePlayer } from "../../../components/shell/player.js";

// SHELF (design: THE SHELF; Masayume's portfolio shape): no headline, one plate with ONE
// number and every other pool as a labelled row that is never added in, then your cards,
// open ones unslabbed first, misses never hidden or dimmed. Reads /api/cards for the seat
// that is connected; a shelf with no seat says so rather than showing someone else's.

const FIRST_PAGE = 8;

export default function ShelfPage() {
  const provider = useSigningProvider();
  const { state } = usePlayer();
  const address = provider.kind === "connected" ? provider.address : undefined;
  const [cards, setCards] = useState<ShelfCard[] | undefined>(undefined);
  const [all, setAll] = useState(false);

  useEffect(() => {
    if (address === undefined) return;
    let alive = true;
    void fetch(`/api/cards?player=${address}`, { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : { cards: [] }))
      .then((body: { cards: ShelfCard[] }) => { if (alive) setCards(body.cards); })
      .catch(() => { if (alive) setCards([]); });
    return () => { alive = false; };
  }, [address]);

  if (provider.kind === "loading") return <Note text="CHECKING YOUR SEAT" />;
  if (address === undefined) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
        <p className="font-data text-[9.5px] tracking-[.18em] text-felt-3">THE SHELF</p>
        <h1 className="font-display text-[28px] font-extrabold tracking-[-.03em] text-stock">Take a seat to see your shelf.</h1>
        <p className="max-w-[420px] font-body text-[14px] leading-relaxed text-felt-1">
          Your slabs are kept by your address. Nothing is stored until you make a Call.
        </p>
      </div>
    );
  }

  const standing = state.kind === "ready" ? state.standing : undefined;
  const open = (cards ?? []).filter((card) => card.live && !isDecidedStage(card.stage));
  const chipsDown = open.reduce((sum, card) => sum + card.stake, 0);
  const decided = (cards ?? []).filter((card) => isDecidedStage(card.stage) || !card.live);
  const shown = all ? decided : decided.slice(0, FIRST_PAGE);
  const correct = decided.filter((card) => card.stage.kind === "correct").length;
  const miss = decided.filter((card) => card.stage.kind === "incorrect").length;
  const voided = decided.filter((card) => card.view.voided).length;

  return (
    <div className="flex flex-col gap-10 px-4 py-8 md:px-10 md:py-12">
      <section className="max-w-[560px] rounded-[18px] border-2 border-gold/35 bg-black/25 p-5">
        <div className="font-data text-[9.5px] tracking-[.18em] text-felt-2">IN YOUR RACK · TODAY</div>
        <div className="mt-1 font-display text-[56px] font-extrabold leading-none tracking-[-.04em] text-stock">
          {standing === undefined ? "\u2013" : standing.rackLeft}
          <span className="ml-2 font-data text-[12px] tracking-[.14em] text-felt-3">/ {standing?.rackTotal ?? 100} PTS</span>
        </div>
        <p className="mt-2 font-body text-[12.5px] text-felt-2">What you can put down right now. Nothing else is added in.</p>
        <dl className="mt-4 grid grid-cols-[1fr_auto] gap-y-2 border-t border-gold/25 pt-3 font-data text-[10px] tracking-[.1em] text-felt-2">
          <dt>CHIPS DOWN ON OPEN CARDS</dt>
          <dd className="text-right text-stock">{chipsDown}</dd>
          <dt>SEASON POINTS</dt>
          <dd className="text-right text-stock">{standing === undefined ? "\u2013" : standing.seasonPoints}</dd>
          <dt>STREAK</dt>
          <dd className="text-right text-stock">{standing === undefined ? "\u2013" : `${standing.streak} · ${standing.dayFinal ? "DAY FINAL" : "AT RISK"}`}</dd>
          <dt>SEAT</dt>
          <dd className="text-right text-stock">{standing?.rank === undefined ? "UNRANKED" : `#${standing.rank}`}</dd>
        </dl>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h2 className="font-display text-[34px] font-extrabold tracking-[-.04em] text-stock">The shelf</h2>
          <span className="font-serif text-[26px] italic text-gold">slabbed &amp; kept</span>
          <span className="font-data text-[10.5px] tracking-[.12em] text-felt-3">MISSES ARE NEVER HIDDEN OR DIMMED · THE FOIL CARRIES THE VERDICT</span>
        </div>
        {cards === undefined ? (
          <Note text="READING YOUR SLABS" />
        ) : cards.length === 0 ? (
          <p className="max-w-[440px] font-body text-[14px] leading-relaxed text-felt-1">No cards yet. Hold today&apos;s card and make a Call.</p>
        ) : (
          <>
            {open.length > 0 ? (
              <div>
                <div className="mb-3 font-data text-[9.5px] tracking-[.18em] text-felt-2">OPEN · {open.length}</div>
                <div className="flex gap-[22px] overflow-x-auto pb-4">{open.map((card) => <SlabRow key={`${card.marketId}-${card.nonce}`} card={card} />)}</div>
              </div>
            ) : null}
            <div>
              <div className="mb-3 font-data text-[9.5px] tracking-[.18em] text-felt-2">
                SETTLED · {correct} CORRECT · {miss} MISS · {voided} VOID
              </div>
              {shown.length === 0 ? (
                <p className="font-body text-[13.5px] text-felt-2">Nothing settled yet. Slabs appear here as your cards close.</p>
              ) : (
                <div className="flex gap-[22px] overflow-x-auto pb-4">{shown.map((card) => <SlabRow key={`${card.marketId}-${card.nonce}`} card={card} />)}</div>
              )}
              {decided.length > FIRST_PAGE ? (
                <button type="button" onClick={() => setAll((held) => !held)} className="mt-2 font-data text-[10px] tracking-[.14em] text-gold">
                  {all ? "SHOW FEWER" : `SHOW ALL ${decided.length}`}
                </button>
              ) : null}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function Note({ text }: { text: string }) {
  return <p className="px-4 py-12 text-center font-data text-[9.5px] tracking-[.18em] text-felt-3 md:px-10">{text}</p>;
}
