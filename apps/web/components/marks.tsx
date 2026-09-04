import { AAVE_GHOST, CREDITCOIN_MARK, ETH_FACETS, LIDO_DROP, LIDO_LETTERS, UNISWAP_UNICORN } from "./marks/brand-paths.js";

// The one typed mark registry (FR-35, AD-36). Supported asset, chain, protocol and
// provider identities map to a local approved SVG; players map to a deterministic
// address-derived identicon. No acronym circles, no invented glyphs, no silent reuse of
// another mark. Marks render monochrome in currentColor: the family strip paints the
// crest box in the family color, the foil paints it in the deep green ink, and the same
// geometry never changes hue on its own.
//
// Provenance record (every mark names where its geometry came from, and on what terms):
// - btc: Bitcoin currency mark geometry (public-domain community mark, monochrome).
// - eth: the Ethereum diamond from the Ethereum Foundation assets page
//   (ethereum.org/images/assets/svgs/eth-diamond-black.svg, fetched 2026-09-04). The
//   foundation publishes these for referential use; monochrome facets, opacities kept.
// - lido, lido-wordmark: the Lido drop and letters from Lido's own staking widget
//   (github.com/lidofinance/ethereum-staking-widget, assets/logo.svg, fetched
//   2026-09-04). Nominative use to name the source of the daily report.
// - creditcoin: the Creditcoin mark as published on creditcoin.org (footer mark, viewBox
//   0 0 200 200, fetched 2026-09-04). Nominative use for the chain that carries the proofs.
// - uniswap: the unicorn icon from github.com/Uniswap/brand-assets (Uniswap_icon, fetched
//   2026-09-04), governed by uniswap.org/trademark. Concept-family crest only.
// - aave: the ghost from github.com/aave/interface (public/icons/tokens/aave.svg, fetched
//   2026-09-04). Concept-family crest only.
// - x: the X letterform mark (X Corp brand, nominative referential use).
// - proof-league: the owned Proof League mark (a card with its seal).

export type MarkId =
  | "btc"
  | "eth"
  | "lido"
  | "lido-wordmark"
  | "creditcoin"
  | "uniswap"
  | "aave"
  | "x"
  | "proof-league";

type MarkShape = { readonly viewBox: string; readonly body: React.ReactNode };

const SHAPES: Record<MarkId, MarkShape> = {
  btc: {
    viewBox: "0 0 24 24",
    body: (
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
  },
  eth: {
    viewBox: "0 0 1920 1920",
    body: (
      <>
        {ETH_FACETS.map(([d, opacity]) => (
          <path key={d} d={d} fill="currentColor" opacity={opacity} />
        ))}
      </>
    ),
  },
  lido: {
    viewBox: "0 0 14 20",
    body: (
      <>
        {LIDO_DROP.map((d) => (
          <path key={d} d={d} fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
        ))}
      </>
    ),
  },
  "lido-wordmark": {
    viewBox: "0 0 89 20",
    body: (
      <>
        <path d={LIDO_LETTERS} fill="currentColor" />
        {LIDO_DROP.map((d) => (
          <path key={d} d={d} fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
        ))}
      </>
    ),
  },
  creditcoin: { viewBox: "0 0 200 200", body: <path d={CREDITCOIN_MARK} fill="currentColor" /> },
  uniswap: { viewBox: "0 0 400 434", body: <path d={UNISWAP_UNICORN} fill="currentColor" /> },
  aave: {
    viewBox: "0 0 254 254",
    body: (
      <>
        {AAVE_GHOST.map((d) => (
          <path key={d} d={d} fill="currentColor" />
        ))}
      </>
    ),
  },
  x: {
    viewBox: "0 0 24 24",
    body: (
      <path
        d="M4.5 4h4.2l4 5.4L17.5 4h2.6l-6.2 7.2L20.5 20h-4.2l-4.4-5.9L6.8 20H4.2l6.5-7.6z"
        fill="currentColor"
      />
    ),
  },
  "proof-league": {
    viewBox: "0 0 24 24",
    body: (
      <>
        <rect x="4" y="2.5" width="14" height="18" rx="3" transform="rotate(-8 11 11.5)" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="15.5" cy="16" r="5" fill="currentColor" />
        <path d="M13.2 16.1l1.6 1.5 3-3.2" fill="none" stroke="#14161B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
};

/// Marks with a non-square viewBox keep their own aspect: the caller sets the height and
/// the width follows, which is how a wordmark and a crest share one API.
const ASPECT: Partial<Record<MarkId, number>> = { lido: 14 / 20, "lido-wordmark": 89 / 20, uniswap: 400 / 434 };

export function Mark({ id, size = 20, title }: { id: MarkId; size?: number; title?: string }) {
  const shape = SHAPES[id];
  const width = Math.round(size * (ASPECT[id] ?? 1) * 100) / 100;
  return (
    <svg
      viewBox={shape.viewBox}
      width={width}
      height={size}
      role={title === undefined ? undefined : "img"}
      aria-hidden={title === undefined ? true : undefined}
    >
      {title === undefined ? null : <title>{title}</title>}
      {shape.body}
    </svg>
  );
}

/// Neutral category glyph for a missing optional mark. The CALLER must render the full
/// visible name beside it: this glyph never stands alone and never impersonates.
export function CategoryGlyph({ size = 20 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <rect x="4.5" y="4.5" width="15" height="15" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

// Identicon colors are the table's own chips and crests, so a seat looks dealt rather
// than imported: gold, yield blue, race pink, allocation teal, harvest orange.
const IDENTICON_COLORS = ["#E8B84B", "#2563C9", "#D93C7A", "#1E7F8C", "#C9722B"] as const;

/// Deterministic address-derived identicon: a 5x5 horizontally-mirrored cell grid seeded
/// from the address bytes. The same address renders the same figure everywhere, and no two
/// surfaces can disagree. Also exported as a color for the striped avatar tiles the table
/// draws beside a seat name.
export const identiconIndexOf = (address: string): number => {
  const seed = address.toLowerCase().replace(/^0x/, "");
  const byte = parseInt(seed.slice(38, 40) || "0", 16);
  return byte % IDENTICON_COLORS.length;
};
export const identiconColorOf = (address: string): string => IDENTICON_COLORS[identiconIndexOf(address)] ?? "#E8B84B";

export function PlayerMark({ address, size = 20, title }: { address: string; size?: number; title?: string }) {
  const seed = address.toLowerCase().replace(/^0x/, "");
  const byteAt = (i: number): number => parseInt(seed.slice((i * 2) % 38, ((i * 2) % 38) + 2) || "0", 16);
  const color = identiconColorOf(address);
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
