"use client";

import { useOverlay } from "../overlay.js";
import { identiconIndexOf } from "../marks.js";
import { useSigningProvider } from "../../features/auth/adapter.js";
import { usePlayer } from "./player.js";

// The seat control on the rail: a striped avatar tile plus the address, opening the one
// account sheet. Three truthful states from the one signing seam: a deployment with no
// signer names its gate, a browser that has one offers to take a seat, a connected
// player sees the address every Call is signed as.

import { shortAddress } from "../../lib/format.js";
export { shortAddress };

/// The tile's second stripe is the identicon color of the address (one of five table
/// colors, so two seats rarely wear the same tile). A signed-out tile wears yield blue.
export function AvatarTile({ address, className = "" }: { address: string | undefined; className?: string }) {
  const tile = address === undefined ? "tile-1" : `tile-${identiconIndexOf(address)}`;
  return <span className={`avatar-tile ${tile} inline-block shrink-0 rounded-[9px] border-2 border-ink-green ${className}`} aria-hidden="true" />;
}

function AccountSheet() {
  const provider = useSigningProvider();
  const { state } = usePlayer();
  if (provider.kind === "connected") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <AvatarTile address={provider.address} className="h-9 w-9" />
          <span className="font-data text-[11px] tracking-[.1em] text-felt-2">{provider.address}</span>
        </div>
        <p className="font-body text-[13.5px] leading-relaxed text-felt-1">
          Every Call is signed as this address, and it is your seat everywhere at the table. Points are free
          and no Call moves any funds.
        </p>
        {state.kind === "ready" ? (
          <p className="font-data text-[10px] tracking-[.14em] text-felt-3">
            {state.standing.rackLeft} / {state.standing.rackTotal} PTS IN RACK · STREAK {state.standing.streak} ·{" "}
            {state.standing.rank === undefined ? "UNRANKED" : `SEAT #${state.standing.rank}`}
          </p>
        ) : null}
      </div>
    );
  }
  if (provider.kind === "available") {
    return (
      <div className="space-y-4">
        <p className="font-body text-[13.5px] leading-relaxed text-felt-1">
          Take a seat with the {provider.label} this browser already has. You sign one message per Call. It
          moves no funds and costs nothing.
        </p>
        <button
          type="button"
          onClick={() => void provider.connect()}
          className="w-full rounded-[14px] border-[3px] border-felt-edge bg-gold px-5 py-4 text-center font-display text-[18px] font-extrabold tracking-[-.02em] text-ink-green shadow-[0_6px_0_#0B1710] active:translate-y-[5px] active:shadow-[0_1px_0_#0B1710]"
        >
          TAKE A SEAT
        </button>
      </div>
    );
  }
  return (
    <p className="font-body text-[13.5px] leading-relaxed text-felt-1">
      {provider.kind === "loading"
        ? "Checking what this browser can sign with."
        : `${provider.gate} You can read every card, every band and every proof without a seat.`}
    </p>
  );
}

export function AccountControl({ compact = false }: { compact?: boolean }) {
  const overlay = useOverlay();
  const provider = useSigningProvider();
  const address = provider.kind === "connected" ? provider.address : undefined;
  return (
    <button
      type="button"
      onClick={() => overlay.openSheet("YOUR SEAT", <AccountSheet />)}
      className="flex items-center gap-2.5"
      aria-label={address === undefined ? "Take a seat" : `Your seat, ${shortAddress(address)}`}
    >
      <AvatarTile address={address} className={compact ? "h-[26px] w-[26px] rounded-[7px]" : "h-[30px] w-[30px]"} />
      {compact ? null : (
        <span className="font-body text-[13.5px] font-semibold text-felt-text">
          {address === undefined ? "take a seat" : shortAddress(address)}
        </span>
      )}
    </button>
  );
}
