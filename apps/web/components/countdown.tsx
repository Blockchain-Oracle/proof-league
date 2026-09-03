"use client";

import { useEffect, useState } from "react";

// A countdown to a chain deadline, ticking against CHAIN time (AD-10). The component
// renders the absolute UTC string it was given until it has heard from /time, which is
// both the server-identical first paint (no hydration mismatch) and the honest fallback:
// if the clock endpoint never answers, the visitor keeps a time they can act on instead
// of a relative number derived from a device clock nobody checked.
//
// Documented Client boundary (AD-23): a live clock is behaviour, and the rest of the
// board stays a Server Component around it.

const SYNC_INTERVAL_MS = 60_000;

const remainingLabel = (seconds: number): string => {
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
};

export function Countdown({
  targetSec,
  absolute,
  passed,
}: {
  targetSec: number;
  /// What to show before the chain clock is known, and if it never becomes known.
  absolute: string;
  /// What the moment reads as once it is behind us.
  passed: string;
}) {
  const [offsetMs, setOffsetMs] = useState<number | undefined>(undefined);
  const [nowMs, setNowMs] = useState(0);

  useEffect(() => {
    let alive = true;
    const sync = async (): Promise<void> => {
      try {
        const response = await fetch("/time", { cache: "no-store" });
        const clock: unknown = await response.json();
        const chainNowSec = (clock as { chainNowSec?: unknown }).chainNowSec;
        if (alive && typeof chainNowSec === "number") {
          setOffsetMs(chainNowSec * 1000 - Date.now());
          setNowMs(Date.now());
        }
      } catch {
        // Keep rendering the absolute time: a countdown we cannot anchor is worse.
      }
    };
    void sync();
    const tick = setInterval(() => setNowMs(Date.now()), 1_000);
    const resync = setInterval(() => void sync(), SYNC_INTERVAL_MS);
    return () => {
      alive = false;
      clearInterval(tick);
      clearInterval(resync);
    };
  }, []);

  if (offsetMs === undefined) return <>{absolute}</>;
  const remaining = Math.round((targetSec * 1000 - (nowMs + offsetMs)) / 1000);
  if (remaining <= 0) return <>{passed}</>;
  return (
    <time dateTime={new Date(targetSec * 1000).toISOString()} title={absolute}>
      in {remainingLabel(remaining)}
    </time>
  );
}
