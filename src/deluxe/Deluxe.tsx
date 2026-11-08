import React from 'react';
import {AbsoluteFill, interpolate, OffthreadVideo, staticFile} from 'remotion';
import {clamp, LEAN, LEAN_TAN, RED, s, WHITE, YELLOW, useF} from '../brand';
import {Burst, Chili} from '../elements';
import {
  abs, BokehStars, Bundle, Cam, Dashes, easeIn, easeInOut, easeOut, Embers, Glint, GlowDefs, Layer, LayerCtx,
  On, ramp, spline, starPts, Stroke,
} from './kit';

/*
 * "Deluxe" package: one brand thread (yellow, red, fine white) that travels through the whole opening as if it
 * were a single take, floating behind and in front of the people, plus supporting motion graphics.
 * Rendered in two passes (back = behind the people, front = over them); tools/composite_deluxe.sh puts the
 * people's cut-outs between them. Graphics end by 10.82 s: the logo card is untouched.
 */

const win = (f: number, a: number, b: number) => f >= s(a) && f < s(b);

// ───────────── Shot 1 · flambé (0 – 1.95 s). Camera pushes in toward the pan.
const Flambe: React.FC = () => {
  const f = useF();
  const k = interpolate(f, [0, s(0.2), s(1.2), s(1.95)], [0.94, 1, 1.6, 2.5], {...clamp, easing: easeInOut});
  return (
    <Cam scale={k} px={870} py={740}>
      <On layer="back">
        <BokehStars seed="fl" items={[
          {x: 1500, y: 300, r: 26, c: YELLOW, at: 0, until: s(1.9)},
          {x: 1780, y: 520, r: 18, c: WHITE, at: 4, until: s(1.9)},
          {x: 140, y: 380, r: 22, c: RED, at: 6, until: s(1.6)},
        ]} />
        <Dashes x={1430} y={150} count={6} w={18} h={86} gap={16} inAt={s(0.25)} outAt={s(1.35)} opacity={0.9} />
        <Bundle seed="fl" pts={[[-260, 760], [200, 640], [640, 560], [1000, 600], [1380, 700], [1720, 560], [2200, 300]]}
          on={[s(0.05), s(0.95)]} off={[s(0.85), s(1.5)]} />
      </On>
      <On layer="front">
        <svg width={1920} height={1080} style={{...abs, left: 0, top: 0, overflow: 'visible'}}>
          {(() => {
            const d = spline([[-200, 1070], [380, 1000], [900, 1050], [1400, 1000], [2150, 930]]);
            const head = ramp(f, s(0.3), s(1.25)), tail = ramp(f, s(1.15), s(1.95), easeIn);
            return <>
              <Stroke d={d} head={head} tail={tail} color={RED} width={12} />
              <Stroke d={d.replace(/(\d+\.?\d*),(\d+\.?\d*)/g, (_, x, y) => `${x},${+y + 22}`)} head={head * 0.97} tail={tail} color={WHITE} width={5} />
            </>;
          })()}
        </svg>
        <Embers seed="fl" x0={980} x1={1500} y={880} rise={620} from={s(0.7)} to={s(2.0)} count={46} />
      </On>
    </Cam>
  );
};

// ───────────── Transition A · fire/steam (1.8 – 2.6 s): the thread swells into full-frame leaning bands.
const SwellWipe: React.FC<{start: number; dir: 1 | -1}> = ({start, dir}) => {
  const f = useF();
  const bands = [
    {c: YELLOW, w: 560, d: 0, dur: 15},
    {c: RED, w: 430, d: 2.2, dur: 15},
    {c: WHITE, w: 60, d: 4.2, dur: 15},
    {c: YELLOW, w: 24, d: 5.2, dur: 15},
  ];
  const span = 1920 + 1200 + 1080 * LEAN_TAN * 2;
  return (
    <On layer="front">
      {bands.map((b, i) => {
        const t = ramp(f, start + b.d, start + b.d + b.dur, easeInOut);
        if (t <= 0 || t >= 1) return null;
        const left = dir === 1 ? -b.w - 500 + t * span : 1920 + 500 - t * span;
        return (
          <div key={i} style={{
            ...abs, top: -60, height: 1200, width: b.w, left, background: b.c, borderRadius: 70,
            transform: `skewX(${-LEAN}deg)`, boxShadow: i < 2 ? '0 0 60px rgba(0,0,0,0.25)' : undefined,
          }}>
            {i === 0 && (
              <div style={{...abs, left: b.w * 0.5, top: 470, width: b.w * 0.42}}>
                <Dashes x={0} y={0} count={5} w={18} h={120} gap={26} inAt={start} outAt={start + 40} colors={[RED]} />
              </div>
            )}
          </div>
        );
      })}
    </On>
  );
};

