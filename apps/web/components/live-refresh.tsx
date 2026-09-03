"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Rows update in place without a reload (Story 3.4): a poll asks the server to re-render
// this route's Server Components and React reconciles the result, so state chips and
// countdowns change without the page jumping or losing scroll.
//
// The AC's primary path is a Supabase Realtime Broadcast subscription, which needs the
// hosted Supabase project that does not exist yet (docs/operations-handoff.md item 2):
// the local stack the projection currently runs on is not reachable from a browser. So
// this is the AC's named fallback, and it meets the 10 second freshness bound on its own
// at a 5 second period. When the hosted project lands, a channel subscription replaces
// the interval here and nothing else changes.
//
// Polling stops while the tab is hidden and resumes on return, so a backgrounded board
// is not quietly re-rendering for hours.

export function LiveRefresh({ intervalMs = 5_000 }: { intervalMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const refresh = (): void => {
      if (!document.hidden) router.refresh();
    };
    const timer = setInterval(refresh, intervalMs);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [intervalMs, router]);
  return null;
}
