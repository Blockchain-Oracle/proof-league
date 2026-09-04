"use client";

import Link from "next/link";
import { useSigningProvider } from "../../features/auth/adapter.js";
import type { StandingRow } from "../../lib/league-data.js";
import { AvatarTile, shortAddress } from "../shell/account.js";

// The sticky bar for your own seat (Masayume's YouBar): always present once a wallet is
// connected, above the phone's bottom bar. Ranked shows the seat and the share of the
// board above it; unranked says exactly why (no settled card yet), never a zero.

export function YouBar({ rows }: { rows: readonly StandingRow[] }) {
  const provider = useSigningProvider();
  if (provider.kind !== "connected") return null;
  const mine = rows.find((row) => row.player.toLowerCase() === provider.address.toLowerCase());
  const top = mine === undefined ? undefined : Math.max(1, Math.round((mine.rank / rows.length) * 100));
  return (
    <div className="safe-bottom fixed inset-x-0 bottom-16 z-20 border-t-2 border-ink-green bg-gold px-4 py-3 md:bottom-0 md:px-10">
      <div className="mx-auto flex max-w-[1100px] flex-wrap items-center gap-x-5 gap-y-1 text-ink-green">
        <AvatarTile address={provider.address} className="h-[26px] w-[26px] rounded-[7px]" />
        <span className="font-data text-[10.5px] tracking-[.1em]">YOU · {shortAddress(provider.address)}</span>
        <span className="font-display text-[15px] font-extrabold tracking-[-.02em]">
          {mine === undefined ? "No settled card yet" : `Seat #${mine.rank} of ${rows.length}`}
        </span>
        {mine === undefined ? null : (
          <>
            <span className="font-data text-[10px] tracking-[.12em]">TOP {top}%</span>
            <span className="font-data text-[10px] tracking-[.12em]">{mine.seasonPoints} PTS · STREAK {mine.streak}</span>
          </>
        )}
        <Link href="/shelf" className="ml-auto font-data text-[10px] tracking-[.14em] underline">
          YOUR SHELF
        </Link>
      </div>
    </div>
  );
}
