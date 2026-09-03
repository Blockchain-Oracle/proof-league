"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useOverlay } from "../overlay.js";

// The five jobs, one vocabulary on both shells (AD-22, UX-DR4/10): desktop header links
// and the mobile safe-area bottom bar render from this single list, so no job can ever
// be desktop-only or hidden on a phone.
export const NAV_JOBS = [
  { href: "/markets", label: "Markets" },
  { href: "/reels", label: "Reels" },
  { href: "/create", label: "Create" },
  { href: "/league", label: "League" },
  { href: "/record", label: "Record" },
] as const;

const isActive = (pathname: string, href: string): boolean =>
  pathname === href || pathname.startsWith(`${href}/`);

export function HeaderNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
      {NAV_JOBS.map((job) => (
        <Link
          key={job.href}
          href={job.href}
          aria-current={isActive(pathname, job.href) ? "page" : undefined}
          className={`px-3 py-1.5 font-display text-sm font-semibold ${
            isActive(pathname, job.href) ? "text-brand" : "text-ink-muted hover:text-ink"
          }`}
        >
          {job.label}
        </Link>
      ))}
    </nav>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Primary"
      className="safe-bottom fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-rule bg-surface md:hidden"
    >
      {NAV_JOBS.map((job) => (
        <Link
          key={job.href}
          href={job.href}
          aria-current={isActive(pathname, job.href) ? "page" : undefined}
          className={`flex min-h-11 items-center justify-center py-2 font-display text-xs font-semibold ${
            isActive(pathname, job.href) ? "text-brand" : "text-ink-muted"
          }`}
        >
          {job.label}
        </Link>
      ))}
    </nav>
  );
}

/// "More" and account live behind the ONE overlay coordinator: opening either from
/// anywhere hands off any open sheet instead of stacking (§10 overlay hierarchy).
export function MoreButton() {
  const overlay = useOverlay();
  return (
    <button
      type="button"
      onClick={() =>
        overlay.openSheet(
          "More",
          <ul className="space-y-3 font-body text-sm text-ink-muted">
            <li>Transparency, Activity and Settings arrive with their stories.</li>
            <li>Every settled result will link its on-chain proof here.</li>
          </ul>,
        )
      }
      className="px-3 py-1.5 font-display text-sm font-semibold text-ink-muted hover:text-ink"
    >
      More
    </button>
  );
}

export function AccountButton() {
  const overlay = useOverlay();
  return (
    <button
      type="button"
      onClick={() =>
        overlay.openSheet(
          "Account",
          <p className="font-body text-sm text-ink-muted">
            Sign-in opens with the account stories. Picks are free points and never money.
          </p>,
        )
      }
      className="inline-flex h-8 items-center border border-rule px-2.5 font-data text-[11px] uppercase tracking-widest text-ink-muted hover:text-ink"
    >
      Account
    </button>
  );
}
