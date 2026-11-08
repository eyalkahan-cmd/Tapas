import React, {createContext, useContext} from 'react';
import {getLength, getPointAtLength} from '@remotion/paths';
import {noise2D} from '@remotion/noise';
import {interpolate, random} from 'remotion';
import {clamp, LEAN, RED, WHITE, YELLOW, useF} from '../brand';

/** Which depth pass is being rendered: behind the people, or in front of them. */
export type Layer = 'back' | 'front';
export const LayerCtx = createContext<Layer>('front');
export const useLayer = () => useContext(LayerCtx);

/** Render children only in the given depth pass. */
export const On: React.FC<{layer: Layer; children: React.ReactNode}> = ({layer, children}) =>
  useLayer() === layer ? <>{children}</> : null;

export const abs: React.CSSProperties = {position: 'absolute'};

// Smooth, no-overshoot easings.
export const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
export const easeIn = (x: number) => x * x * x;

export const ramp = (f: number, a: number, b: number, ease = easeInOut) =>
  interpolate(f, [a, b], [0, 1], {...clamp, easing: ease});

/** Camera follow: scale the graphics about a pivot so they sit in the shot as it pushes in or pulls back. */
export const Cam: React.FC<{scale: number; px: number; py: number; children: React.ReactNode}> = ({scale, px, py, children}) => (
  <div style={{...abs, inset: 0, transformOrigin: `${px}px ${py}px`, transform: `scale(${scale})`}}>{children}</div>
);

type Pt = [number, number];

/** Catmull-Rom through the points, as a cubic SVG path. */
export const spline = (pts: Pt[]) => {
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
};

/** Points that float: each one drifts slowly on smooth noise so the ribbon never sits still. */
export const floatPts = (pts: Pt[], f: number, amp: number, seed: string, dy = 0): Pt[] =>
  pts.map(([x, y], i) => [
    x + noise2D(seed + 'x', i * 0.7, f * 0.018) * amp * 0.6,
    y + dy + noise2D(seed + 'y', i * 0.7, f * 0.018) * amp,
  ]);

/** One stroke that draws on (head) and off (tail) along a path, in path-length fractions 0..1. */
export const Stroke: React.FC<{
  d: string; head: number; tail: number; color: string; width: number;
  opacity?: number; dash?: string; cap?: 'round' | 'butt';
}> = ({d, head, tail, color, width, opacity = 1, dash, cap = 'round'}) => {
  if (head <= tail) return null;
  const L = getLength(d);
  const a = tail * L, b = head * L;
  return (
    <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap={cap} strokeLinejoin="round"
      opacity={opacity}
      strokeDasharray={dash ?? `${b - a} ${L * 3}`} strokeDashoffset={dash ? undefined : -a}
      style={dash ? {clipPath: 'none'} : undefined} />
  );
};

export type BundleProps = {
  pts: Pt[];
  /** [start, end] of the draw-on and of the draw-off, in 25-unit frames. */
  on: [number, number];
  off: [number, number];
  seed: string;
  amp?: number;
  scale?: number;
  colors?: string[];
  widths?: number[];
  gaps?: number[];
  lags?: number[];
  glint?: boolean;
};

/** The brand thread: yellow, red and a fine white line travelling together, slightly out of step. */
export const Bundle: React.FC<BundleProps> = ({
  pts, on, off, seed, amp = 22, scale = 1,
  colors = [YELLOW, RED, WHITE], widths = [30, 18, 6], gaps = [0, 36, 62], lags = [0, 1.6, 3.2], glint = true,
}) => {
  const f = useF();
  const strokes = colors.map((c, i) => {
    const d = spline(floatPts(pts, f + i * 6, amp, seed + i, gaps[i] * scale));
    const head = ramp(f - lags[i], on[0], on[1], easeInOut);
    const tail = ramp(f - lags[i], off[0], off[1], easeIn);
    return {d, head, tail, c, w: widths[i] * scale};
  });
  const lead = strokes[0];
  let tip: {x: number; y: number} | null = null;
  if (glint && lead.head > 0.01 && lead.head < 0.995) {
    const L = getLength(lead.d);
    const p = getPointAtLength(lead.d, lead.head * L);
    tip = {x: p.x, y: p.y};
  }
  return (
    <svg width={1920} height={1080} style={{...abs, left: 0, top: 0, overflow: 'visible'}}>
      {strokes.map((s, i) => <Stroke key={i} d={s.d} head={s.head} tail={s.tail} color={s.c} width={s.w} />)}
      {/* a soft sheen along the yellow band */}
      <Stroke d={lead.d} head={lead.head} tail={lead.tail} color="#FFF3A6" width={lead.w * 0.22} opacity={0.55} />
      {tip && <Glint x={tip.x} y={tip.y - lead.w * 0.1} size={70 * scale} />}
    </svg>
  );
};

