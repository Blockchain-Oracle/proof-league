"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Lamp } from "../../lib/table-data.js";
import type { Band } from "../card/bands.js";
import { useOverlay } from "../overlay.js";
import { useGuideThread, type GuideMessage } from "./thread.js";
import { Typewriter } from "./typewriter.js";

// The Guide's drawer (Masayume's Sensei, in the table's words), opened through the shared
// overlay so it is the one sheet on screen, closes on Escape, and returns focus. The
// pinned meter is key-free truth: this card's three clocks and its lamps. Replies are
// spoken by the typewriter; follow-up chips come from the reply with the sit-out branch
// first; an action card appears only after a real read and only deep-links the table
// with the band pre-selected. It never signs.

export type GuideDrawerProps = {
  readonly marketId: string;
  readonly clocks: readonly { readonly k: string; readonly v: string }[];
  readonly lamps: readonly Lamp[];
  readonly bands: readonly Band[];
  /// The card still takes Calls, so a band read can become an action card.
  readonly open: boolean;
};

const INTRO = "I read the card with you and give you a straight read: a band, one honest reason, and what would prove me wrong. Free points. I read, you call.";
const STARTERS = ["Read this card", "Why are the bands where they are?", "Should I sit this one out?"];
const RESTLESS_SENDS = 4;
const RESTLESS_MS = 180_000;

const chipsOf = (last: GuideMessage | undefined): string[] => {
  if (last === undefined || last.role !== "guide" || last.failed || last.typing) return [];
  const lead = last.verdict === "sit-out" ? "Why sit out?" : last.verdict === "band" ? "What would prove you wrong?" : undefined;
  return [...(lead === undefined ? [] : [lead]), ...last.followUps].slice(0, 3);
};

