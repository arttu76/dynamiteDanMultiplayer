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

  public nameContainer: HTMLElement;
  public name: string;

  public constructor(position: XY, facingLeft = true, frame = 0, name: string) {
    super(position.x, position.y);
    this.facingLeft = facingLeft;
    this.frame = frame;

    const frames = this.parseDanFrames();
    this.leftFacingFrames = frames.leftFacingFrames;
    this.rightFacingFrames = frames.rightFacingFrames;

    this.name = name;
    this.nameContainer = document.createElement("div");
    this.nameContainer.innerText = this.name;
    this.nameContainer.style.position = "absolute";
    this.nameContainer.style.color = "white";
    this.nameContainer.style.fontFamily = "Arial";
    this.nameContainer.style.fontSize = "8px";
    this.nameContainer.style.zIndex = "2000";
    this.nameContainer.style.width = "50px";
    this.nameContainer.style.marginLeft = "-20px";
    this.nameContainer.style.overflow = "hidden";
    this.nameContainer.style.textAlign = "center";
    this.nameContainer.style.opacity = "0.75";
    this.nameContainer.style.textShadow = "0px 0px 1px black";
    this.nameContainer.style.transform = "translate3d(0,0,0)";

    document.querySelector("#container").appendChild(this.nameContainer);

    this.move(new XY(0, 0));
  }

  private parseDanFrames(): {
    rightFacingFrames: DrawSurface[];
    leftFacingFrames: DrawSurface[];
  } {
    const grabFrames = (offsetHex: string, pixelOffsets: number[]) =>
      range(4).map((index) =>
        new DrawSurface(
          new XY(0, 0),
          danWidthInChars * 8,
          danHeightInChars * 8,
          true,
          false,
          danColor,
          ROM.copy(d(offsetHex) + danDataSize * index, danDataSize),
          pixelOffsets[index] // pixel data for dan is not left-aligned
        ).setStyle({
          "z-index": "10000",
          "transform": "translate3d(0,0,0)"
        })
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

    this.nameContainer.style.top = this.y + 30 + "px";
    this.nameContainer.style.left = this.x + "px";
  }

  rename(name: string) {
    this.name = name;
    this.nameContainer.innerText = name;
  }

  setAllAttributes(
    xy: XY,
    facingLeft: boolean,
    frameNumber: number,
    name: string
  ) {
    this.x = xy.x;
    this.y = xy.y;
    this.move(new XY(0, 0));

    this.forAllFrames((f) => f.hide());
    this.facingLeft = facingLeft;
    this.frame = frameNumber;
    this.getCurrentFrame().show();

    this.rename(name);
  }

  destroy() {
    this.forAllFrames((f) => f.detachFromHtml());
    this.nameContainer?.remove();
  }
}
