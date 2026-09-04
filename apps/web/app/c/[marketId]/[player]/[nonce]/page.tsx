import Link from "next/link";
import { formatUtc } from "@proof-league/shared";
import { readEndpoints } from "@proof-league/chain";
import { callTextOf, shortHash } from "../../../../../components/card/bands.js";
import { familyOfEmitter } from "../../../../../components/event/family.js";
import { Mark } from "../../../../../components/marks.js";
import { AvatarTile } from "../../../../../components/shell/account.js";
import { shortAddress } from "../../../../../lib/format.js";
import { chainClock } from "../../../../../lib/chain-clock.js";
import { cardsFor } from "../../../../../lib/cards-data.js";

// A shared slab (Masayume's missing recipient page, built): the exact card, its verdict
// and its proof, on the felt, with a seat at the table one tap away. Committed and settled
// Calls only; a draft at the door is not public data and this page says so.

export const dynamic = "force-dynamic";

type Params = { readonly marketId: string; readonly player: string; readonly nonce: string };

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { marketId, player, nonce } = await params;
  return {
    title: "A Proof League slab",
    openGraph: { images: [`/api/cards/image?m=${marketId}&p=${player}&n=${nonce}&og=1`] },
    twitter: { card: "summary_large_image", images: [`/api/cards/image?m=${marketId}&p=${player}&n=${nonce}&og=1`] },
  };
}

export default async function SlabPage({ params }: { params: Promise<Params> }) {
  const { marketId, player, nonce } = await params;
  const valid = /^[0-9]+$/.test(marketId) && /^0x[0-9a-fA-F]{40}$/.test(player) && /^[0-9]+$/.test(nonce);
  const clock = await chainClock();
  const card = valid ? (await cardsFor(player, clock.chainNowSec)).find((held) => held.marketId === marketId && held.nonce === Number(nonce)) : undefined;
  const family = card === undefined ? undefined : familyOfEmitter(card.view.emitter);
  const explorer = readEndpoints(process.env).EXPLORER_BASE_CC3;

  if (card === undefined || family === undefined || (!card.committed && card.view.settlement === undefined)) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
        <p className="font-data text-[9.5px] tracking-[.18em] text-felt-3">A SLAB</p>
        <h1 className="font-display text-[28px] font-extrabold tracking-[-.03em] text-stock">This card is not public.</h1>
        <p className="max-w-[440px] font-body text-[14px] leading-relaxed text-felt-1">Either it does not exist, or its Call has not been committed at lock yet. Cards become public data when the set is pinned on-chain.</p>
        <Link href="/play" className="mt-2 font-data text-[10px] tracking-[.14em] text-gold underline">TAKE A SEAT</Link>
      </div>
    );
  }

  const settled = card.view.settlement;
  const won = card.stage.kind === "correct";
  const decided = card.stage.kind === "correct" || card.stage.kind === "incorrect";
  const call = callTextOf(card.view, family, card.optionIndex) ?? `OPTION ${card.optionIndex + 1}`;
  return (
    <div className="flex flex-1 flex-col items-center gap-8 px-4 py-10 md:py-16">
      <div className="flex items-center gap-3">
        <AvatarTile address={card.player} className="h-[30px] w-[30px]" />
        <span className="font-data text-[11px] tracking-[.1em] text-felt-2">{shortAddress(card.player).toUpperCase()} CALLED</span>
      </div>
      <div className={`fam-${family.id} w-[320px] rounded-[20px] p-[14px_12px_12px] ${decided || card.view.voided ? "slab-glass-shelf border-2 border-white/40 shadow-[0_14px_34px_rgba(0,0,0,.4)]" : "border-2 border-dashed border-gold/30"}`}>
        <div className="overflow-hidden rounded-[13px] border-[3px] border-ink bg-stock">
          <div className="flex items-center gap-2 border-b-[3px] border-ink bg-(--fam) px-[11px] py-2">
            <span className="flex h-[22px] w-[22px] items-center justify-center rounded-md border-2 border-ink bg-stock text-(--fam)"><Mark id={family.crest} size={12} /></span>
            <span className="font-display text-[11px] font-extrabold text-stock">{family.name}</span>
            <span className="ml-auto font-data text-[8px] text-stock/80">{formatUtc(card.view.lockTime).slice(0, 10)}</span>
          </div>
          <div className="p-3">
            <div className="font-data text-[8.5px] tracking-[.16em] text-stock-3">THE CALL</div>
            <div className="mt-[5px] font-display text-[24px] font-extrabold tracking-[-.035em] text-ink">{call}</div>
            <div className="my-[11px] h-0.5 bg-ink" />
            <div className="font-data text-[9.5px] leading-[1.8] text-stock-2">
              {decided && settled ? `PROVEN ${settled.valueLabel} · ${won ? "CORRECT" : "MISS"}` : card.view.voided ? "NO EVENT INSIDE THE DEADLINE" : `SEALED · LOCKED ${formatUtc(card.view.lockTime).slice(11, 16)} UTC`}
              <br />
              {card.stake} PTS IN{decided ? ` · ${won ? card.stake * card.view.options.length : 0} OUT` : ""}
            </div>
          </div>
        </div>
        <div className={`mt-[11px] flex items-center justify-between rounded-[9px] border-2 border-ink px-[11px] py-2 ${won ? "foil-gold foil-sheen" : decided ? "foil-ash" : card.view.voided ? "foil-void" : "card-back"}`}>
          <span className={`font-display text-[12px] font-extrabold ${decided || card.view.voided ? "text-ink-green" : "text-gold"}`}>{decided ? "PROVEN ON CREDITCOIN" : card.view.voided ? "VOID · POINTS RETURNED" : "SEALED"}</span>
          {settled?.proofTxHash ? (
            <a href={`${explorer}/tx/${settled.proofTxHash}`} target="_blank" rel="noreferrer" className="font-data text-[8.5px] text-ink-green/80 underline">{shortHash(settled.proofTxHash)}</a>
          ) : (
            <span className="font-data text-[8.5px] text-felt-3">SERIAL {card.marketId}-{card.nonce}</span>
          )}
        </div>
      </div>
      <p className="max-w-[420px] text-center font-body text-[13.5px] leading-relaxed text-felt-1">
        {decided && settled ? `${family.sourceChain} reported ${settled.valueLabel}; Creditcoin verified the exact log. Nobody could change the Call after it locked, including us.` : "A real on-chain event, called before it happened, proven on Creditcoin when it does."}
      </p>
      <Link href={`/play?m=${card.marketId}`} className="rounded-[14px] border-[3px] border-felt-edge bg-gold px-8 py-4 font-display text-[18px] font-extrabold tracking-[-.02em] text-ink-green shadow-[0_6px_0_#0B1710]">
        TAKE A SEAT
      </Link>
    </div>
  );
}
