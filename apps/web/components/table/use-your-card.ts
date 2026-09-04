"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CardResolutionFacts, CardStage } from "@proof-league/shared";
import { useSigningProvider } from "../../features/auth/adapter.js";
import type { AcceptedCall } from "../../features/picks/use-pick-composer.js";
import type { MarketView } from "../../lib/market-view.js";

// The player's own Card on the held Market: the live Call from /api/cards (drafts and
// committed leaves alike), or the Call the composer just had accepted before the poll has
// caught up. Also owns the two facts that live only on this device: whether the reveal
// has been watched, and whether the player asked to be told at reveal.

export type YourCard = {
  readonly player: string;
  readonly nonce: number;
  readonly optionIndex: number;
  readonly stake: number;
  readonly published: boolean;
  /// Committed at lock (in the pinned set), which is what makes the Card public data.
  readonly committed: boolean;
  readonly stage: CardStage | undefined;
  readonly resolution: CardResolutionFacts | undefined;
  readonly revealed: boolean;
  readonly markRevealed: () => void;
  readonly watch: () => void;
};

type CardWire = {
  readonly marketId: string;
  readonly nonce: number;
  readonly optionIndex: number;
  readonly stake: number;
  readonly live: boolean;
  readonly committed: boolean;
  readonly stage: CardStage;
  readonly view: MarketView;
};

const POLL_MS = 15_000;
const REVEALED_KEY = "pl.revealed.v1";
const WATCH_KEY = "pl.watch.v1";

const readSet = (key: string): Set<string> => {
  try {
    return new Set(JSON.parse(localStorage.getItem(key) ?? "[]") as string[]);
  } catch {
    return new Set();
  }
};
const writeSet = (key: string, set: Set<string>): void => {
  try {
    localStorage.setItem(key, JSON.stringify([...set]));
  } catch {
    // Storage may be blocked; the reveal simply plays again next time, which is harmless.
  }
};

export const useYourCard = (marketId: string, accepted: AcceptedCall | undefined): YourCard | undefined => {
  const provider = useSigningProvider();
  const address = provider.kind === "connected" ? provider.address : undefined;
  const [wire, setWire] = useState<CardWire | undefined>(undefined);
  const [revealed, setRevealed] = useState(false);
  const serial = wire === undefined ? (accepted === undefined ? undefined : `${marketId}-${accepted.nonce}`) : `${marketId}-${wire.nonce}`;

  useEffect(() => {
    if (address === undefined) {
      setWire(undefined);
      return;
    }
    let alive = true;
    const load = async () => {
      try {
        const response = await fetch(`/api/cards?player=${address}`, { cache: "no-store" });
        if (!response.ok) return;
        const body = (await response.json()) as { cards: CardWire[] };
        const mine = body.cards.find((card) => card.marketId === marketId && card.live);
        if (alive) setWire(mine);
      } catch {
        // Keep the last card on screen; the next poll tries again.
      }
    };
    void load();
    const timer = setInterval(() => void load(), POLL_MS);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [address, marketId, accepted]);

  useEffect(() => {
    if (serial !== undefined) setRevealed(readSet(REVEALED_KEY).has(serial));
  }, [serial]);

  const markRevealed = useCallback(() => {
    if (serial === undefined) return;
    const set = readSet(REVEALED_KEY);
    set.add(serial);
    writeSet(REVEALED_KEY, set);
    setRevealed(true);
  }, [serial]);

  const watch = useCallback(() => {
    if (serial === undefined) return;
    const set = readSet(WATCH_KEY);
    set.add(serial);
    writeSet(WATCH_KEY, set);
    if (typeof Notification !== "undefined" && Notification.permission === "default") void Notification.requestPermission();
  }, [serial]);

  return useMemo(() => {
    if (address === undefined) return undefined;
    if (wire !== undefined) {
      const stage = wire.stage;
      const resolution: CardResolutionFacts | undefined =
        stage.kind === "correct" || stage.kind === "incorrect"
          ? { outcome: stage.outcome, score: stage.score }
          : stage.kind === "scoring"
            ? { outcome: stage.outcome }
            : undefined;
      return { player: address, nonce: wire.nonce, optionIndex: wire.optionIndex, stake: wire.stake, published: false, committed: wire.committed, stage, resolution, revealed, markRevealed, watch };
    }
    if (accepted !== undefined) {
      return { player: address, nonce: accepted.nonce, optionIndex: accepted.optionIndex, stake: accepted.stake, published: false, committed: false, stage: undefined, resolution: undefined, revealed: false, markRevealed, watch };
    }
    return undefined;
  }, [address, wire, accepted, revealed, markRevealed, watch]);
};
