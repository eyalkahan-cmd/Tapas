import React from 'react';
import {AbsoluteFill, Audio, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';

// ZUK shot, 50p. Replaces the 2.8–3.44 s dissolve with one continuous camera pull-back:
// A (plate on the counter, already pulling back) is slowed with interpolation to keep the
// original length, then cuts on the plate to B, which starts scaled so its plate matches A's
// exactly and keeps pulling back until it settles at full frame.

export const ZUK_FPS = 50;
export const ZUK_DURATION = 322; // 6.44 s, same as the source

const A_SLOW_FROM = 100; // 2.00 s
const CUT = 172; // 3.44 s: first clean frame of B in the source
const A_SLOW_FRAMES = 69; // interpolated clip length
const SETTLE = 52; // frames for B to settle to full frame

// Plate centre and width, measured on the last A frame and first B frame.
const A_PLATE = {x: 940, y: 668, w: 915};
const B_PLATE = {x: 1015, y: 755, w: 592};
const S0 = A_PLATE.w / B_PLATE.w; // ≈1.60
const A_RATE = 0.0066; // A's plate shrinks ~0.66 %/frame at the cut (log scale)

// Cubic Hermite in log-scale: starts at A's pull-back speed, eases out to rest.
const scaleAt = (f: number) => {
  const t = Math.min(1, Math.max(0, f / SETTLE));
  const L0 = Math.log(S0);
  const m0 = -A_RATE * SETTLE;
  const h00 = 2 * t ** 3 - 3 * t ** 2 + 1;
  const h10 = t ** 3 - 2 * t ** 2 + t;
  return Math.exp(L0 * h00 + m0 * h10);
};

const BScene: React.FC = () => {
  const f = useCurrentFrame();
  const S = scaleAt(f);
  const k = (S - 1) / (S0 - 1);
  const tx = (A_PLATE.x - B_PLATE.x) * k;
  const ty = (A_PLATE.y - B_PLATE.y) * k;
  return (
    <AbsoluteFill style={{
      transformOrigin: `${B_PLATE.x}px ${B_PLATE.y}px`,
      transform: `translate(${tx}px, ${ty}px) scale(${S})`,
    }}>
      <OffthreadVideo muted src={staticFile('zuk-50p.mp4')} startFrom={CUT} />
    </AbsoluteFill>
  );
};

export const ZukOneShot: React.FC = () => (
  <AbsoluteFill style={{background: 'black'}}>
    <Sequence durationInFrames={A_SLOW_FROM}>
      <OffthreadVideo muted src={staticFile('zuk-50p.mp4')} />
    </Sequence>
    <Sequence from={A_SLOW_FROM} durationInFrames={CUT - A_SLOW_FROM}>
      <OffthreadVideo muted src={staticFile('zuk-a-slow.mp4')} playbackRate={A_SLOW_FRAMES / (CUT - A_SLOW_FROM)} />
    </Sequence>
    <Sequence from={CUT}>
      <BScene />
    </Sequence>
    <Audio src={staticFile('zuk-50p.mp4')} />
  </AbsoluteFill>
);
