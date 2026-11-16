import React from 'react';
import {AbsoluteFill, interpolate, OffthreadVideo, staticFile, useCurrentFrame} from 'remotion';
import {clamp, LEAN, RED, s, snap, YELLOW} from './brand';
import {Burst, Ring, Star} from './elements';

// "Vid" edit (one-shot transition version), 50p. Same graphic language as the branded opening
// (graphics-ref.mp4): rings on the croquetas, short speed lines by the plate, a burst at the bell,
// and the leaning yellow/red bands gathering at the left edge before the logo reveal.
// Timing is written in seconds via s() (25-unit timebase), positions in 1920x1080 pixels.

export const VID_FPS = 50;
export const VID_DURATION = 390; // 7.8 s

const abs: React.CSSProperties = {position: 'absolute'};

// Croquetas (ball centre + radius), measured on frames 66/76/86/96/106 of vid-50p.mp4.
const KEYS = [s(1.32), s(1.52), s(1.72), s(1.92), s(2.12)];
const BALLS = [
  {x: [650, 630, 624, 624, 624], y: [820, 780, 680, 660, 630], r: [125, 140, 144, 144, 144]},
  {x: [890, 900, 894, 900, 890], y: [790, 750, 650, 640, 600], r: [110, 130, 124, 130, 124]},
  {x: [1130, 1160, 1160, 1160, 1160], y: [840, 790, 700, 670, 650], r: [136, 150, 156, 154, 156]},
];
const ball = (i: number, t: number) => ({
  x: interpolate(t, KEYS, BALLS[i].x, clamp),
  y: interpolate(t, KEYS, BALLS[i].y, clamp),
  r: interpolate(t, KEYS, BALLS[i].r, clamp),
});

const Croquetas: React.FC<{t: number}> = ({t}) => {
  const fade = interpolate(t, [s(2.06), s(2.2)], [1, 0], clamp);
  const star = snap(t, s(1.84));
  const mid = ball(1, t);
  return (
    <div style={{...abs, inset: 0, opacity: fade}}>
      {[0, 1, 2].map((i) => {
        const c = ball(i, t);
        const p = interpolate(t, [s(1.4) + i * 4, s(1.4) + i * 4 + 8], [0, 1], {
          ...clamp, easing: (x) => 1 - Math.pow(1 - x, 3),
        });
        return <Ring key={i} cx={c.x} cy={c.y} r={c.r} progress={p} color={i === 1 ? RED : YELLOW} width={5} />;
      })}
      <Star size={44} color={YELLOW} style={{
        left: mid.x - 22, top: mid.y - mid.r - 150,
        transform: `scale(${star}) rotate(${(1 - star) * -90}deg)`,
      }} />
    </div>
  );
};

// Plate moves left during the camera move; lines trail on its right.
const SpeedLines: React.FC<{t: number}> = ({t}) => {
  const p = snap(t, s(2.42)) - snap(t, s(2.72));
  const edge = interpolate(t, [s(2.5), s(2.6), s(2.7)], [1785, 1682, 1544], clamp);
  const cy = interpolate(t, [s(2.5), s(2.6), s(2.7)], [547, 576, 634], clamp);
  const lines = [{dy: -40, w: 120, c: YELLOW}, {dy: 0, w: 170, c: RED}, {dy: 40, w: 90, c: YELLOW}];
  return (
    <>
      {lines.map((l, i) => (
        <div key={i} style={{
          ...abs, top: cy + l.dy, height: 10, borderRadius: 10, background: l.c,
          width: l.w * p, left: edge + 30 + i * 14,
          transform: `skewX(${-LEAN}deg)`, opacity: p,
        }} />
      ))}
    </>
  );
};

const Bell: React.FC<{t: number}> = ({t}) => {
  const ding = interpolate(t, [s(5.24), s(5.24) + 10], [0, 1], clamp);
  return ding > 0 && ding < 1 ? <Burst cx={1374} cy={885} progress={ding} r0={40} r1={110} /> : null;
};

// Leaning bands gather at the left edge, then slide out as the logo appears in the cloche.
const Bands: React.FC<{t: number}> = ({t}) => {
  const gather = snap(t, s(5.74), 10);
  const leave = interpolate(t, [s(6.22), s(6.44)], [0, 1], clamp);
  const bands = [{c: YELLOW, w: 70, x: -10}, {c: RED, w: 46, x: 70}];
  return (
    <>
      {bands.map((b, i) => (
        <div key={i} style={{
          ...abs, top: -60, height: 1200, width: b.w, borderRadius: 30, background: b.c,
          left: b.x - (1 - gather) * 260 - leave * 320, transform: `skewX(${-LEAN}deg)`,
        }} />
      ))}
    </>
  );
};

export const VidBranded: React.FC = () => {
  const t = useCurrentFrame() / 2; // 25-unit time
  return (
    <AbsoluteFill style={{background: 'black'}}>
      <OffthreadVideo src={staticFile('vid-50p.mp4')} />
      <AbsoluteFill>
        {t >= s(1.3) && t < s(2.25) && <Croquetas t={t} />}
        {t >= s(2.38) && t < s(2.85) && <SpeedLines t={t} />}
        {t >= s(5.2) && t < s(5.7) && <Bell t={t} />}
        {t >= s(5.6) && t < s(6.5) && <Bands t={t} />}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
