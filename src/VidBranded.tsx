import React from 'react';
import {AbsoluteFill, interpolate, OffthreadVideo, staticFile, useCurrentFrame} from 'remotion';
import {clamp, LEAN, RED, s, snap, YELLOW} from './brand';
import {Burst, Ring, Star} from './elements';

// "Vid" edit (one-shot transition version), 50p. Same graphic language as the branded opening
// (graphics-ref.mp4): rings on the croquetas (from 1.0 s), speed lines left of the plate (from 2.0 s), and a burst at the bell.
// Timing is written in seconds via s() (25-unit timebase), positions in 1920x1080 pixels.

export const VID_FPS = 50;
export const VID_DURATION = 390; // 7.8 s

const abs: React.CSSProperties = {position: 'absolute'};

// Croquetas (ball centre + radius), measured on frames 50/55/60/66/76/86/96/106 of vid-50p.mp4.
const KEYS = [s(1.0), s(1.1), s(1.2), s(1.32), s(1.52), s(1.72), s(1.92), s(2.12)];
const BALLS = [
  {x: [681, 699, 660, 650, 630, 624, 624, 624], y: [795, 810, 825, 820, 780, 680, 660, 630], r: [90, 108, 112, 125, 140, 144, 144, 144]},
  {x: [855, 876, 894, 890, 900, 894, 900, 890], y: [795, 804, 810, 790, 750, 650, 640, 600], r: [90, 104, 108, 110, 130, 124, 130, 124]},
  {x: [1011, 1065, 1104, 1130, 1160, 1160, 1160, 1160], y: [804, 816, 825, 840, 790, 700, 670, 650], r: [90, 108, 112, 136, 150, 156, 154, 156]},
];
const ball = (i: number, t: number) => ({
  x: interpolate(t, KEYS, BALLS[i].x, clamp),
  y: interpolate(t, KEYS, BALLS[i].y, clamp),
  r: interpolate(t, KEYS, BALLS[i].r, clamp),
});

const Croquetas: React.FC<{t: number}> = ({t}) => {
  const fade = interpolate(t, [s(2.06), s(2.2)], [1, 0], clamp);
  const star = snap(t, s(1.5));
  const mid = ball(1, t);
  return (
    <div style={{...abs, inset: 0, opacity: fade}}>
      {[0, 1, 2].map((i) => {
        const c = ball(i, t);
        const p = interpolate(t, [s(1.0) + i * 4, s(1.0) + i * 4 + 8], [0, 1], {
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

// Lines sit on the left of the plate, appearing at 2.0 s, just before the push starts (~2.2 s).
// Plate left edge / rim height measured on frames 100–137 of vid-50p.mp4.
const PK = [s(2.0), s(2.14), s(2.2), s(2.26), s(2.32), s(2.38), s(2.44), s(2.5), s(2.56), s(2.62), s(2.74)];
const P_LEFT = [0, 24, 230, 480, 648, 672, 566, 432, 360, 326, 326];
const P_Y = [720, 712, 700, 672, 672, 624, 576, 576, 624, 624, 648];

const SpeedLines: React.FC<{t: number}> = ({t}) => {
  const p = snap(t, s(2.0)) - snap(t, s(2.62));
  const right = Math.max(interpolate(t, PK, P_LEFT, clamp) - 24, 250);
  const cy = interpolate(t, PK, P_Y, clamp);
  const lines = [{dy: -40, w: 120, c: YELLOW}, {dy: 0, w: 170, c: RED}, {dy: 40, w: 90, c: YELLOW}];
  return (
    <>
      {lines.map((l, i) => (
        <div key={i} style={{
          ...abs, top: cy + l.dy, height: 10, borderRadius: 10, background: l.c,
          width: l.w * p, left: right - l.w * p - i * 14,
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

export const VidBranded: React.FC = () => {
  const t = useCurrentFrame() / 2; // 25-unit time
  return (
    <AbsoluteFill style={{background: 'black'}}>
      <OffthreadVideo src={staticFile('vid-50p.mp4')} />
      <AbsoluteFill>
        {t >= s(0.98) && t < s(2.25) && <Croquetas t={t} />}
        {t >= s(1.98) && t < s(2.85) && <SpeedLines t={t} />}
        {t >= s(5.2) && t < s(5.7) && <Bell t={t} />}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
