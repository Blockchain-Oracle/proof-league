// THE route registry (CONVENTIONS section 3, AD-22, UX-DR4). Desktop navigation, the
// mobile bottom bar, the More drawer and every active-state decision read this one table.
// Two lists that drift is how a product ends up with a destination that exists on a laptop
// and not on a phone, which the inventory forbids outright.
//
// The registry also carries what does NOT exist yet, with the exact thing each entry is
// waiting on. That is deliberate: "Transparency, Activity and Settings arrive with their
// stories" told a visitor nothing they could act on, while a named gate is a fact. An
// unbuilt route is listed as text, never as a link, because a link that goes nowhere is
// the inert control the handoff bans.

/// A planned entry without a gate is unrepresentable: the union forces whoever adds one to
/// say what it is waiting on, which is the only thing that makes listing it honest.
export type RouteEntry =
  | { readonly href: string; readonly label: string; readonly blurb: string; readonly status: "live" }
  | { readonly label: string; readonly blurb: string; readonly status: "planned"; readonly gate: string };

/// The primary jobs, on both shells, in this order.
///
/// The 2026-09-03 rebaseline moves Games into this list and Create out of it. That swap
/// belongs to the slice that makes Games real: a Games entry whose destination is a grid of
/// disabled cards is exactly the decorative shell the rebaseline tells the implementer not
/// to open with. Until then Games sits below with its gate, where it is honest.
export const PRIMARY_JOBS = [
  { href: "/markets", label: "Markets", blurb: "Every admitted question, grouped by state.", status: "live" },
  { href: "/reels", label: "Reels", blurb: "One Market at a time, for moving fast.", status: "live" },
  { href: "/create", label: "Create", blurb: "Package an admitted Market as a Challenge.", status: "live" },
  { href: "/league", label: "League", blurb: "Season standings from the chain's own keys.", status: "live" },
  { href: "/record", label: "Record", blurb: "Your Cards, hits and misses alike.", status: "live" },
] as const satisfies readonly RouteEntry[];

/// Everything reachable that is not a primary job. The inventory requires More to be
/// complete rather than a shortened marketing list, so this is the whole remainder.
export const MORE_ROUTES: readonly RouteEntry[] = [
  {
    href: "/transparency",
    label: "How settlement works",
    blurb: "The pipeline in plain words, and every settlement to date with its timestamps.",
    status: "live",
  },
  {
    label: "Games",
    blurb: "Daily Deck, Band Call and Practice over the same admitted Markets and the same composer.",
    gate: "Waiting on the Card lifecycle to reach a settled result, so a mode card can report real readiness instead of a promise.",
    status: "planned",
  },
  {
    label: "Activity",
    blurb: "Every operation you started, its durable id and its last known stage.",
    gate: "Waiting on operations that outlive one page: publication and settlement watching.",
    status: "planned",
  },
  {
    label: "Settings",
    blurb: "Theme, sound and motion, session, and what this product can and cannot recover.",
    gate: "Waiting on sign-in, since most of it describes an account.",
    status: "planned",
  },
  {
    label: "Public player records",
    blurb: "Anyone's Streak, points and complete Card history, uncurated.",
    gate: "Waiting on the first scored Pick. There is nothing to show a visitor yet, and a seeded profile would be a fake one.",
    status: "planned",
  },
];

export const isActiveRoute = (pathname: string, href: string): boolean =>
  pathname === href || pathname.startsWith(`${href}/`);
