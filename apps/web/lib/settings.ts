"use client";

import { useCallback, useEffect, useState } from "react";

// Device-local settings (Masayume's settings sheet, three independent keys so a corrupt
// key loses one setting). Motion is three-state on purpose: "follow system" is a different
// answer from "full", and collapsing them would override an accessibility preference the
// player never touched. Nothing here is signed or sent anywhere.

export type Motion = "system" | "full" | "reduced";

const SFX_KEY = "pl.sfx.v1";
const HAPTICS_KEY = "pl.haptics.v1";
const MOTION_KEY = "pl.motion.v1";

const read = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};
const write = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Blocked storage keeps the default; the sheet still works for this visit.
  }
};

export const sfxVolume = (): number => {
  const held = Number(read(SFX_KEY));
  return Number.isFinite(held) && read(SFX_KEY) !== null ? Math.min(1, Math.max(0, held)) : 0.6;
};
export const hapticsOn = (): boolean => read(HAPTICS_KEY) !== "0";
export const motionSetting = (): Motion => {
  const held = read(MOTION_KEY);
  return held === "full" || held === "reduced" ? held : "system";
};

/// Whether motion should be reduced right now: the player's choice, else the system's.
export const motionReduced = (): boolean => {
  const held = motionSetting();
  if (held !== "system") return held === "reduced";
  return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
};

/// Applied to the document so the stylesheet's reduced-motion rules follow the player's
/// choice as well as the OS (globals.css keys on data-reduced-motion).
export const applyMotion = (): void => {
  document.documentElement.dataset.reducedMotion = motionReduced() ? "true" : "false";
};

export const useSettings = () => {
  const [sfx, setSfxState] = useState(0.6);
  const [haptics, setHapticsState] = useState(true);
  const [motion, setMotionState] = useState<Motion>("system");
  useEffect(() => {
    setSfxState(sfxVolume());
    setHapticsState(hapticsOn());
    setMotionState(motionSetting());
    applyMotion();
  }, []);
  const setSfx = useCallback((value: number) => {
    write(SFX_KEY, String(value));
    setSfxState(value);
  }, []);
  const setHaptics = useCallback((value: boolean) => {
    write(HAPTICS_KEY, value ? "1" : "0");
    setHapticsState(value);
  }, []);
  const setMotion = useCallback((value: Motion) => {
    write(MOTION_KEY, value);
    setMotionState(value);
    applyMotion();
  }, []);
  return { sfx, setSfx, haptics, setHaptics, motion, setMotion };
};
