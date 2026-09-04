"use client";

import { createContext, useContext, useMemo, useState } from "react";

// The felt under the whole product, and the one place its room glow is decided. A held
// Yield Signal card turns the room blue, a Block Draw turns it violet, anything else
// leaves the plain green (design frame A: roomGlow). Pages set the room; the felt paints it.

export type Room = "yield" | "draw" | "none";

type RoomApi = { readonly room: Room; readonly setRoom: (room: Room) => void };

const RoomContext = createContext<RoomApi>({ room: "none", setRoom: () => undefined });

export const useRoom = (): RoomApi => useContext(RoomContext);

export function Felt({ children }: { children: React.ReactNode }) {
  const [room, setRoom] = useState<Room>("none");
  const api = useMemo(() => ({ room, setRoom }), [room]);
  return (
    <RoomContext.Provider value={api}>
      <div data-room={room} className="felt relative flex min-h-dvh flex-col overflow-x-hidden">
        {children}
      </div>
    </RoomContext.Provider>
  );
}
