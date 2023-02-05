import DrawSurface from "./drawSurface";
import { range } from "./util";
import ColorAttribute from "./colorAttribute";
import XY from "./xy";

const numberOfLaserFrames = 4;

// all values in charater blocks, not in pixels
export default class Floater {
  public constructor(
    private leftSideStartX: number,
    private leftSideStartY: number,
    private height: number,
    private floaterCollisionMap: DrawSurface
  ) {
    range((this.height + 4) * 8).forEach((yPixelOffset) =>
      range(2).forEach(xCharOffset =>
      floaterCollisionMap.plotByte(
        new XY((leftSideStartX + 1 + xCharOffset) * 8, leftSideStartY * 8 - 16 + yPixelOffset),
        255,
        new ColorAttribute(3, 2, true) // doesn't really matter
      )
    )
    );
  }

  private changeFloaterColors(
    room: DrawSurface,
    colorForY: (y: number) => ColorAttribute
  ) {
    range(this.height).forEach((y) => {
      const color = colorForY(y);
      room.setAttribute(
        new XY(this.leftSideStartX, this.leftSideStartY + y),
        color
      );
      room.setAttribute(
        new XY(this.leftSideStartX + 3, this.leftSideStartY + y),
        color
      );
    });
  }

  updateFloater(room: DrawSurface, time: number, active: boolean) {
    this.changeFloaterColors(room, (y) => new ColorAttribute(7, 0, false));

    if (active) {
      const colorStart = Math.round(time / 50);
      this.changeFloaterColors(
        room,
        (y) => new ColorAttribute(((colorStart + y) % 7) + 1, 0, false)
      );
    }
  }
}
