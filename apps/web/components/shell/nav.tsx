"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useOverlay } from "../overlay.js";
import { PlayerMark } from "../marks.js";
import { useSigningProvider } from "../../features/auth/adapter.js";
import { MORE_ROUTES, PRIMARY_JOBS, isActiveRoute } from "./navigation.js";

// Both shells, from the one registry (navigation.ts). The desktop header links and the
// mobile safe-area bottom bar map over the same array, so no job can be desktop-only and
// no phone can be missing a destination a laptop has.

const JOB = "font-display font-semibold";

export function HeaderNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
      {PRIMARY_JOBS.map((job) => (
        <Link
          key={job.href}
          href={job.href}
          aria-current={isActiveRoute(pathname, job.href) ? "page" : undefined}
          className={`px-3 py-1.5 text-sm ${JOB} ${
            isActiveRoute(pathname, job.href) ? "text-brand" : "text-ink-muted hover:text-ink"
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
      {PRIMARY_JOBS.map((job) => (
        <Link
          key={job.href}
          href={job.href}
          aria-current={isActiveRoute(pathname, job.href) ? "page" : undefined}
          className={`flex min-h-11 items-center justify-center py-2 text-xs ${JOB} ${
            isActiveRoute(pathname, job.href) ? "text-brand" : "text-ink-muted"
          }`}
        >
          {job.label}
        </Link>
      ))}
    </nav>
  );
}

/// The complete remainder of the product, not a shortened marketing list. What exists is a
/// link; what does not exist is text with the exact thing it is waiting on, because a link
/// that goes nowhere is worse than an honest sentence about why it is not there yet.
function MoreSheet() {
  const live = MORE_ROUTES.filter((route) => route.status === "live");
  const planned = MORE_ROUTES.filter((route) => route.status === "planned");
  return (
    <div className="space-y-6">
      <ul className="space-y-4">
        {live.map((route) => (
          <li key={route.label}>
            <Link href={route.href} className="font-display text-sm font-bold hover:text-brand">
              {route.label}
            </Link>
            <p className="mt-1 font-body text-sm text-ink-muted">{route.blurb}</p>
          </li>
        ))}
      </ul>
      <div className="border-t border-rule pt-4">
        <p className="font-data text-[11px] uppercase tracking-widest text-ink-muted">Not built yet</p>
        <ul className="mt-3 space-y-4">
          {planned.map((route) => (
            <li key={route.label}>
              <p className="font-display text-sm font-bold text-ink-muted">{route.label}</p>
              <p className="mt-1 font-body text-sm text-ink-muted">{route.blurb}</p>
              <p className="mt-1 font-body text-xs text-ink-muted">{route.gate}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function MoreButton() {
  const overlay = useOverlay();
  return (
    <button
      type="button"
      onClick={() => overlay.openSheet("More", <MoreSheet />)}
      className={`px-3 py-1.5 text-sm ${JOB} text-ink-muted hover:text-ink`}
    >
      More
    </button>
  );
}

/// The account control tells the truth about sign-in from the one signing seam, rather than
/// describing a story that has not shipped. Three states, three different sentences: a
/// deployment with no signer names its gate, a browser that has one offers to connect, and
/// a connected player sees the address their Picks are signed as.
function AccountSheet() {
  const provider = useSigningProvider();
  if (provider.kind === "connected") {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <PlayerMark address={provider.address} size={20} title={provider.address} />
          <span className="font-data text-xs">{provider.address}</span>
        </div>
        <p className="font-body text-sm text-ink-muted">
          Picks you make are signed as this address, and it is your identity everywhere in the league.
          Points are free and no Pick moves any funds.
        </p>
      </div>
    );
  }
  if (provider.kind === "available") {
    return (
      <div className="space-y-3">
        <p className="font-body text-sm text-ink-muted">
          You can sign Picks with the {provider.label} this browser already has. Sign-in without any
          extension is the product path and arrives with its own story.
        </p>
        <button
          type="button"
          onClick={() => void provider.connect()}
          className="min-h-11 bg-brand px-4 py-2 font-display text-sm font-bold text-white hover:bg-brand-deep"
        >
          Connect a {provider.label}
        </button>
      </div>
    );
  }
  return (
    <p className="font-body text-sm text-ink-muted">
      {provider.kind === "loading"
        ? "Checking what this browser can sign with."
        : `${provider.gate} You can read every Market, every option and every proof without signing in.`}
    </p>
  );
}

export function AccountButton() {
  const overlay = useOverlay();
  const provider = useSigningProvider();
  const label =
    provider.kind === "connected" ? `${provider.address.slice(0, 6)}...${provider.address.slice(-4)}` : "Account";
  return (
    <button
      type="button"
      onClick={() => overlay.openSheet("Account", <AccountSheet />)}
      className="inline-flex min-h-8 items-center gap-2 border border-rule px-2.5 font-data text-[11px] uppercase tracking-widest text-ink-muted hover:text-ink"
    >
      {provider.kind === "connected" ? <PlayerMark address={provider.address} size={14} /> : null}
      {label}
    </button>
  );
}
