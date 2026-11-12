import React from 'react';
import {Composition} from 'remotion';
import {DURATION, FPS, H, W} from './brand';
import {TapasBranded} from './TapasBranded';
import {ZUK_DURATION, ZUK_FPS, ZukOneShot} from './ZukOneShot';

export const Root: React.FC = () => (
  <>
  <Composition id="TapasBranded" component={TapasBranded} durationInFrames={DURATION} fps={FPS} width={W} height={H} />
  <Composition id="ZukOneShot" component={ZukOneShot} durationInFrames={ZUK_DURATION} fps={ZUK_FPS} width={W} height={H} />
  </>
);