// ───────────── Shot 2 · chopping peppers (2.45 – 3.56 s).
const Chop: React.FC = () => {
  const f = useF();
  const k = interpolate(f, [s(2.45), s(3.56)], [0.97, 1.05], clamp);
  const chili = ramp(f, s(2.75), s(3.15), easeOut);
  const chiliOut = ramp(f, s(3.35), s(3.55), easeIn);
  return (
    <Cam scale={k} px={860} py={560}>
      <On layer="back">
        <BokehStars seed="ch" items={[
          {x: 1650, y: 230, r: 20, c: YELLOW, at: s(2.5), until: s(3.6)},
          {x: 260, y: 300, r: 16, c: WHITE, at: s(2.6), until: s(3.6)},
        ]} />
        <Bundle seed="ch" pts={[[-260, 520], [260, 420], [680, 340], [1000, 420], [1380, 470], [1740, 520], [2200, 620]]}
          on={[s(2.4), s(2.95)]} off={[s(2.95), s(3.56)]} />
      </On>
      <On layer="front">
        <svg width={1920} height={1080} style={{...abs, left: 0, top: 0, overflow: 'visible'}}>
          {(() => {
            const d = spline([[2160, 1010], [1600, 965], [1000, 1015], [420, 975], [-220, 1010]]);
            return <>
              <Stroke d={d} head={ramp(f, s(2.6), s(3.15))} tail={ramp(f, s(3.05), s(3.56), easeIn)} color={YELLOW} width={14} />
              <Stroke d={d} head={ramp(f, s(2.66), s(3.2))} tail={ramp(f, s(3.1), s(3.56), easeIn)} color={WHITE} width={4} />
            </>;
          })()}
        </svg>
        <div style={{...abs, inset: 0, opacity: 1 - chiliOut, transform: `translateY(${-chiliOut * 24}px)`}}>
          <Chili x={1500} y={470} size={170} progress={chili} />
          <Dashes x={1520} y={680} count={4} w={12} h={58} gap={13} inAt={s(2.95)} outAt={s(3.4)} colors={[YELLOW, RED]} />
        </div>
      </On>
    </Cam>
  );
};

// ───────────── Shot 3 · the waiter (3.56 – 5.0 s). Slow push-in on the waiter.
const Waiter: React.FC = () => {
  const f = useF();
  const k = interpolate(f, [s(3.56), s(3.9), s(4.7), s(5.0)], [0.88, 1, 1.55, 1.75], {...clamp, easing: easeInOut});
  return (
    <Cam scale={k} px={610} py={107}>
      <On layer="back">
        {/* a stadium-style LED strip running along the back wall */}
        <Dashes x={1180} y={60} count={14} w={16} h={64} gap={22} inAt={s(3.6)} outAt={s(4.75)} scroll={-2.2} opacity={0.85} />
        <BokehStars seed="wa" items={[
          {x: 300, y: 120, r: 22, c: YELLOW, at: s(3.6), until: s(5.0)},
          {x: 1150, y: 380, r: 14, c: WHITE, at: s(3.7), until: s(5.0)},
        ]} />
        <Bundle seed="wa" pts={[[-260, 540], [240, 480], [650, 400], [1000, 420], [1380, 490], [1760, 410], [2200, 330]]}
          on={[s(3.56), s(4.2)]} off={[s(4.35), s(5.0)]} />
      </On>
      <On layer="front">
        <svg width={1920} height={1080} style={{...abs, left: 0, top: 0, overflow: 'visible'}}>
          {(() => {
            const d = spline([[2160, 930], [1500, 880], [900, 950], [300, 900], [-220, 950]]);
            return <Stroke d={d} head={ramp(f, s(3.75), s(4.35))} tail={ramp(f, s(4.4), s(4.95), easeIn)} color={RED} width={9} />;
          })()}
        </svg>
      </On>
    </Cam>
  );
};