export function GuideDrawer({ marketId, clocks, lamps, bands, open }: GuideDrawerProps) {
  const router = useRouter();
  const overlay = useOverlay();
  const { thread, send, spoken, opened } = useGuideThread(marketId);
  const [draft, setDraft] = useState("");
  const [restless, setRestless] = useState(false);
  const end = useRef<HTMLDivElement | null>(null);

  useEffect(() => { opened(); }, [opened]);
  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [thread.messages.length, thread.busy]);
  useEffect(() => {
    const check = () => setRestless(thread.sends >= RESTLESS_SENDS || (thread.openedAt !== undefined && Date.now() - thread.openedAt >= RESTLESS_MS));
    check();
    const timer = setInterval(check, 15_000);
    return () => clearInterval(timer);
  }, [thread.sends, thread.openedAt]);

  const last = thread.messages.at(-1);
  const chips = thread.messages.length === 0 ? STARTERS : chipsOf(last);
  const action = last !== undefined && last.role === "guide" && !last.failed && !last.typing ? last : undefined;
  const actionBand = action?.verdict === "band" && action.band !== null && open ? bands.find((band) => band.optionIndex === action.band) : undefined;

  const ask = (text: string) => {
    setDraft("");
    void send(text);
  };

  return (
    <div className="flex flex-col gap-4">
      <section aria-label="This card" className="rounded-[12px] border-2 border-gold/30 bg-black/25 px-3.5 py-3">
        <div className="grid grid-cols-3 gap-2">
          {clocks.map((clock) => (
            <div key={clock.k}>
              <div className="font-data text-[8.5px] tracking-[.16em] text-felt-4">{clock.k}</div>
              <div className="font-data text-[12px] tracking-[.04em] text-felt-text">{clock.v}</div>
            </div>
          ))}
        </div>
        <ul className="mt-2.5 flex items-center gap-3 border-t border-gold/20 pt-2.5">
          {lamps.map((lamp) => (
            <li key={lamp.name} className="flex items-center gap-1.5 font-data text-[8.5px] tracking-[.14em] text-felt-3">
              <span className={`h-2 w-2 rounded-full border border-ink-green ${lamp.lit ? "bg-gold" : "bg-black/50"}`} aria-hidden="true" />
              {lamp.name}
            </li>
          ))}
        </ul>
      </section>

      <div className="flex flex-col gap-2.5" aria-live="polite">
        <Bubble role="guide">{INTRO}</Bubble>
        {thread.messages.map((item) => (
          <Bubble key={item.id} role={item.role} failed={item.failed}>
            {item.role === "guide" && !item.failed ? <Typewriter text={item.text} live={item.typing} onDone={() => spoken(item.id)} /> : item.text}
          </Bubble>
        ))}
        {thread.busy ? (
          <Bubble role="guide">
            <span className="inline-flex gap-1" aria-label="The Guide is reading">
              <span className="anim-pulse h-1.5 w-1.5 rounded-full bg-ink" />
              <span className="anim-pulse h-1.5 w-1.5 rounded-full bg-ink [animation-delay:.3s]" />
              <span className="anim-pulse h-1.5 w-1.5 rounded-full bg-ink [animation-delay:.6s]" />
            </span>
          </Bubble>
        ) : null}
        <div ref={end} />
      </div>

      {actionBand !== undefined ? (
        <button
          type="button"
          onClick={() => { overlay.closeSheet(); router.push(`/play?m=${marketId}&band=${actionBand.optionIndex}`); }}
          className="anim-rise rounded-[14px] border-[3px] border-ink bg-stock px-4 py-3 text-left shadow-[0_6px_0_rgba(0,0,0,.32)]"
        >
          <span className="block font-data text-[8.5px] tracking-[.16em] text-stock-3">THE GUIDE'S READ · PRESS TO HOLD IT ON THE TABLE</span>
          <span className="mt-1 block font-display text-[19px] font-extrabold tracking-[-.03em] text-ink">{actionBand.label} · {actionBand.word}</span>
          <span className="mt-1 block font-data text-[8.5px] tracking-[.12em] text-stock-3">NOTHING IS SIGNED UNTIL YOU LOCK IT IN</span>
        </button>
      ) : action?.verdict === "sit-out" ? (
        <button
          type="button"
          onClick={() => { overlay.closeSheet(); router.push("/deck"); }}
          className="anim-rise rounded-[14px] border-[3px] border-ink bg-stock px-4 py-3 text-left shadow-[0_6px_0_rgba(0,0,0,.32)]"
        >
          <span className="block font-data text-[8.5px] tracking-[.16em] text-stock-3">THE GUIDE'S READ</span>
          <span className="mt-1 block font-display text-[19px] font-extrabold tracking-[-.03em] text-ink">Sit this one out. See the other cards.</span>
        </button>
      ) : null}

      {chips.length > 0 && !thread.busy ? (
        <ul className="flex flex-wrap gap-1.5">
          {chips.map((chip) => (
            <li key={chip}>
              <button type="button" onClick={() => ask(chip)} className="rounded-full border-2 border-gold/50 px-3 py-1.5 font-data text-[9.5px] tracking-[.08em] text-felt-text hover:border-gold hover:text-gold">
                {chip}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {restless ? <p className="font-data text-[8.5px] leading-relaxed tracking-[.12em] text-felt-4">TAKE THE CARD AT YOUR OWN PACE. THE GUIDE READS, YOU CALL.</p> : null}

      <form
        onSubmit={(event) => { event.preventDefault(); ask(draft); }}
        className="flex gap-2 border-t-2 border-gold/30 pt-4"
      >
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          maxLength={600}
          placeholder="Ask the Guide"
          aria-label="Ask the Guide"
          className="min-w-0 flex-1 rounded-[12px] border-2 border-ink bg-stock px-3.5 py-2.5 font-body text-[14px] text-ink placeholder:text-stock-3 focus:border-gold focus:outline-none"
        />
        <button type="submit" disabled={thread.busy || draft.trim() === ""} className="rounded-[12px] border-[3px] border-felt-edge bg-gold px-4 font-display text-[13px] font-extrabold tracking-[-.01em] text-ink-green shadow-[0_4px_0_#0B1710] active:translate-y-[3px] active:shadow-[0_1px_0_#0B1710] disabled:opacity-50">
          ASK
        </button>
      </form>
      <p className="font-data text-[8.5px] leading-relaxed tracking-[.12em] text-felt-4">THE GUIDE READS THE CARD AS THE TABLE PRINTS IT. IT NEVER SIGNS, AND IT NEVER SEES YOUR WALLET.</p>
    </div>
  );
}

function Bubble({ role, failed = false, children }: { role: "you" | "guide"; failed?: boolean; children: React.ReactNode }) {
  if (role === "you") {
    return <p className="ml-8 self-end rounded-[14px] border-2 border-gold/45 px-3.5 py-2.5 font-body text-[13.5px] leading-relaxed text-felt-text">{children}</p>;
  }
  return (
    <div className={`mr-6 rounded-[14px] border-2 border-ink px-3.5 py-2.5 font-body text-[13.5px] leading-relaxed ${failed ? "border-dashed bg-black/25 text-felt-1" : "bg-stock text-ink"}`}>
      <span className={`mb-1 block font-data text-[8px] tracking-[.18em] ${failed ? "text-felt-3" : "text-stock-3"}`}>{failed ? "NOTE" : "THE GUIDE"}</span>
      {children}
    </div>
  );
}
