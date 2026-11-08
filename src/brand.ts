import {interpolate, spring, useCurrentFrame} from 'remotion';

// Output runs at 50p (source deinterlaced from 1080i, upper field first).
// All animation timing is written in a 25-unit timebase; useF() maps to it.
export const FPS = 50;
export const BASE = 25;
export const W = 1920;
export const H = 1080;
export const DURATION = 706; // 14.12 s at 50p

// Sampled from the logo card at 12 s.
export const YELLOW = '#FED100';
export const RED = '#ED2727';
export const WHITE = '#FFFFFF';

// The brand leans every band and dash by ~15°.
export const LEAN = 15;
export const LEAN_TAN = Math.tan((LEAN * Math.PI) / 180);

export const s = (sec: number) => sec * BASE;

/** Current time in 25-unit frames (fractional at 50p, so motion stays smooth). */
export const useF = () => (useCurrentFrame() * BASE) / FPS;

// Shot boundaries (frames), measured on the source film.
export const SHOTS = {
  flambe: [0, s(2.0)],
  blur1: [s(1.9), s(2.6)],
  chop: [s(2.5), s(3.56)],
  waiter: [s(3.56), s(5.0)],
  smear: [s(4.95), s(5.5)],
  plating: [s(5.2), s(7.75)],
  plate: [s(7.8), s(8.55)],
  cloche: [s(8.6), s(10.8)],
  logo: [s(10.8), DURATION],
} as const;

// Stiff, no-bounce entrance used everywhere.
export const snap = (frame: number, delay = 0, durationInFrames = 9) =>
  spring({frame: frame - delay, fps: BASE, config: {damping: 200, stiffness: 260, mass: 0.6}, durationInFrames});

export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// 0→1 in, hold, 1→0 out, all within [start, end].
export const inOut = (frame: number, start: number, end: number, fade = 6) =>
  interpolate(frame, [start, start + fade, end - fade, end], [0, 1, 1, 0], clamp);
