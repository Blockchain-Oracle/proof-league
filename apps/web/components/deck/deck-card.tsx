import Link from "next/link";
import type { Family, FamilyStatus } from "../event/family.js";
import { Mark } from "../marks.js";
import { Silhouette } from "./silhouette.js";

// A deck card (design: THE DECK, 250px, rotated a hair, family strip with crest and status
// pill, the question, the family's silhouette, a mono caption). Used for the eight card
// types and, with a real Market behind it, for the cards on the table.

export type DeckPill = FamilyStatus | "LOCKED" | "SETTLED" | "VOIDED";

const ROTATIONS = ["-rotate-[1.6deg]", "rotate-[1.1deg]", "-rotate-[.7deg]", "rotate-[1.5deg]", "-rotate-[1.2deg]", "rotate-[.8deg]", "-rotate-[1.4deg]", "rotate-[1.3deg]"];

export function DeckCard({ family, pill, question, caption, index, href, selected }: { family: Family; pill: DeckPill; question: string; caption: string; index: number; href?: string; selected?: number | undefined }) {
  const dark = pill === "CONCEPT";
  const body = (
    <div className={`fam-${family.id} w-[250px] shrink-0 overflow-hidden rounded-[16px] border-[3px] border-ink bg-stock shadow-[7px_8px_0_rgba(0,0,0,.34)] ${ROTATIONS[index % ROTATIONS.length]} ${href === undefined ? "" : "transition-transform hover:-translate-y-1"}`}>
      <div className="flex items-center gap-[9px] border-b-[3px] border-ink bg-(--fam) px-[13px] py-2.5">
        <span className="flex h-[26px] w-[26px] items-center justify-center rounded-lg border-2 border-ink bg-stock text-(--fam)"><Mark id={family.crest} size={14} /></span>
        <span className="font-display text-[12.5px] font-extrabold text-stock">{family.name}</span>
        <span className={`ml-auto rounded-full px-1.5 py-[3px] font-data text-[8px] font-bold tracking-[.1em] ${dark ? "bg-ink text-stock" : "bg-stock text-ink"}`}>{pill}</span>
      </div>
      <div className="p-[13px]">
        <div className="min-h-[56px] font-display text-[16px] font-bold leading-[1.14] tracking-[-.025em] text-ink">{question}</div>
        <Silhouette family={family} selected={selected} />
        <div className="mt-[9px] font-data text-[8.5px] tracking-[.1em] text-stock-3">{caption}</div>
      </div>
    </div>
  );
  return href === undefined ? body : <Link href={href} aria-label={`${family.name}: ${question}`}>{body}</Link>;
}
