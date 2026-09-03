import { Mark } from "../marks.js";

// The numbered/torii section head with crop ticks (REFERENCE-DESIGN §4 shell grammar):
// required rhythm, not optional polish. The number is editorial mono, the torii is the
// owned Proof League mark, and the 1px rule carries the grid.
export function SectionHead({ number, title, accent }: { number: string; title: string; accent?: string }) {
  return (
    <header className="crop-ticks mb-8 border-b border-rule pb-3">
      <div className="flex items-baseline gap-3">
        <span className="font-data text-xs text-ink-muted">{number}</span>
        <span className="text-ink-muted">
          <Mark id="proof-league" size={14} />
        </span>
        <h2 className="font-display text-xl font-bold tracking-tight">{title}</h2>
        {accent === undefined ? null : (
          <span className="editorial-accent hidden text-sm text-ink-muted sm:inline">{accent}</span>
        )}
      </div>
    </header>
  );
}
