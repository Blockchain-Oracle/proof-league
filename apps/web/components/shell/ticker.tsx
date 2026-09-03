// The live strip (REFERENCE-DESIGN §4): it may show real next-lock/settlement facts and
// can NEVER animate fabricated market data. Until markets flow, it carries the product's
// standing truths as copy; the Markets stories swap in real next-lock facts from the
// class-1 projection. Reduced motion holds the line static (globals.css owns the rule).
const FACTS = [
  "Free points, real proofs, no money.",
  "Every settlement is a verified cross-chain proof.",
  "Nobody can move a boundary after lock.",
  "Picks commit before the answer can exist.",
  "The record is public and rebuildable from chain.",
] as const;

export function Ticker() {
  const line = FACTS.join("  ·  ");
  return (
    <div className="overflow-hidden border-b border-rule bg-surface" aria-hidden="true">
      <div className="ticker-track py-1 font-data text-[11px] uppercase tracking-widest text-ink-muted">
        {/* The track doubles its content so the -50% keyframe loops seamlessly. */}
        <span className="pr-8">{line}</span>
        <span className="pr-8">{line}</span>
      </div>
    </div>
  );
}
