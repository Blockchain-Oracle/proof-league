// THE route registry (CONVENTIONS section 3, AD-22). The brass rail, the mobile bottom
// bar, the More drawer and every active-state decision read this one table, so no
// destination can exist on a laptop and not on a phone.
//
// The four jobs and their words are the design's (frame A rail: PLAY DECK LEAGUE SHELF;
// frame B bar adds MORE). Old paths keep working as redirects, never as 404s.

export type RouteEntry =
  | { readonly href: string; readonly label: string; readonly blurb: string; readonly status: "live" }
  | { readonly label: string; readonly blurb: string; readonly status: "planned"; readonly gate: string };

export const PRIMARY_JOBS = [
  { href: "/play", label: "PLAY", blurb: "The table: today's deal, your card, the spot.", status: "live" },
  { href: "/deck", label: "DECK", blurb: "Every card in play, and the eight card types.", status: "live" },
  { href: "/league", label: "LEAGUE", blurb: "Season standings from the chain's own keys.", status: "live" },
  { href: "/shelf", label: "SHELF", blurb: "Your slabs, hits and misses alike.", status: "live" },
] as const satisfies readonly RouteEntry[];

/// Everything reachable that is not a primary job. What exists is a link; what does not
/// exist yet says exactly what it is waiting on, because a link that goes nowhere is the
/// inert control the inventory bans.
export const MORE_ROUTES: readonly RouteEntry[] = [
  { href: "/how-it-works", label: "How it works", blurb: "Four steps, the scoring rule, the seven checks.", status: "live" },
  { href: "/proof", label: "Proof", blurb: "Every settlement to date with its lamps and its transactions.", status: "live" },
  { href: "/status", label: "Status", blurb: "What the table can read right now, checked at request time.", status: "live" },
  {
    label: "Challenges",
    blurb: "Deal the same card to a friend and compare slabs.",
    gate: "Waiting on the publication route, so a shared card resolves to a seat at the table.",
    status: "planned",
  },
  {
    label: "Player edge",
    blurb: "What pays, what costs, and when you call best, from your own record.",
    gate: "Waiting on enough settled cards to say anything true.",
    status: "planned",
  },
];

/// Old homes redirect here rather than 404 (Masayume's routing law: nothing 404s).
export const MOVED: Record<string, string> = {
  "/markets": "/deck",
  "/reels": "/play",
  "/record": "/shelf",
  "/create": "/play",
  "/transparency": "/proof",
};

export const isActiveRoute = (pathname: string, href: string): boolean =>
  pathname === href || pathname.startsWith(`${href}/`);
