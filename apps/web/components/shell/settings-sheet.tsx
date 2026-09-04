"use client";

import { useEffect, useState } from "react";
import { useSettings, type Motion } from "../../lib/settings.js";
import { buzz, hapticsSupported, play, unlockSound } from "../../lib/sound.js";

// Settings (Masayume's sheet, app-wide): a sound slider that demonstrates itself on
// release, a haptics switch that buzzes as it turns on (and says so when the device
// cannot), and motion as three states. Kept on this device; nothing is signed or sent.

const LABEL = "font-data text-[9.5px] tracking-[.16em] text-felt-2";

export function SettingsSheet() {
  const { sfx, setSfx, haptics, setHaptics, motion, setMotion } = useSettings();
  const [canBuzz, setCanBuzz] = useState(true);
  const [systemReduced, setSystemReduced] = useState(false);
  useEffect(() => {
    setCanBuzz(hapticsSupported());
    setSystemReduced(matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);
  const demo = () => {
    unlockSound();
    play("chip");
  };
  const options: readonly [Motion, string][] = [["system", "FOLLOW SYSTEM"], ["full", "FULL"], ["reduced", "REDUCED"]];
  return (
    <div className="space-y-6">
      <p className="font-body text-[13.5px] leading-relaxed text-felt-1">These apply the moment you change them, and they stay on this device.</p>
      <div>
        <label htmlFor="sfx" className={LABEL}>SOUND EFFECTS · {Math.round(sfx * 100)}%</label>
        <input
          id="sfx"
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={sfx}
          onChange={(event) => setSfx(Number(event.target.value))}
          onPointerUp={demo}
          onKeyUp={demo}
          className="mt-2 w-full accent-gold"
        />
        <p className="mt-1 font-data text-[9px] tracking-[.06em] text-felt-4">ZERO IS MUTE. THE SLIDER PLAYS A CHIP AT THE LEVEL YOU SET.</p>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <div className={LABEL}>HAPTICS</div>
          <p className="mt-1 font-data text-[9px] tracking-[.06em] text-felt-4">{canBuzz ? "BUZZES AS IT TURNS ON." : "THIS DEVICE DOES NOT REPORT VIBRATION SUPPORT."}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={haptics}
          disabled={!canBuzz}
          onClick={() => {
            const next = !haptics;
            setHaptics(next);
            if (next) buzz("confirm");
          }}
          className={`h-7 w-12 rounded-full border-2 border-ink-green p-0.5 transition-colors ${haptics && canBuzz ? "bg-gold" : "bg-black/35"} disabled:opacity-40`}
        >
          <span className={`block h-5 w-5 rounded-full bg-stock transition-transform ${haptics && canBuzz ? "translate-x-5" : ""}`} />
        </button>
      </div>
      <div>
        <div className={LABEL}>MOTION</div>
        <div role="radiogroup" aria-label="Motion" className="mt-2 flex gap-1.5">
          {options.map(([value, word]) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={motion === value}
              onClick={() => setMotion(value)}
              className={`flex-1 rounded-full border-2 px-2 py-2 font-data text-[9px] tracking-[.1em] ${motion === value ? "border-gold bg-gold text-ink-green" : "border-white/25 text-felt-2"}`}
            >
              {word}
            </button>
          ))}
        </div>
        <p className="mt-1 font-data text-[9px] tracking-[.06em] text-felt-4">
          {motion === "system" ? `FOLLOWING THE SYSTEM, WHICH SAYS ${systemReduced ? "REDUCED" : "FULL"} RIGHT NOW.` : motion === "reduced" ? "FLIPS AND SWEEPS BECOME PLAIN SWAPS." : "EVERY DEAL, FLIP, SWEEP AND STAMP."}
        </p>
      </div>
      <p className="font-data text-[9px] leading-relaxed tracking-[.06em] text-felt-4">KEPT ON THIS DEVICE. NOTHING HERE IS SIGNED OR SENT ANYWHERE.</p>
    </div>
  );
}
