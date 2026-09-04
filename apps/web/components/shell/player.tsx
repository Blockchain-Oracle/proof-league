"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useSigningProvider } from "../../features/auth/adapter.js";

// The player's standing, shared by the rail (medallion, rack line), the spot (chips left)
// and the shelf (the one number). Read from /api/player once a wallet is connected and
// re-read on a slow poll; never guessed. Loading, signed-out and "never recorded" are
// distinct from zero, which is why the shape carries `kind`.

export type PlayerStanding = {
  readonly address: string;
  /// Points left in today's rack, after every accepted Call of the day.
  readonly rackLeft: number;
  readonly rackTotal: number;
  readonly streak: number;
  /// Rank on the season board, or undefined while unranked (never zero).
  readonly rank: number | undefined;
  readonly seasonPoints: number;
  readonly dayFinal: boolean;
};

export type PlayerState =
  | { readonly kind: "loading" }
  | { readonly kind: "signed-out" }
  | { readonly kind: "ready"; readonly standing: PlayerStanding };

type PlayerApi = {
  readonly state: PlayerState;
  /// The word on the beat plate. The table sets it; every other page shows the default.
  readonly beat: string;
  readonly setBeat: (word: string) => void;
  /// Playable cards on the table, for the PLAY disc's sub-label.
  readonly cards: number;
  readonly setCards: (count: number) => void;
  readonly refresh: () => void;
};

const PlayerContext = createContext<PlayerApi | undefined>(undefined);

export const usePlayer = (): PlayerApi => {
  const api = useContext(PlayerContext);
  if (api === undefined) throw new Error("usePlayer outside PlayerProvider");
  return api;
};

const POLL_MS = 60_000;

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const provider = useSigningProvider();
  const address = provider.kind === "connected" ? provider.address : undefined;
  const [state, setState] = useState<PlayerState>({ kind: "loading" });
  const [beat, setBeat] = useState("TABLE ONE");
  const [cards, setCards] = useState(0);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (provider.kind === "loading") return;
    if (address === undefined) {
      setState({ kind: "signed-out" });
      return;
    }
    let alive = true;
    const load = async () => {
      try {
        const response = await fetch(`/api/player?player=${address}`, { cache: "no-store" });
        if (!response.ok) return;
        const standing = (await response.json()) as PlayerStanding;
        if (alive) setState({ kind: "ready", standing });
      } catch {
        // A failed read keeps the last standing on screen; the next poll tries again.
      }
    };
    void load();
    const timer = setInterval(() => void load(), POLL_MS);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [address, provider.kind, tick]);

  const api = useMemo(
    () => ({ state, beat, setBeat, cards, setCards, refresh: () => setTick((n) => n + 1) }),
    [state, beat, cards],
  );
  return <PlayerContext.Provider value={api}>{children}</PlayerContext.Provider>;
}