/** Four-point light glint (SVG, centred on x,y). */
export const Glint: React.FC<{x: number; y: number; size: number; opacity?: number}> = ({x, y, size, opacity = 0.95}) => {
  const s = size / 2, t = size * 0.06;
  return (
    <g transform={`translate(${x} ${y}) rotate(${LEAN})`} opacity={opacity}>
      <circle r={size * 0.32} fill="url(#glow)" />
      <path d={`M0,${-s} L${t},${-t} L${s},0 L${t},${t} L0,${s} L${-t},${t} L${-s},0 L${-t},${-t} Z`} fill={WHITE} />
      <circle r={t * 1.4} fill={WHITE} />
    </g>
  );
};

export const GlowDefs: React.FC = () => (
  <svg width={0} height={0} style={{position: 'absolute'}}>
    <defs>
      <radialGradient id="glow">
        <stop offset="0%" stopColor="#FFF6C8" stopOpacity={0.9} />
        <stop offset="45%" stopColor={YELLOW} stopOpacity={0.35} />
        <stop offset="100%" stopColor={YELLOW} stopOpacity={0} />
      </radialGradient>
    </defs>
  </svg>
);

/** Five-point star polygon centred on 0,0 with outer radius r. */
export const starPts = (r: number) =>
  Array.from({length: 10}).map((_, i) => {
    const rr = i % 2 === 0 ? r : r * 0.42;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    return `${(rr * Math.cos(a)).toFixed(1)},${(rr * Math.sin(a)).toFixed(1)}`;
  }).join(' ');

/** Leaning rounded dashes (the logo card's hazard bar), revealed one by one and optionally scrolling. */
export const Dashes: React.FC<{
  x: number; y: number; count: number; w: number; h: number; gap: number;
  inAt: number; outAt: number; colors?: string[]; scroll?: number; opacity?: number;
}> = ({x, y, count, w, h, gap, inAt, outAt, colors = [YELLOW, RED], scroll = 0, opacity = 1}) => {
  const f = useF();
  const step = w + gap;
  const shift = ((f * scroll) % (step * colors.length) + step * colors.length) % (step * colors.length);
  return (
    <div style={{...abs, left: x, top: y, width: count * step, height: h, overflow: 'hidden', opacity}}>
      {Array.from({length: count + colors.length + 1}).map((_, i) => {
        const pin = ramp(f, inAt + i * 1.2, inAt + i * 1.2 + 7, easeOut);
        const pout = ramp(f, outAt + i * 0.8, outAt + i * 0.8 + 6, easeIn);
        const p = pin - pout;
        if (p <= 0) return null;
        return (
          <div key={i} style={{
            ...abs, left: (i - colors.length) * step + shift, top: 0, width: w, height: h,
            background: colors[i % colors.length], borderRadius: w * 0.35,
            transform: `skewX(${-LEAN}deg) translateY(${(1 - pin) * h * 1.1 - pout * h * 1.1}px)`,
          }} />
        );
      })}
    </div>
  );
};

/** Drifting embers: small leaning sparks rising from a source box. */
export const Embers: React.FC<{
  x0: number; x1: number; y: number; rise: number; from: number; to: number; count: number; seed: string;
}> = ({x0, x1, y, rise, from, to, count, seed}) => {
  const f = useF();
  return (
    <svg width={1920} height={1080} style={{...abs, left: 0, top: 0, overflow: 'visible'}}>
      {Array.from({length: count}).map((_, i) => {
        const born = from + random(seed + 'b' + i) * (to - from - 14);
        const life = 12 + random(seed + 'l' + i) * 12;
        const t = (f - born) / life;
        if (t <= 0 || t >= 1) return null;
        const x = x0 + random(seed + 'x' + i) * (x1 - x0) + noise2D(seed, i, f * 0.06) * 40;
        const yy = y - rise * easeOut(t) * (0.6 + random(seed + 'r' + i) * 0.6);
        const c = [YELLOW, YELLOW, RED, WHITE][i % 4];
        const len = 10 + random(seed + 's' + i) * 16;
        return (
          <rect key={i} x={x - 2.5} y={yy - len / 2} width={5} height={len} rx={2.5} fill={c}
            opacity={interpolate(t, [0, 0.15, 0.7, 1], [0, 1, 0.9, 0])}
            transform={`rotate(${LEAN} ${x} ${yy})`} />
        );
      })}
    </svg>
  );
};

/** Soft, out-of-focus brand stars floating far back in the set. */
export const BokehStars: React.FC<{items: {x: number; y: number; r: number; c: string; at: number; until: number}[]; seed: string}> = ({items, seed}) => {
  const f = useF();
  return (
    <svg width={1920} height={1080} style={{...abs, left: 0, top: 0, overflow: 'visible', filter: 'blur(5px)'}}>
      {items.map((it, i) => {
        const o = interpolate(f, [it.at, it.at + 10, it.until - 10, it.until], [0, 0.55, 0.55, 0], clamp);
        if (o <= 0) return null;
        const x = it.x + noise2D(seed + 'x', i, f * 0.01) * 30;
        const y = it.y + noise2D(seed + 'y', i, f * 0.01) * 20 - f * 0.25;
        return <polygon key={i} points={starPts(it.r)} fill={it.c} opacity={o}
          transform={`translate(${x} ${y}) rotate(${f * 0.4 + i * 30})`} />;
      })}
    </svg>
  );
};
