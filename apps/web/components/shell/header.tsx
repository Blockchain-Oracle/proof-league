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
          <span className="font-display text-base font-bold tracking-tight">Proof League</span>
        </Link>
        <HeaderNav />
        <div className="flex items-center gap-2">
          <span className="hidden md:inline">
            <MoreButton />
          </span>
          <ThemeToggle />
          <AccountButton />
        </div>
      </div>
    </header>
  );
}
