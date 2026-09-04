"use client";

import { useState } from "react";
import { useOverlay } from "../overlay.js";

// SHARE THE SLAB (Masayume's share ladder, in the table's words). The slab is rendered by
// the server as a PNG; the ladder is decided inside the click: native file share where the
// browser has it, else the PNG is saved and the post opens with the text ready. A cancelled
// share sheet is a choice and says nothing. Drafts stay private until the set is committed
// at lock, and the sheet says so instead of pretending.

export type ShareFacts = {
  readonly marketId: string;
  readonly player: string;
  readonly nonce: number;
  readonly committed: boolean;
  readonly callText: string;
  readonly family: string;
  readonly verdict: "CORRECT" | "MISS" | "VOID" | "SEALED";
  readonly lockLabel: string;
};

const SIGN_OFF = "proofleague";

const tweetOf = (facts: ShareFacts): string =>
  facts.verdict === "SEALED"
    ? `My call: ${facts.callText} on the ${facts.family.toLowerCase()} card. Locks ${facts.lockLabel}, proven on Creditcoin when it lands. #${SIGN_OFF}`
    : facts.verdict === "VOID"
      ? `The ${facts.family.toLowerCase()} card voided: no event inside its window, every chip back. Proven on Creditcoin. #${SIGN_OFF}`
      : `I called ${facts.callText} on the ${facts.family.toLowerCase()} card. ${facts.verdict === "CORRECT" ? "Correct" : "Missed"}, proven on Creditcoin. #${SIGN_OFF}`;

export function ShareSheet({ facts }: { facts: ShareFacts }) {
  const overlay = useOverlay();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | undefined>(undefined);
  const image = `/api/cards/image?m=${facts.marketId}&p=${facts.player}&n=${facts.nonce}`;
  const link = `${typeof window === "undefined" ? "" : window.location.origin}/c/${facts.marketId}/${facts.player}/${facts.nonce}`;
  const text = tweetOf(facts);
  const intent = `https://x.com/intent/tweet?text=${encodeURIComponent(`${text} ${link}`)}`;

  const share = async () => {
    setBusy(true);
    setNote(undefined);
    // Decide the path inside the gesture: a late window.open is popup-blocked once the
    // render has taken more than a beat, so the intent tab is opened first when native
    // file share is not available.
    const canFiles = typeof navigator.canShare === "function" && navigator.canShare({ files: [new File([new Uint8Array(8)], "p.png", { type: "image/png" })] });
    const pending = canFiles ? null : window.open("about:blank", "_blank");
    try {
      const blob = await (await fetch(image)).blob();
      const file = new File([blob], `proof-league-slab-${facts.marketId}-${facts.nonce}.png`, { type: "image/png" });
      if (canFiles) {
        try {
          await navigator.share({ files: [file], text });
        } catch (error) {
          if ((error as { name?: string }).name !== "AbortError") setNote("The share sheet did not open. The slab is saved below instead.");
        }
      } else {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = file.name;
        document.body.append(anchor);
        anchor.click();
        anchor.remove();
        setTimeout(() => URL.revokeObjectURL(url), 30_000);
        if (pending !== null) pending.location.href = intent;
        setNote("Slab saved. Attach it to your post on X.");
      }
    } catch {
      pending?.close();
      setNote("Could not render the slab right now. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      overlay.toast("Link copied");
    } catch {
      setNote(link);
    }
  };

  if (!facts.committed) {
    return (
      <div className="space-y-4">
        <p className="font-body text-[13.5px] leading-relaxed text-felt-1">
          Your card is private until the set is committed at lock ({facts.lockLabel}). The moment it is pinned on-chain, sharing opens here with the slab and a link anyone can check.
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-[14px] border-2 border-ink bg-felt">
        <img src={image} alt={`Your slab: ${facts.callText}, ${facts.verdict}`} className="block w-full" />
      </div>
      <p className="font-body text-[13px] leading-relaxed text-felt-1">{text}</p>
      <div className="flex gap-2.5">
        <button type="button" onClick={() => void share()} disabled={busy} aria-busy={busy} className="flex-1 rounded-[12px] border-2 border-felt-edge bg-gold px-3 py-3.5 font-display text-[15px] font-extrabold text-ink-green">
          {busy ? "RENDERING" : "SHARE THE SLAB"}
        </button>
        <button type="button" onClick={() => void copy()} className="flex-1 rounded-[12px] border-2 border-white/35 px-3 py-3.5 font-display text-[15px] font-extrabold text-stock">
          COPY LINK
        </button>
      </div>
      <a href={intent} target="_blank" rel="noreferrer" className="block text-center font-data text-[10px] tracking-[.14em] text-felt-2 underline">POST ON X</a>
      {note === undefined ? null : <p className="font-data text-[10px] leading-relaxed tracking-[.06em] text-felt-2">{note}</p>}
    </div>
  );
}
