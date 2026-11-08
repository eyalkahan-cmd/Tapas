import React from 'react';
import {interpolate} from 'remotion';
import {clamp, LEAN, LEAN_TAN, RED, snap, WHITE, YELLOW, useF} from './brand';

const abs: React.CSSProperties = {position: 'absolute'};

/** The dashed "hazard" bar from the logo card: leaning rounded dashes, alternating yellow/red. */
export const StripeDash: React.FC<{
  x: number; y: number; count?: number; w?: number; h?: number; gap?: number;
  start: number; end: number; dir?: 1 | -1; colors?: string[];
}> = ({x, y, count = 6, w = 22, h = 120, gap = 18, start, end, dir = 1, colors = [YELLOW, RED]}) => {
  const f = useF();
  return (
    <>
      {Array.from({length: count}).map((_, i) => {
        const order = dir === 1 ? i : count - 1 - i;
        const pin = snap(f, start + order * 2);
        const pout = snap(f, end - 10 + order * 1.5);
        const p = pin - pout;
        return (
          <div key={i} style={{
            ...abs, left: x + i * (w + gap), top: y, width: w, height: h,
            background: colors[i % colors.length], borderRadius: w * 0.35,
            transform: `skewX(${-LEAN}deg) translateY(${(1 - pin) * h * 0.6 - pout * h * 0.6}px)`,
            opacity: p, clipPath: 'inset(0 0 0 0)',
          }} />
        );
      })}
    </>
  );
};

/** Full-frame wipe: leaning yellow then red bands crossing the screen. */
export const BandWipe: React.FC<{start: number; dir?: 1 | -1; dur?: number}> = ({start, dir = 1, dur = 14}) => {
  const f = useF();
  const bands = [
    {c: YELLOW, w: 520, d: 0},
    {c: RED, w: 420, d: 2},
    {c: WHITE, w: 70, d: 4},
  ];
  return (
    <>
      {bands.map((b, i) => {
        const t = interpolate(f, [start + b.d, start + b.d + dur], [0, 1], {
          ...clamp, easing: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
        });
        const span = 1920 + b.w + 1080 * LEAN_TAN * 2;
        const left = dir === 1 ? -b.w - 400 + t * span : 1920 + 400 - t * span;
        return (
          <div key={i} style={{
            ...abs, top: -40, height: 1160, width: b.w, left,
            background: b.c, borderRadius: 60, transform: `skewX(${-LEAN}deg)`,
          }} />
        );
      })}
    </>
  );
};

/** Five-point star, as flanking the wordmark. */
export const Star: React.FC<{size: number; color?: string; style?: React.CSSProperties}> = ({size, color = YELLOW, style}) => {
  const pts = Array.from({length: 10}).map((_, i) => {
    const r = i % 2 === 0 ? 50 : 21;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    return `${50 + r * Math.cos(a)},${50 + r * Math.sin(a)}`;
  }).join(' ');
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{...abs, overflow: 'visible', ...style}}>
      <polygon points={pts} fill={color} strokeLinejoin="round" />
    </svg>
  );
};

/** Outline chili from the crest, drawn on with a stroke. */
export const Chili: React.FC<{x: number; y: number; size: number; progress: number; color?: string}> = ({x, y, size, progress, color = RED}) => {
  const len = 420;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{...abs, left: x, top: y, overflow: 'visible'}}>
      <path
        d="M70 18 C64 10, 58 12, 60 22 C40 24, 30 40, 24 62 C20 78, 14 86, 6 90 C26 94, 48 84, 62 64 C72 50, 76 36, 70 26 Z"
        fill="none" stroke={color} strokeWidth={5} strokeLinejoin="round" strokeLinecap="round"
        strokeDasharray={len} strokeDashoffset={len * (1 - progress)}
      />
      <path d="M60 22 C66 18, 74 20, 78 14" fill="none" stroke={color} strokeWidth={6} strokeLinecap="round"
        strokeDasharray={40} strokeDashoffset={40 * (1 - Math.min(1, progress * 1.4))} />
    </svg>
  );
};

/** Leaning corner brackets: a minimal "spotlight" frame. */
export const CornerBrackets: React.FC<{
  x: number; y: number; w: number; h: number; progress: number; arm?: number; thick?: number;
}> = ({x, y, w, h, progress, arm = 70, thick = 8}) => {
  const a = arm * progress;
  const off = (1 - progress) * 40;
  const corner = (cx: number, cy: number, sx: number, sy: number, c: string) => (
    <>
      <div style={{...abs, left: cx + (sx < 0 ? -a : 0) - sx * off, top: cy - (sy < 0 ? thick : 0) - sy * off,
        width: a, height: thick, background: c, borderRadius: thick}} />
      <div style={{...abs, left: cx - (sx < 0 ? thick : 0) - sx * off, top: cy + (sy < 0 ? -a : 0) - sy * off,
        width: thick, height: a, background: c, borderRadius: thick}} />
    </>
  );
  return (
    <div style={{...abs, inset: 0, transform: `skewX(${-LEAN * 0.4}deg)`, transformOrigin: `${x + w / 2}px ${y + h / 2}px`, opacity: progress}}>
      {corner(x, y, 1, 1, YELLOW)}
      {corner(x + w, y, -1, 1, RED)}
      {corner(x, y + h, 1, -1, RED)}
      {corner(x + w, y + h, -1, -1, YELLOW)}
    </div>
  );
};

/** Thin ring drawn around a round object (the croquetas read as balls). */
export const Ring: React.FC<{cx: number; cy: number; r: number; progress: number; color?: string; width?: number}> = ({
  cx, cy, r, progress, color = YELLOW, width = 6,
}) => {
  const c = 2 * Math.PI * r;
  return (
    <svg style={{...abs, left: 0, top: 0, overflow: 'visible'}} width={1} height={1}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - progress)}
        transform={`rotate(-110 ${cx} ${cy})`} />
    </svg>
  );
};

/** Short radial burst (bell "ding"). */
export const Burst: React.FC<{cx: number; cy: number; progress: number; r0?: number; r1?: number; rays?: number}> = ({
  cx, cy, progress, r0 = 50, r1 = 120, rays = 7,
}) => {
  const p = progress;
  const inner = r0 + (r1 - r0) * Math.max(0, p - 0.35) / 0.65;
  const outer = r0 + (r1 - r0) * Math.min(1, p / 0.6);
  return (
    <svg style={{...abs, left: 0, top: 0, overflow: 'visible'}} width={1} height={1}>
      {Array.from({length: rays}).map((_, i) => {
        const a = (-90 - 75 + (150 / (rays - 1)) * i) * (Math.PI / 180);
        return (
          <line key={i} x1={cx + inner * Math.cos(a)} y1={cy + inner * Math.sin(a)}
            x2={cx + outer * Math.cos(a)} y2={cy + outer * Math.sin(a)}
            stroke={i % 2 ? YELLOW : RED} strokeWidth={8} strokeLinecap="round" opacity={p >= 1 ? 0 : 1} />
        );
      })}
    </svg>
  );
};
