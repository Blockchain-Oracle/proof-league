import type { MarketChip } from "@proof-league/shared";

// The ONE renderer of Market/Pick state (UX-DR2, AD-18): every surface renders state
// through this component over shared deriveMarketChip, so no view can invent a state.
// The invariant is enforced twice: the ui-grammar sweep greps the multi-word chip
// strings outside this file + market-state.ts, and eslint bans the chip literals
// elsewhere in apps/web. Text + icon + optional semantic tint; color NEVER replaces
// text (State Label contract, REFERENCE-DESIGN §5), and red-alarm styling is forbidden.

export type ChipValue = MarketChip | "pending";

// Semantic tint per chip: proof verified is the one earned green; waiting amber covers
// genuinely-unknown confirmation (awaiting attestation, stuck, pick pending); voided is
// the ash historical record; the rest are ink.
const TINT: Record<ChipValue, string> = {
  open: "text-brand",
  locked: "text-ink",
  committed: "text-ink",
  "awaiting attestation": "text-waiting",
  "proof verified": "text-up",
  voided: "text-recorded",
  stuck: "text-waiting",
  pending: "text-waiting",
};

const ICON: Record<ChipValue, React.ReactNode> = {
  open: <circle cx="6" cy="6" r="3.5" fill="none" stroke="currentColor" />,
  locked: <path d="M3.5 6V4.5a2.5 2.5 0 0 1 5 0V6M3 6h6v4H3z" fill="none" stroke="currentColor" />,
  committed: <path d="M2.5 4h7M2.5 6h7M2.5 8h5" stroke="currentColor" />,
  "awaiting attestation": <path d="M6 2.5v3.5l2.5 1.5M10 6a4 4 0 1 1-4-4" fill="none" stroke="currentColor" />,
  "proof verified": <path d="M2.5 6.5 5 9l4.5-5.5" fill="none" stroke="currentColor" strokeWidth="1.5" />,
  voided: <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" />,
  stuck: <path d="M6 2.5v4M6 8.75v.5" stroke="currentColor" strokeWidth="1.5" />,
  pending: <path d="M2.5 6h7M7 3.5 9.5 6 7 8.5" fill="none" stroke="currentColor" />,
};

export function StateChip({ chip }: { chip: ChipValue }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 border border-rule bg-surface px-2 py-0.5 font-data text-[11px] uppercase tracking-widest ${TINT[chip]}`}
    >
      <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
        {ICON[chip]}
      </svg>
      {chip}
    </span>
  );
}
