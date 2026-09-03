// The one typed mark registry (FR-35, AD-36, REFERENCE-DESIGN §10): supported asset,
// chain, protocol and provider identities map to a local owned/approved SVG; players map
// to a deterministic address-derived identicon. No acronym circles, no invented glyphs,
// no silent reuse of another mark. Marks render monochrome in currentColor (the
// sanctioned theme adaptation: an approved monochrome variant, never a redraw).
//
// Provenance record (§7 "record every mark's source"):
// - btc: Bitcoin currency mark geometry (public-domain community mark, monochrome).
// - eth: Ethereum diamond geometry (Ethereum Foundation mark guidelines permit
//   referential use; monochrome variant).
// - creditcoin: monochrome rendering of the Creditcoin segmented ring mark
//   (referential use for the protocol that carries the proofs).
// - x: the X letterform mark (X Corp brand, nominative referential use).
// - proof-league: the owned Proof League torii mark (our own asset; also the Guide's).

export type MarkId = "btc" | "eth" | "creditcoin" | "x" | "proof-league";

const PATHS: Record<MarkId, React.ReactNode> = {
  btc: (
    <>
      <circle cx="12" cy="12" r="10.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M9.2 6.8h4.1a2.35 2.35 0 0 1 .6 4.62A2.5 2.5 0 0 1 13.6 16.4H9.2M10.4 6.8v9.6M10 6.8V5.2m2.6 1.6V5.2M10 18.4v-1.6m2.6 1.6v-1.6M9.2 11.5h4.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </>
  ),
  eth: (
    <>
      <path d="M12 2.6 5.8 12.2 12 15.9l6.2-3.7z" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5.8 13.7 12 21.4l6.2-7.7L12 17.4z" fill="none" stroke="currentColor" strokeWidth="1.4" />
    </>
  ),
  creditcoin: (
    <>
      <path d="M19.4 7.4A8.6 8.6 0 1 0 19.4 16.6" fill="none" stroke="currentColor" strokeWidth="2.2" />
      <path d="M16.6 9.4a5.2 5.2 0 1 0 0 5.2" fill="none" stroke="currentColor" strokeWidth="2.2" />
    </>
  ),
  x: (
    <path
      d="M4.5 4h4.2l4 5.4L17.5 4h2.6l-6.2 7.2L20.5 20h-4.2l-4.4-5.9L6.8 20H4.2l6.5-7.6z"
      fill="currentColor"
    />
  ),
  "proof-league": (
    <>
      <path d="M3.5 6.2c5.7-1.6 11.3-1.6 17 0M5 9h14" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M7 6v14M17 6v14M7 14h10" fill="none" stroke="currentColor" strokeWidth="1.7" />
    </>
  ),
};

export function Mark({ id, size = 20, title }: { id: MarkId; size?: number; title?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      role={title === undefined ? undefined : "img"}
      aria-hidden={title === undefined ? true : undefined}
    >
      {title === undefined ? null : <title>{title}</title>}
      {PATHS[id]}
    </svg>
  );
}

/// Neutral category glyph for a missing optional mark. The CALLER must render the full
/// visible name beside it (§10) — this glyph never stands alone and never impersonates.
export function CategoryGlyph({ size = 20 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <rect x="4.5" y="4.5" width="15" height="15" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

// On-palette identicon colors: deterministic, token-derived, theme-stable enough to
// stay recognizable (the identity IS the pattern, not the hue).
const IDENTICON_COLORS = ["#d93e1f", "#2e6b4f", "#d69a3a", "#5e574b"] as const;

/// Deterministic address-derived identicon (§7: never invented portraits or letter
/// circles). A 5x5 horizontally-mirrored cell grid seeded from the address bytes: the
/// same address renders the same figure everywhere, and no two surfaces can disagree.
export function PlayerMark({ address, size = 20, title }: { address: string; size?: number; title?: string }) {
  const seed = address.toLowerCase().replace(/^0x/, "");
  const byteAt = (i: number): number => parseInt(seed.slice((i * 2) % 38, ((i * 2) % 38) + 2) || "0", 16);
  const color = IDENTICON_COLORS[byteAt(19) % IDENTICON_COLORS.length];
  const cells: { x: number; y: number }[] = [];
  for (let y = 0; y < 5; y++) {
    for (let x = 0; x < 3; x++) {
      if (byteAt(y * 3 + x) % 2 === 0) {
        cells.push({ x, y });
        if (x < 2) cells.push({ x: 4 - x, y });
      }
    }
  }
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      role={title === undefined ? undefined : "img"}
      aria-hidden={title === undefined ? true : undefined}
    >
      {title === undefined ? null : <title>{title}</title>}
      <rect x="1" y="1" width="22" height="22" fill="none" stroke="currentColor" strokeOpacity="0.25" />
      {cells.map((cell) => (
        <rect key={`${cell.x}-${cell.y}`} x={2.5 + cell.x * 3.8} y={2.5 + cell.y * 3.8} width="3.8" height="3.8" fill={color} />
      ))}
    </svg>
  );
}
