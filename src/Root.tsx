import React from 'react';
import {Composition} from 'remotion';
import {DURATION, FPS, H, W} from './brand';
import {TapasBranded} from './TapasBranded';

export const Root: React.FC = () => (
  <Composition id="TapasBranded" component={TapasBranded} durationInFrames={DURATION} fps={FPS} width={W} height={H} />
);
