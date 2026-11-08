import React from 'react';
import {AbsoluteFill, interpolate, OffthreadVideo, staticFile} from 'remotion';
import {clamp, LEAN, RED, s, snap, WHITE, YELLOW, useF} from './brand';
import {BandWipe, Burst, Chili, CornerBrackets, Ring, Star, StripeDash} from './elements';

const abs: React.CSSProperties = {position: 'absolute'};

/** Shot 1 · flambé: dash bar enters lower-left, star sparks rise out of the flame. */
const Flambe: React.FC = () => {
  const f = useF();
  const sparks = [
    {x: 1010, d: 0, size: 34, c: YELLOW, drift: 30},
    {x: 1190, d: 3, size: 24, c: WHITE, drift: -20},
    {x: 860, d: 5, size: 28, c: YELLOW, drift: -35},
    {x: 1310, d: 8, size: 20, c: WHITE, drift: 15},
  ];
  return (
    <>
      <StripeDash x={90} y={880} count={6} w={20} h={110} gap={18} start={4} end={48} />
      {sparks.map((p, i) => {
        const t = interpolate(f, [s(1.3) + p.d, s(2.0) + p.d], [0, 1], clamp);
        if (t <= 0 || t >= 1) return null;
        return (
          <Star key={i} size={p.size} color={p.c} style={{
            left: p.x + p.drift * t, top: 760 - 520 * t,
            opacity: interpolate(t, [0, 0.15, 0.7, 1], [0, 1, 1, 0]),
            transform: `rotate(${t * 140 * (i % 2 ? -1 : 1)}deg) scale(${0.6 + 0.6 * Math.sin(t * Math.PI)})`,
          }} />
        );
      })}
    </>
  );
};

/** Shot 2 · chopping peppers: the crest's chili draws itself beside the board. */
const Chop: React.FC = () => {
  const f = useF();
  const draw = interpolate(f, [s(2.6), s(3.05)], [0, 1], clamp);
  const out = snap(f, s(3.38));
  return (
    <div style={{...abs, inset: 0, opacity: 1 - out, transform: `translateY(${-out * 20}px)`}}>
      <Chili x={1230} y={490} size={180} progress={draw} />
      <StripeDash x={1440} y={600} count={3} w={12} h={60} gap={12} start={s(2.9)} end={s(3.5)} colors={[YELLOW]} />
    </div>
  );
};

/** Shot 3 · waiter at the table: corner brackets single out the moment. */
const Waiter: React.FC = () => {
  const f = useF();
  const p = snap(f, s(3.7), 10) - snap(f, s(4.75), 8);
  return <CornerBrackets x={660} y={70} w={640} h={880} progress={p} arm={80} thick={9} />;
};

/** Croquetas positions (centre x, y, radius) through the push-in, measured on the source. */
const CROQ_KEYS = [s(6.2), s(6.4), s(7.0), s(7.4), s(7.75)];
const croq = (i: number, f: number) => {
  const X = [[690, 870, 1020], [680, 880, 1070], [630, 900, 1140], [660, 912, 1170], [665, 915, 1175]];
  const Y = [800, 805, 665, 648, 645];
  const R = [92, 97, 135, 148, 150];
  return {
    x: interpolate(f, CROQ_KEYS, X.map((r) => r[i]), clamp),
    y: interpolate(f, CROQ_KEYS, Y, clamp),
    r: interpolate(f, CROQ_KEYS, R, clamp),
  };
};

/** Shot 4 · plating: three croquetas become three balls, one ring at a time. */
const Plating: React.FC = () => {
  const f = useF();
  const fade = interpolate(f, [s(7.55), s(7.75)], [1, 0], clamp);
  const star = snap(f, s(7.2));
  const mid = croq(1, f);
  return (
    <div style={{...abs, inset: 0, opacity: fade}}>
      {[0, 1, 2].map((i) => {
        const c = croq(i, f);
        const p = interpolate(f, [s(6.4) + i * 4, s(6.4) + i * 4 + 8], [0, 1], {
          ...clamp, easing: (x) => 1 - Math.pow(1 - x, 3),
        });
        return <Ring key={i} cx={c.x} cy={c.y} r={c.r + 4} progress={p} color={i === 1 ? RED : YELLOW} width={5} />;
      })}
      <Star size={44} color={YELLOW} style={{
        left: mid.x - 22, top: mid.y - mid.r - 120,
        transform: `scale(${star}) rotate(${(1 - star) * -90}deg)`,
      }} />
    </div>
  );
};

/** Shot 5 · plate slides in: short leaning speed lines trail behind it. */
const Plate: React.FC = () => {
  const f = useF();
  const p = snap(f, s(7.85)) - snap(f, s(8.35));
  const lines = [{y: 610, w: 120, c: YELLOW}, {y: 660, w: 170, c: RED}, {y: 710, w: 90, c: YELLOW}];
  const plateLeft = interpolate(f, [s(7.8), s(8.5)], [470, 590], clamp);
  return (
    <>
      {lines.map((l, i) => (
        <div key={i} style={{
          ...abs, top: l.y, height: 10, borderRadius: 10, background: l.c,
          width: l.w * p, left: plateLeft - 30 - l.w * p - i * 14,
          transform: `skewX(${-LEAN}deg)`, opacity: p,
        }} />
      ))}
    </>
  );
};

/** Shot 6 · cloche and bell: a ding burst, then the card's bands gather at the left edge. */
const Cloche: React.FC = () => {
  const f = useF();
  const ding = interpolate(f, [s(9.7), s(9.7) + 10], [0, 1], clamp);
  const gather = snap(f, s(9.95), 10);
  const leave = interpolate(f, [s(10.62), s(10.82)], [0, 1], clamp);
  const bands = [{c: YELLOW, w: 70, x: -10}, {c: RED, w: 46, x: 70}];
  return (
    <>
      {ding > 0 && ding < 1 && <Burst cx={1382} cy={905} progress={ding} r0={40} r1={110} />}
      {bands.map((b, i) => (
        <div key={i} style={{
          ...abs, top: -60, height: 1200, width: b.w, borderRadius: 30, background: b.c,
          left: b.x - (1 - gather) * 260 - leave * 320, transform: `skewX(${-LEAN}deg)`,
        }} />
      ))}
    </>
  );
};

export const TapasBranded: React.FC = () => {
  const f = useF();
  return (
    <AbsoluteFill style={{background: 'black'}}>
      <OffthreadVideo src={staticFile('tapas-50p.mp4')} />
      <AbsoluteFill>
        {f < s(2.1) && <Flambe />}
        {f >= s(1.7) && f < s(2.6) && <BandWipe start={s(1.82)} dir={1} />}
        {f >= s(2.5) && f < s(3.6) && <Chop />}
        {f >= s(3.56) && f < s(5.0) && <Waiter />}
        {f >= s(4.9) && f < s(5.6) && <BandWipe start={s(4.98)} dir={-1} />}
        {f >= s(6.2) && f < s(7.8) && <Plating />}
        {f >= s(7.8) && f < s(8.6) && <Plate />}
        {f >= s(9.6) && f < s(10.9) && <Cloche />}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
