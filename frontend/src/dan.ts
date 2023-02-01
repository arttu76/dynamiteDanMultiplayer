import * as ROM from "./rom";
import XY from "./xy";
import { range, h, d, b } from "./util";

import DrawSurface from "./drawSurface";
import ColorAttribute from "./colorAttribute";

const danWidthInChars = 3;
const danHeightInChars = 4;
// annoyingly the dan sprite is not 4 chars
// (32 pixels) tall, but 32-3 = 29 pixels tall
const danHeightDeficiencyInPixels = 4;

const danDataSize =
  danWidthInChars * (danHeightInChars * 8 - danHeightDeficiencyInPixels);
const danColor = new ColorAttribute(5, 0, false);

export default class Dan extends XY {
  public x: number;
  public y: number;

  public jumpFrame = 0;
  public jumpMaxHeight = 24;

  public facingLeft: boolean = true;
  public frame: number = 0;
  public rightFacingFrames: DrawSurface[];
  public leftFacingFrames: DrawSurface[];

  public constructor(position: XY, facingLeft = true, frame = 0) {
    super(position.x, position.y);
    this.facingLeft = facingLeft;
    this.frame = frame;

    const frames = this.parseDanFrames();
    this.leftFacingFrames = frames.leftFacingFrames;
    this.rightFacingFrames = frames.rightFacingFrames;
  }

  private parseDanFrames(): {
    rightFacingFrames: DrawSurface[];
    leftFacingFrames: DrawSurface[];
  } {
    const grabFrames = (offsetHex: string, pixelOffsets: number[]) =>
      range(4).map(
        (index) =>
          new DrawSurface(
            new XY(0, 0),
            danWidthInChars * 8,
            danHeightInChars * 8,
            true,
            false,
            danColor,
            ROM.copy(d(offsetHex) + danDataSize * index, danDataSize),
            pixelOffsets[index] // pixel data for dan is not left-aligned
          )
      );

    return {
      rightFacingFrames: grabFrames("633A", [-2, -4, -6, -8]),
      leftFacingFrames: grabFrames("648A", [-4, -6, -8, -10]),
    };
  }

  getCurrentFrame(): DrawSurface {
    return (this.facingLeft ? this.leftFacingFrames : this.rightFacingFrames)[
      this.frame
    ];
  }

  private forAllFrames(func: (frame: DrawSurface) => void) {
    [...this.leftFacingFrames, ...this.rightFacingFrames].forEach(func);
  }

  private syncAllDanFrameXys() {
    const xy = this.getCopy();
    this.forAllFrames((f) => f.setPosition(xy));
  }

  move(xy: XY) {
    this.x += xy.x;
    this.y += xy.y;
    this.syncAllDanFrameXys();
  }

  setAllAttributes(xy: XY, facingLeft: boolean, frameNumber: number) {
    this.x = xy.x;
    this.y = xy.y;
    this.syncAllDanFrameXys();

    this.forAllFrames((f) => f.hide());
    this.facingLeft = facingLeft;
    this.frame = frameNumber;
    this.getCurrentFrame().show();
  }

  destroy() {
    this.forAllFrames((f) => f.detachFromHtml());
  }
}
