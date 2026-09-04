"use client";

import { formatUtc, SEVEN_CHECKS } from "@proof-league/shared";
import type { Lamp } from "../../lib/table-data.js";
import type { MarketView } from "../../lib/market-view.js";
import type { Family } from "../event/family.js";
import { callTextOf, shortHash } from "./bands.js";

// OPEN PROOF (rebaseline section 7.8): three levels from the exact card. The plain result
// first, then the lifecycle as lamps with their times, then the technical receipt with
// every identifier a reader needs to check it themselves. Opens and closes as a sheet, so
// the card and the player's place on the table are never lost.

export function ProofSheet({ view, family, lamps, explorerBase }: { view: MarketView; family: Family; lamps: readonly Lamp[]; explorerBase: string }) {
  const settled = view.settlement;
  const plain = settled === undefined
    ? view.voided
      ? `Nothing landed inside this card's window, so it voided at ${formatUtc(view.voidDeadline)} and every chip came back. No proof was ever needed.`
      : `Nothing is proven yet. ${view.locked ? `The event is due after ${formatUtc(view.sourceWindowOpen)}.` : `Calls lock at ${formatUtc(view.lockTime)}.`} Lamps light as the worker sees the event, the attestation, and the proof.`
    : `${family.sourceChain} reported ${settled.valueLabel}, which lands in ${(callTextOf(view, family, settled.winningOption) ?? "").toLowerCase()}. Creditcoin verified the exact log and resolved the card at ${formatUtc(settled.resolvedAt)}.`;
  const receipt: readonly [string, string, string | undefined][] = [
    ["SOURCE CHAIN", family.sourceChain, undefined],
    ["EMITTER", view.emitter, undefined],
    ["DECODER", `#${view.decoderId}`, undefined],
    ["THRESHOLDS", view.boundaries.join(" · "), undefined],
    ["SOURCE KEY", view.sourceKey, undefined],
    ["SUBJECT", view.subjectFilter, undefined],
    ["CREDITCOIN TX", settled?.proofTxHash ?? "none yet", settled?.proofTxHash ? `${explorerBase}/tx/${settled.proofTxHash}` : undefined],
  ];
  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-[12px] border-2 border-gold/40 bg-black/25 px-4 py-3.5">
        <div className="font-data text-[9.5px] tracking-[.16em] text-gold">PLAIN RESULT</div>
        <p className="mt-2 font-display text-[16px] font-bold leading-[1.3] tracking-[-.01em] text-stock">{plain}</p>
      </section>
      <section className="rounded-[12px] border border-white/15 px-4 py-3.5">
        <div className="font-data text-[9.5px] tracking-[.16em] text-felt-2">LIFECYCLE</div>
        <ul className="mt-3 flex flex-col gap-2.5">
          <Row k="CALLS LOCKED" v={formatUtc(view.lockTime)} lit />
          <Row k="SET PINNED" v={view.state === "Created" ? "at lock" : "on-chain by hash"} lit={view.state !== "Created"} />
          {lamps.map((lamp) => (
            <Row key={lamp.name} k={lamp.name} v={lamp.lit ? `${lamp.atSec === undefined ? "" : formatUtc(lamp.atSec)}${lamp.txHash ? ` · ${shortHash(lamp.txHash)}` : ""}${lamp.evidence === "observed" ? " · observed" : lamp.evidence === "proven" ? " · proven" : ""}` : "not yet"} lit={lamp.lit} />
          ))}
          <Row k="CARD SCORED" v={settled === undefined ? "after proof" : "same transaction"} lit={settled !== undefined} />
        </ul>
        <p className="mt-3 font-data text-[8.5px] leading-[1.7] tracking-[.06em] text-felt-4">OBSERVED IS OUR OWN ACCOUNT. PROVEN CARRIES A CREDITCOIN TRANSACTION ANYONE CAN OPEN.</p>
      </section>
      <section className="rounded-[12px] border border-white/15 px-4 py-3.5">
        <div className="font-data text-[9.5px] tracking-[.16em] text-felt-2">TECHNICAL RECEIPT</div>
        <dl className="mt-3 grid grid-cols-[100px_1fr] gap-x-3 gap-y-2">
          {receipt.map(([k, v, href]) => (
            <Receipt key={k} k={k} v={v} href={href} />
          ))}
        </dl>
      </section>
      <section className="rounded-[12px] border border-white/15 px-4 py-3.5">
        <div className="font-data text-[9.5px] tracking-[.16em] text-felt-2">THE SEVEN CHECKS</div>
        <ol className="mt-2 flex flex-col gap-1.5">
          {SEVEN_CHECKS.map((check, index) => (
            <li key={check.id} className="flex gap-3 font-body text-[12.5px] text-felt-1">
              <span className="font-data text-[9.5px] text-gold">{String(index + 1).padStart(2, "0")}</span>
              {check.title}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function Row({ k, v, lit }: { k: string; v: string; lit: boolean }) {
  return (
    <li className="flex items-start gap-3">
      <span className={`mt-1 h-3 w-3 shrink-0 rounded-full border-2 border-felt-edge ${lit ? "lamp-lit" : "bg-black/35"}`} />
      <span className="w-[110px] shrink-0 font-data text-[9.5px] tracking-[.12em] text-felt-2">{k}</span>
      <span className={`font-data text-[10.5px] ${lit ? "text-stock" : "text-felt-3"}`}>{v}</span>
    </li>
  );
}

function Receipt({ k, v, href }: { k: string; v: string; href: string | undefined }) {
  return (
    <>
      <dt className="font-data text-[9px] tracking-[.12em] text-felt-3">{k}</dt>
      <dd className="break-all font-data text-[10px] text-felt-1">
        {href === undefined ? v : <a href={href} target="_blank" rel="noreferrer" className="text-gold underline">{v}</a>}
      </dd>
    </>
  );
}
