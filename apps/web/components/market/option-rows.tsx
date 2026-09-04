import type { MarketView } from "../../lib/market-view.js";

// The options and their real distribution, rendered once. The board, Reels and the Market
// page all show this block, and a second copy of it would be a second answer to how many
// Picks are on an option and where those numbers came from.
//
// Lifted out of market-card.tsx when the Market page needed the same block above its
// composer (rebaseline section 7: choices come before anything technical).

// Twelfths, from a static class list: Tailwind cannot see a width computed at runtime, and
// inline styles are banned in this codebase. The exact counts are printed beside every bar
// anyway, so the bar is the shape and the number is the fact. Any nonzero share rounds UP
// to one twelfth, because a real Pick that renders as an empty bar reads as no Pick.
const WIDTHS = [
  "w-0",
  "w-1/12",
  "w-2/12",
  "w-3/12",
  "w-4/12",
  "w-5/12",
  "w-6/12",
  "w-7/12",
  "w-8/12",
  "w-9/12",
  "w-10/12",
  "w-11/12",
  "w-full",
] as const;

const OptionBar = ({ share, won }: { share: number; won: boolean }) => (
  <span className="relative block h-1 w-full bg-rule/40" aria-hidden="true">
    <span
      className={`absolute inset-y-0 left-0 ${won ? "bg-up" : "bg-brand"} ${
        WIDTHS[Math.min(WIDTHS.length - 1, Math.ceil(share * 12))] ?? "w-0"
      }`}
    />
  </span>
);

/// The distribution's provenance, said out loud (AD-18). A committed set is pinned on-chain
/// by hash; intake drafts are our own observation of what has been signed so far, and the
/// difference is exactly the sort of thing this product refuses to blur.
export const distributionNote = (view: MarketView): string => {
  if (view.totalPicks === 0) {
    return view.locked
      ? "No Picks were committed on this Market."
      : "No Picks yet. The first one to be signed shows up here.";
  }
  const plural = view.totalPicks === 1 ? "Pick" : "Picks";
  return view.distribution === "committed"
    ? `${view.totalPicks} ${plural} in the committed set, the one pinned on-chain by hash.`
    : `${view.totalPicks} signed ${plural} so far, seen by us and not yet committed on-chain.`;
};

export function OptionRows({ view }: { view: MarketView }) {
  return (
    <>
      <ol className="flex flex-col gap-2">
        {view.options.map((option) => (
          <li key={option.index} className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between gap-3 font-data text-xs">
              <span className={option.won ? "text-up" : "text-ink"}>
                {option.label}
                {option.won ? " (this is where it landed)" : ""}
              </span>
              <span className="text-ink-muted">{view.totalPicks === 0 ? "" : `${option.picks} of ${view.totalPicks}`}</span>
            </div>
            <OptionBar share={view.totalPicks === 0 ? 0 : option.picks / view.totalPicks} won={option.won} />
          </li>
        ))}
      </ol>
      <p className="font-body text-xs text-ink-muted">{distributionNote(view)}</p>
    </>
  );
}
