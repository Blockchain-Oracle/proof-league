import Link from "next/link";
import { Mark } from "../marks.js";
import { ThemeToggle } from "../theme-toggle.js";
import { AccountButton, HeaderNav, MoreButton } from "./nav.js";

// The one shell header (REFERENCE-DESIGN §4): 64px desktop with the five jobs + More +
// theme + account; compact 56px on mobile where the bottom navigation owns the jobs.
export function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-rule bg-canvas">
      <div className="mx-auto flex h-14 max-w-[1280px] items-center justify-between gap-4 px-6 md:h-16 md:px-8">
        <Link href="/" className="flex items-center gap-2.5 text-ink" aria-label="Proof League home">
          <Mark id="proof-league" size={22} />
          {/* The wordmark folds away under 640px so the mark, More, theme and account all
              fit at 360 without the page scrolling sideways. The link keeps its accessible
              name either way, so nothing is lost to a screen reader. */}
          <span className="hidden font-display text-base font-bold tracking-tight sm:inline">Proof League</span>
        </Link>
        <HeaderNav />
        <div className="flex items-center gap-2">
          {/* More is NOT desktop-only. The bottom bar carries the five primary jobs, so on a
              phone this control is the only route to Transparency and to everything else
              that is not a primary job. Hiding it below md left mobile with no way to reach
              them at all, which is the desktop-only navigation the inventory forbids
              outright (law 9). Caught at 360px in the browser, not in review. */}
          <MoreButton />
          <ThemeToggle />
          <AccountButton />
        </div>
      </div>
    </header>
  );
}
