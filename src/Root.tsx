import React from 'react';
import {Composition} from 'remotion';
import {DURATION, FPS, H, W} from './brand';
import {TapasBranded} from './TapasBranded';
import {DeluxeBack, DeluxeFront, DeluxePreview} from './deluxe/Deluxe';

const common = {durationInFrames: DURATION, fps: FPS, width: W, height: H};

export const Root: React.FC = () => (
  <>
    <Composition id="TapasBranded" component={TapasBranded} {...common} />
    {/* Deluxe version: preview in studio; final picture comes from tools/composite_deluxe.sh */}
    <Composition id="DeluxePreview" component={DeluxePreview} {...common} />
    <Composition id="DeluxeBack" component={DeluxeBack} {...common} />
    <Composition id="DeluxeFront" component={DeluxeFront} {...common} />
  </>
);
