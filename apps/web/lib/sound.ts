"use client";

import { hapticsOn, sfxVolume } from "./settings.js";

// The table's sounds, synthesised (no assets, nothing to license): a chip clacking onto
// the spot, the gauge's detent, the stamp's thud, a lamp's tick, the reveal's chime and
// the miss's low note. Silent until the first gesture (browsers require it) and scaled by
// the SFX setting; a zero volume is the mute. Haptics follow Masayume's ladder in
// milliseconds: tap 8, confirm 18, card-win 24, loss 36, and nothing for modals.

type Cue = "chip" | "detent" | "stamp" | "lamp" | "chime" | "miss" | "deal";

let context: AudioContext | undefined;
let unlocked = false;

const audio = (): AudioContext | undefined => {
  if (typeof window === "undefined") return undefined;
  context ??= new (window.AudioContext ?? (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)();
  return context;
};

export const unlockSound = (): void => {
  unlocked = true;
  void audio()?.resume();
};

const tone = (frequency: number, seconds: number, type: OscillatorType, gain: number, slideTo?: number): void => {
  const ctx = audio();
  const volume = sfxVolume();
  if (ctx === undefined || !unlocked || volume === 0) return;
  const oscillator = ctx.createOscillator();
  const amp = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
  if (slideTo !== undefined) oscillator.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + seconds);
  amp.gain.setValueAtTime(gain * volume, ctx.currentTime);
  amp.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + seconds);
  oscillator.connect(amp).connect(ctx.destination);
  oscillator.start();
  oscillator.stop(ctx.currentTime + seconds);
};

const noise = (seconds: number, gain: number, cutoff = 900): void => {
  const ctx = audio();
  const volume = sfxVolume();
  if (ctx === undefined || !unlocked || volume === 0) return;
  const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * seconds), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < data.length; index++) data[index] = (Math.random() * 2 - 1) * (1 - index / data.length);
  const source = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const amp = ctx.createGain();
  filter.type = "lowpass";
  filter.frequency.value = cutoff;
  amp.gain.value = gain * volume;
  source.buffer = buffer;
  source.connect(filter).connect(amp).connect(ctx.destination);
  source.start();
};

export const play = (cue: Cue): void => {
  switch (cue) {
    case "chip":
      noise(0.04, 0.35, 2400);
      tone(1100, 0.05, "square", 0.05);
      return;
    case "detent":
      tone(420, 0.05, "square", 0.08);
      noise(0.03, 0.12);
      return;
    case "stamp":
      noise(0.12, 0.5);
      tone(90, 0.18, "sine", 0.3, 50);
      return;
    case "lamp":
      tone(1200, 0.03, "square", 0.04);
      return;
    case "chime":
      tone(523, 0.12, "triangle", 0.12);
      setTimeout(() => tone(659, 0.12, "triangle", 0.12), 110);
      setTimeout(() => tone(784, 0.28, "triangle", 0.14), 220);
      return;
    case "miss":
      tone(220, 0.25, "sawtooth", 0.08, 160);
      return;
    case "deal":
      noise(0.06, 0.18);
      return;
  }
};

export type Buzz = "tap" | "confirm" | "win" | "loss";
const BUZZ_MS: Record<Buzz, number> = { tap: 8, confirm: 18, win: 24, loss: 36 };

export const buzz = (kind: Buzz): void => {
  if (!hapticsOn() || typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  navigator.vibrate(BUZZ_MS[kind]);
};

export const hapticsSupported = (): boolean => typeof navigator !== "undefined" && typeof navigator.vibrate === "function";
