"use client";

import { useEffect, useState } from "react";
import { MIN_STAKE, PICK_POINTS_DAILY } from "@proof-league/shared";
import { useSigningProvider } from "../../features/auth/adapter.js";
import { Mark } from "../marks.js";

// First run (Masayume's five-screen tutorial, in the table's words). Opens once, after
// hydration, so a returning visitor never sees a frame of it; Skip on every step; the
// last screen is the seat itself and closes the moment a wallet lands. One boolean key,
// versioned by its name. Blocked storage means it shows again next visit, not never.

const KEY = "pl.tutorialSeen";

const STEPS = [
  {
    eyebrow: "WELCOME TO THE TABLE",
    title: "Real on-chain events are the cards.",
    body: "Proof League is a free-points league on Creditcoin 3 testnet. Lido's daily staking rate on Ethereum is one card; a sealed Sepolia block draw is another. Nothing here is money, and nothing here can become money.",
  },
  {
    eyebrow: "HOW A CARD WORKS",
    title: "Call it before it happens.",
    body: "Every card has three clocks. Calls lock first, before anyone can compute the answer. Then Ethereum reports the event. Then Creditcoin proves that exact log and the card is slabbed with the verdict.",
  },
  {
    eyebrow: "YOUR WALLET SIGNS",
    title: "One message per Call.",
    body: "Locking a Call signs one message: this card, this band, these points, for today. It moves no funds and authorises nothing else. Nothing signs on your behalf, and your card stays private until you publish it.",
  },
  {
    eyebrow: "WHERE YOUR POINTS SIT",
    title: `${PICK_POINTS_DAILY} points a day, in the rack.`,
    body: `The rack refills at 00:00 UTC and never from winnings. Chips down on open cards are counted separately, and season points separately again. The three are never added together, because they are not the same thing.`,
  },
  {
    eyebrow: "LAST STEP",
    title: "Take your seat.",
    body: `Any wallet this browser has. Testnet, so nothing is at risk, and you sign every Call yourself. The smallest Call is ${MIN_STAKE} points.`,
  },
];

export function FirstRun() {
  const provider = useSigningProvider();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    try {
      setOpen(localStorage.getItem(KEY) !== "1");
    } catch {
      setOpen(true);
    }
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      // Blocked storage: the walkthrough returns next visit, which is the honest outcome.
    }
    setOpen(false);
  };

  const last = step === STEPS.length - 1;
  const connected = provider.kind === "connected";
  useEffect(() => {
    if (open && last && connected) {
      try {
        localStorage.setItem(KEY, "1");
      } catch {
        // Blocked storage: shows again next visit.
      }
      setOpen(false);
    }
  }, [open, last, connected]);

  if (!open) return null;
  const current = STEPS[step] ?? STEPS[0];
  if (current === undefined) return null;
  return (
    <div className="fixed inset-0 z-[45] flex items-end justify-center bg-[rgba(4,10,7,.72)] p-4 md:items-center" role="dialog" aria-modal="true" aria-label="Welcome to the table">
      <div className="fam-yield w-full max-w-[460px] overflow-hidden rounded-[22px] border-[3px] border-ink bg-stock shadow-[12px_14px_0_rgba(0,0,0,.36)]">
        <div className="flex items-center gap-3 border-b-[3px] border-ink bg-(--fam) px-5 py-3.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-[11px] border-2 border-ink bg-stock text-(--fam)"><Mark id="proof-league" size={20} /></span>
          <span className="font-data text-[9.5px] tracking-[.16em] text-stock">{current.eyebrow}</span>
          <ol className="ml-auto flex items-center gap-1" aria-label={`Step ${step + 1} of ${STEPS.length}`}>
            {STEPS.map((_, index) => (
              <li key={index} className={`h-1 rounded-full ${index === step ? "w-6 bg-stock" : index < step ? "w-2 bg-stock/70" : "w-2 bg-stock/35"}`} />
            ))}
          </ol>
        </div>
        <div className="px-6 pt-5 pb-6">
          <h2 className="font-display text-[26px] font-extrabold leading-[1.06] tracking-[-.035em] text-ink text-balance">{current.title}</h2>
          <p className="mt-3 font-body text-[14px] leading-[1.55] text-stock-2">{current.body}</p>
          {last ? (
            <div className="mt-5 flex flex-col gap-2">
              {provider.kind === "available" ? (
                <button type="button" onClick={() => void provider.connect()} className="rounded-[14px] border-[3px] border-felt-edge bg-gold px-5 py-4 font-display text-[18px] font-extrabold tracking-[-.02em] text-ink-green shadow-[0_6px_0_#0B1710] active:translate-y-[5px] active:shadow-[0_1px_0_#0B1710]">
                  TAKE A SEAT
                </button>
              ) : (
                <p className="rounded-[12px] border-2 border-dashed border-ink/25 px-4 py-3 font-data text-[9.5px] leading-relaxed tracking-[.08em] text-stock-3">
                  {provider.kind === "connected" ? "YOU ARE SEATED." : provider.kind === "loading" ? "CHECKING WHAT THIS BROWSER CAN SIGN WITH." : "NO WALLET IN THIS BROWSER YET. YOU CAN READ EVERY CARD AND EVERY PROOF WITHOUT ONE."}
                </p>
              )}
            </div>
          ) : null}
          <div className="mt-5 flex items-center justify-between">
            <button type="button" onClick={dismiss} className="font-data text-[10px] tracking-[.14em] text-stock-3 underline">SKIP</button>
            {last ? (
              <button type="button" onClick={dismiss} className="font-data text-[10px] tracking-[.14em] text-ink underline">LOOK AROUND FIRST</button>
            ) : (
              <button type="button" onClick={() => setStep((held) => held + 1)} className="rounded-full border-2 border-ink bg-ink px-5 py-2 font-display text-[13px] font-extrabold text-stock">
                {step === STEPS.length - 2 ? "LAST STEP" : "NEXT"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
