import * as ROM from "./rom";

import DrawSurface from "./drawSurface";
import { range, d } from "./util";
import ColorAttribute from "./colorAttribute";
import XY from "./xy";

const numberOfLaserFrames = 4;

// all values in charater blocks, not in pixels
export default class Laser {
  laserFrameBytes: number[][]; // 4 frames of 8 bytes (=4 chars) for laser beam graphics

  public constructor(
    private leftSideBeamStartX: number,
    private leftSideBeamStartY: number,
    private beamMaxWidth: number
  ) {
    this.laserFrameBytes = range(numberOfLaserFrames).map((frameNumber) =>
      range(8).map((y) => ROM.peek(d("ECBD") + 8 * frameNumber + y))
    );
  }

  updateBeam(room: DrawSurface, time: number) {
    const color = new ColorAttribute((time % 7) + 1, 0, true);
    const laserGraphicFrame = Math.round(time/60) % numberOfLaserFrames;

    // time to grow from left to right, then shrink back, times 3
    const activityTimeWindow = this.beamMaxWidth * 2 * 3;
    // beam randomized makes it so that not all beams fire at the same time
    const beamRandomizer =
      this.leftSideBeamStartX * 7000 + this.leftSideBeamStartY * 18300;
    const currentPhase = ((Math.round(time + beamRandomizer)/200) * 2) % activityTimeWindow; // 6 is beam activity ...

    const currentWidth = Math.round(
      currentPhase < this.beamMaxWidth * 2 // ... so fire every 1/6 time
        ? currentPhase > this.beamMaxWidth
          ? 2 * this.beamMaxWidth - currentPhase
          : currentPhase
        : 0 // beam rests
    );

    // erase old beam
    range(this.beamMaxWidth).forEach((x) =>
      range(8).forEach((y) => {
        room.plotByte(
          new XY(
            (this.leftSideBeamStartX + x) * 8,
            this.leftSideBeamStartY * 8 + y
          ),
          0,
          color,
          0
        );
      })
    );

    // draw new beam
    if (currentWidth) {
      range(currentWidth).forEach((x) =>
        range(8).forEach((y) => {
          room.plotByte(
            new XY(
              (this.leftSideBeamStartX + x) * 8,
              this.leftSideBeamStartY * 8 + y
            ),
            this.laserFrameBytes[laserGraphicFrame][y],
            color,
            255
          );
        })
      );
    }
  }
}