// ───────────── Transition B · whip (4.9 – 5.5 s): speed streaks ride the camera smear.
const Streaks: React.FC<{start: number}> = ({start}) => {
  const f = useF();
  const lines = Array.from({length: 16}).map((_, i) => ({
    y: 90 + ((i * 397) % 900), w: 260 + ((i * 173) % 640), h: [6, 14, 26, 4][i % 4],
    c: [YELLOW, RED, WHITE, YELLOW][i % 4], d: (i * 0.7) % 5,
  }));
  return (
    <On layer="front">
      {lines.map((l, i) => {
        const t = ramp(f, start + l.d, start + l.d + 9, easeInOut);
        if (t <= 0 || t >= 1) return null;
        return (
          <div key={i} style={{
            ...abs, top: l.y, height: l.h, width: l.w, borderRadius: l.h, background: l.c,
            left: 1920 + 200 - t * (1920 + l.w + 400), opacity: interpolate(t, [0, 0.15, 0.8, 1], [0, 1, 1, 0]),
            transform: `skewX(${-LEAN}deg)`,
          }} />
        );
      })}
    </On>
  );
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

// ───────────── Shot 4 · plating (5.45 – 7.8 s). Dolly-in to the plate.
const Plating: React.FC = () => {
  const f = useF();
  const k = interpolate(f, [s(5.45), s(6.0), s(7.0), s(7.8)], [0.72, 1, 1.4, 1.55], {...clamp, easing: easeInOut});
  const mid = croq(1, f);
  // the orbit: an ellipse under the three croquetas, in the plate's perspective
  const cx = mid.x, cy = mid.y + mid.r * 0.62, rx = mid.r * 3.5, ry = mid.r * 0.78;
  const orbit = (scaleR: number) => {
    const a0 = Math.PI * 1.08, a1 = -Math.PI * 0.08;
    const pts = Array.from({length: 25}).map((_, i) => {
      const a = a0 + (a1 - a0) * (i / 24);
      return `${(cx + rx * scaleR * Math.cos(a)).toFixed(1)},${(cy + ry * scaleR * Math.sin(a)).toFixed(1)}`;
    });
    return 'M' + pts.join(' L');
  };
  const oHead = ramp(f, s(6.35), s(6.95)), oTail = ramp(f, s(7.45), s(7.8), easeIn);
  const ringOut = ramp(f, s(7.5), s(7.75), easeIn);
  return (
    <>
      <Cam scale={k} px={800} py={1150}>
        <On layer="back">
          <BokehStars seed="pl" items={[
            {x: 1650, y: 250, r: 24, c: YELLOW, at: s(5.6), until: s(7.8)},
            {x: 230, y: 200, r: 16, c: WHITE, at: s(5.8), until: s(7.6)},
          ]} />
          <Bundle seed="pl" pts={[[-260, 560], [260, 440], [680, 350], [1040, 390], [1440, 470], [1800, 420], [2200, 520]]}
            on={[s(5.5), s(6.35)]} off={[s(6.95), s(7.8)]} />
        </On>
      </Cam>
      <On layer="front">
        <svg width={1920} height={1080} style={{...abs, left: 0, top: 0, overflow: 'visible'}}>
          {f >= s(6.2) && <>
            <Stroke d={orbit(1)} head={oHead} tail={oTail} color={YELLOW} width={10} />
            <Stroke d={orbit(1.1)} head={ramp(f, s(6.45), s(7.0))} tail={oTail} color={RED} width={5} />
            <Stroke d={orbit(1.19)} head={ramp(f, s(6.55), s(7.05))} tail={oTail} color={WHITE} width={2.5} />
          </>}
          {[0, 1, 2].map((i) => {
            const c = croq(i, f);
            const p = ramp(f, s(6.9) + i * 2.5, s(6.9) + i * 2.5 + 7, easeOut) - ringOut;
            if (p <= 0) return null;
            const yy = c.y - c.r - 70 - (1 - p) * 30;
            return <g key={i} opacity={p}>
              <polygon points={starPts(16 + c.r * 0.08)} fill={i === 1 ? RED : YELLOW}
                transform={`translate(${c.x} ${yy}) rotate(${(1 - p) * -72})`} />
            </g>;
          })}
        </svg>
      </On>
    </>
  );
};

// ───────────── Shot 5 · the plate slides in (7.8 – 8.68 s): thread glides on the steel with its reflection.
const Plate: React.FC = () => {
  const f = useF();
  const plateLeft = interpolate(f, [s(7.8), s(8.5)], [470, 590], clamp);
  const sp = ramp(f, s(7.85), s(8.05), easeOut) - ramp(f, s(8.3), s(8.5), easeIn);
  const lines = [{y: 610, w: 140, c: YELLOW}, {y: 655, w: 210, c: RED}, {y: 700, w: 100, c: WHITE}];
  const bundle = (
    <Bundle seed="pt" pts={[[-260, 900], [300, 870], [800, 885], [1300, 860], [1800, 880], [2200, 860]]}
      on={[s(7.8), s(8.25)]} off={[s(8.2), s(8.68)]} amp={10} scale={0.8} />
  );
  return (
    <On layer="front">
      {bundle}
      <div style={{...abs, inset: 0, transform: 'translateY(1780px) scaleY(-1)', transformOrigin: '0 0', opacity: 0.22, filter: 'blur(5px)'}}>
        {bundle}
      </div>
      {lines.map((l, i) => (
        <div key={i} style={{
          ...abs, top: l.y, height: i === 2 ? 5 : 10, borderRadius: 10, background: l.c,
          width: l.w * sp, left: plateLeft - 30 - l.w * sp - i * 14, transform: `skewX(${-LEAN}deg)`, opacity: sp,
        }} />
      ))}
    </On>
  );
};

// ───────────── Shot 6 · cloche and bell (8.68 – 10.82 s). Camera pulls back; the thread gathers into the card's bands.
const Cloche: React.FC = () => {
  const f = useF();
  const k = interpolate(f, [s(8.68), s(9.0), s(10.2), s(10.82)], [1.45, 1, 0.78, 0.75], {...clamp, easing: easeOut});
  const ding = interpolate(f, [s(9.7), s(9.7) + 10], [0, 1], clamp);
  const gather = ramp(f, s(9.85), s(10.15), easeOut);
  const leave = ramp(f, s(10.3), s(10.52), easeIn);
  const bands = [{c: YELLOW, w: 74, x: -10}, {c: RED, w: 48, x: 72}, {c: WHITE, w: 10, x: 132}];
  return (
    <>
      <Cam scale={k} px={490} py={1190}>
        <On layer="back">
          <BokehStars seed="cl" items={[
            {x: 1500, y: 240, r: 24, c: YELLOW, at: s(8.9), until: s(10.8)},
            {x: 380, y: 160, r: 18, c: WHITE, at: s(9.0), until: s(10.8)},
            {x: 1820, y: 520, r: 14, c: RED, at: s(9.2), until: s(10.8)},
          ]} />
          <Bundle seed="cl" pts={[[-260, 620], [260, 520], [680, 440], [1050, 520], [1440, 610], [1800, 520], [2200, 430]]}
            on={[s(8.8), s(9.45)]} off={[s(9.55), s(10.1)]} />
        </On>
        <On layer="front">
          <svg width={1920} height={1080} style={{...abs, left: 0, top: 0, overflow: 'visible'}}>
            {(() => {
              const d = spline([[-220, 905], [500, 885], [1300, 925], [2200, 885]]);
              return <>
                <Stroke d={d} head={ramp(f, s(9.0), s(9.6))} tail={ramp(f, s(9.9), s(10.35), easeIn)} color={YELLOW} width={9} />
                <Stroke d={d} head={ramp(f, s(9.06), s(9.66))} tail={ramp(f, s(9.95), s(10.4), easeIn)} color={WHITE} width={3} />
              </>;
            })()}
          </svg>
        </On>
      </Cam>
      <On layer="front">
        {ding > 0 && ding < 1 && <Burst cx={1382} cy={905} progress={ding} r0={40} r1={120} rays={9} />}
        {ding > 0 && ding < 1 && (
          <svg width={1920} height={1080} style={{...abs, left: 0, top: 0, overflow: 'visible'}}>
            <Glint x={1382} y={890} size={140 * (1 - ding * 0.6)} opacity={1 - ding} />
          </svg>
        )}
        {bands.map((b, i) => (
          <div key={i} style={{
            ...abs, top: -60, height: 1200, width: b.w, borderRadius: 30, background: b.c,
            left: b.x - (1 - gather) * (300 + i * 40) - leave * 340, transform: `skewX(${-LEAN}deg)`,
            boxShadow: i < 2 ? '8px 0 30px rgba(0,0,0,0.25)' : undefined,
          }} />
        ))}
        <div style={{...abs, inset: 0, transform: `translateX(${-(1 - gather) * 300 - leave * 340}px)`}}>
          <Dashes x={160} y={470} count={4} w={14} h={110} gap={20} inAt={s(9.95)} outAt={s(10.22)} />
        </div>
      </On>
    </>
  );
};

/** A soft warm light sweep over the cuts, in brand colours (only in front pass). */
const LightSweep: React.FC<{at: number; dur: number}> = ({at, dur}) => {
  const f = useF();
  const t = ramp(f, at, at + dur, easeInOut);
  if (t <= 0 || t >= 1) return null;
  const o = Math.sin(t * Math.PI) * 0.35;
  return (
    <On layer="front">
      <div style={{
        ...abs, inset: 0, opacity: o,
        background: `linear-gradient(${90 + LEAN}deg, rgba(254,209,0,0) ${t * 100 - 40}%, rgba(254,209,0,0.55) ${t * 100 - 12}%, rgba(255,255,255,0.6) ${t * 100}%, rgba(237,39,39,0.4) ${t * 100 + 12}%, rgba(237,39,39,0) ${t * 100 + 40}%)`,
      }} />
    </On>
  );
};

/** All graphics for one depth pass, on a transparent background. */
export const DeluxeLayer: React.FC<{layer: Layer}> = ({layer}) => {
  const f = useF();
  return (
    <LayerCtx.Provider value={layer}>
      <AbsoluteFill style={{filter: layer === 'back' ? 'blur(1.6px)' : 'drop-shadow(0 10px 18px rgba(0,0,0,0.35))'}}>
        <GlowDefs />
        {win(f, 0, 1.98) && <Flambe />}
        {win(f, 1.75, 2.7) && <SwellWipe start={s(1.74)} dir={1} />}
        {win(f, 2.35, 3.6) && <Chop />}
        {win(f, 3.4, 3.75) && <LightSweep at={s(3.44)} dur={7} />}
        {win(f, 3.56, 5.05) && <Waiter />}
        {win(f, 4.85, 5.6) && <Streaks start={s(4.92)} />}
        {win(f, 5.4, 7.82) && <Plating />}
        {win(f, 7.7, 7.95) && <LightSweep at={s(7.72)} dur={6} />}
        {win(f, 7.8, 8.7) && <Plate />}
        {win(f, 8.6, 8.8) && <LightSweep at={s(8.6)} dur={5} />}
        {win(f, 8.68, 10.83) && <Cloche />}
      </AbsoluteFill>
    </LayerCtx.Provider>
  );
};

export const DeluxeBack: React.FC = () => <DeluxeLayer layer="back" />;
export const DeluxeFront: React.FC = () => <DeluxeLayer layer="front" />;

/** Studio preview only (no cut-outs: back graphics simply sit under the front ones). */
export const DeluxePreview: React.FC = () => (
  <AbsoluteFill style={{background: 'black'}}>
    <OffthreadVideo src={staticFile('tapas-50p.mp4')} />
    <DeluxeLayer layer="back" />
    <DeluxeLayer layer="front" />
  </AbsoluteFill>
);
