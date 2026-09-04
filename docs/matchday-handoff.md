# Matchday handoff: the web app rebuilt on "The Deal II"

Written 2026-09-04. The reference is the designer's canvas `Territory 01: Matchday`,
file `Proof League - The Deal v2.dc.html` (v1 superseded wherever they differ). Authority
order: Abu's instructions > v2 canvas > v1 where v2 is silent > chain truth > Masayume /
Yosuku for flows only > repo laws. Sanctioned deviations, and only these: real protocol
and chain marks in the crest boxes, and the Masayume flows drawn in v2's language.

`pnpm check` is green (lint, raw lines, ui grammar, types, secrets, overclaim). Nothing is
committed; the working tree holds the whole rebuild.

## Parity ledger

### Exact (built as drawn)

- Tokens: ground, felt with room glow per family, hatch, inset shadow, brass rail, gold ramp
  and foil, stock and well, inks, felt text ramp, family colors, result colors, chip
  gradients, seat backs, card back, bottom bar, shadows, radii, the four faces, every
  keyframe and easing. `apps/web/app/globals.css`, `app/layout.tsx` (next/font).
- The table: brass rail with beat plate, streak medallion, avatar tile; seats arc that
  flips at TABLE; card stage with pointer tilt and 3D flip; gauge (5 rows, pips, black
  tab, needle travel over 1.8 s); windows (target block + five sealed windows); call row
  and three clocks; card back; SEALED / CORRECT / MISS stamps; slab with glass and gold
  foil following the pointer; the hand with LIVE / REPLAY / NEXT / CONCEPT chips and the
  dashed "in the deck" back; the spot with 10 / 25 / 50 stacks and CLEAR; lamps, beats,
  tally, LOCK IT IN ladder and its note; ceremony dimmer. `components/table/*`,
  `components/card/*`.
- Phone frame: status row, header with medallion and rack, seats strip, compact card,
  lamps list, chip rail, bottom bar with the PLAY disc.
- DECK: eight card types with silhouettes and status pills; SHELF: slabs with foils and
  notes; both in the drawn sizes and copy.

### Adapted (same promise, real data behind it)

- Seats = other players' committed Picks on the Market (`lib/table-data.ts`), face down
  until proof; fewer than five shows dashed empties.
- Bands, edges, words, pips: from `MarketView.boundaries`, the family registry and the 12
  measured Lido reports dated 2026-09-03 (`components/card/bands.ts`). Pips are history,
  labelled as such.
- Lamps from `transparency_observations` (a resolution lights all three); tally from
  committed counts only after proof; beats from `scores` and `season_standings`.
- Rack = today's remaining allowance from intake; the pot sum is the composer's stake.
- Serial = `cardSerialOf`; stage = `deriveCardStage`; phase strip derived, not stored.
- Block Draw clocks: Sepolia head and `getRoundConfig` (`lib/sepolia.ts`).
- Crests: Lido drop, Ethereum diamond, Creditcoin mark, Uniswap unicorn, Aave ghost with
  provenance comments (`components/marks.tsx`, `components/marks/brand-paths.ts`).

### Additive (Masayume / Yosuku flows, drawn in v2)

- First run: five stock-card screens, key `pl.tutorialSeen`, Skip everywhere, closes on
  connect. `components/onboarding/first-run.tsx`.
- One-time "You're at the table" card on first connect, 8 s. `onboarding/seated-card.tsx`.
- League Guide: dock with draining ring (key-free), teaser bubbles 3.5 / 4.8 / 4.5 s ×3,
  drawer through the shared overlay, pinned meter (clocks + lamps), typewriter 24 ms,
  follow-up chips with the sit-out branch first, action card deep-linking
  `/play?m=&band=` (never signs). Server route `app/api/guide/route.ts` on Claude Opus 5
  through `@anthropic-ai/sdk` with a structured reply; the snapshot is the card as
  printed (`lib/guide-snapshot.ts`); no key = a note in the thread naming
  `ANTHROPIC_API_KEY`.
- Share ladder (Web Share with files, else download + X intent, toast), slab PNG at
  1200×1500 and OG at 1200×630 (`app/api/cards/image/route.tsx`), recipient page
  `/c/[marketId]/[player]/[nonce]`.
- TELL ME AT REVEAL (device-local Notification rule), proof sheet (three levels),
  settings sheet (SFX slider that demos itself, haptics buzz-on, motion three-state),
  synthesised sounds and the haptic ladder, LEAGUE with podium / field / YouBar,
  MORE drawer, how-it-works, status, nothing 404s (redirects + `?note=moved`).

### Blocked (evidence missing; nothing pretends)

- Explicit publish (`card_publications`): committed Picks are public data already, so
  the back's PRIVATE UNTIL YOU PUBLISH is honest before commit and the recipient page
  serves committed cards only. A signed publish message needs a class-2 table.
- Table talk (Takes), Warm-up replay, Duel, Rooms: not built; not shown anywhere.
- Challenges, Player edge: listed in MORE as "not connected yet" with their gate.

## Environment the web app now wants

- `ANTHROPIC_API_KEY` (server only) for the Guide's reads. Without it the Guide's meter
  and dock work and every read returns the no-provider note.
- `NEXT_PUBLIC_SITE_URL` for share links and OG metadata (defaults to localhost:3200).

## Retired

`shell/header.tsx`, `nav.tsx`, `ticker.tsx`, `section-head.tsx`, `theme-toggle.tsx`,
`market-card.tsx`, `market/option-rows.tsx`, `reel-keys.tsx`, `market/composer.tsx`,
`composer-draft.tsx`, `record/prediction-card.tsx`, `market/market-receipt.tsx`, the
reels / create / markets / record pages and the old landing page; Sora / Inter / Noto.

## Verified

Desktop 1440×1000 and phone 390×844 against the v2 frames (table, sealed back, proven,
slabbed with foil and beats, deck, shelf, first run, guide drawer), reduced motion, the
three seeded verification rows deleted from the local database afterwards.
