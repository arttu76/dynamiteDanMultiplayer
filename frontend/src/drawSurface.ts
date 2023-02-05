import ColorAttribute from "./colorAttribute";
import XY from "./xy";

const normalColors = [
  "#000",
  "#009",
  "#900",
  "#909",
  "#090",
  "#099",
  "#990",
  "#999",
];

const brightColors = [
  "#000",
  "#00F",
  "#F00",
  "#F0F",
  "#0F0",
  "#0FF",
  "#FF0",
  "#FFF",
];

export default class DrawSurface extends XY {
  widthInPixels: number;
  heightInPixels: number;

  canvas: HTMLCanvasElement;
  canvasRenderingContext2D: CanvasRenderingContext2D;

  pixels: boolean[][];
  attribs: (ColorAttribute | null)[][];
  noInkIsTransparent: boolean;
  customCollisionMap: boolean[][] | null;

  debugTexts: { text: string; xyPixelLocation: XY }[];

  public flippedHorizontally: boolean;

  constructor(
    position: XY,
    widthInPixels: number,
    heightInPixels: number,
    noInkIsTransparent: boolean,
    customCollisionMap: boolean,
    color: ColorAttribute = null,
    pixelData: number[] = null,
    xPixelOffset: number = 0
  ) {
    super(position.x, position.y);

    this.widthInPixels = widthInPixels;
    this.heightInPixels = heightInPixels;

    this.noInkIsTransparent = noInkIsTransparent;

    this.canvas = document.createElement("canvas");
    this.canvas.width = widthInPixels;
    this.canvas.height = heightInPixels;
    this.canvas.style.position = "absolute";
    this.canvas.style.width = widthInPixels + "px";
    this.canvas.style.height = heightInPixels + "px";

    const initializeArray = <T>(itemSize: number, init: T): T[][] =>
      new Array(heightInPixels / itemSize)
        .fill(-1)
        .map(() => new Array(widthInPixels / itemSize).fill(init));

    this.pixels = initializeArray(1, false);
    this.attribs = initializeArray(8, null);
    this.customCollisionMap = customCollisionMap
      ? initializeArray(1, false)
      : null;

    this.canvasRenderingContext2D = this.canvas.getContext("2d", {
      alpha: true,
      antialias: false,
    }) as CanvasRenderingContext2D;

    this.flippedHorizontally = false;

    if (color && pixelData) {
      for (let y = 0; y < heightInPixels; y++) {
        for (let x = 0; x < widthInPixels; x++) {
          this.plotByte(
            new XY(x * 8 + xPixelOffset, y),
            pixelData[(widthInPixels / 8) * y + x],
            color
          );
        }
      }
    }

    this.attachToHtml().hide();
    this.setPosition(position);

    this.debugTexts = [];
  }

  show(): DrawSurface {
    this.setStyle({ display: "block" });
    return this;
  }

  hide(): DrawSurface {
    this.setStyle({ display: "none" });
    return this;
  }

  attachToHtml(): DrawSurface {
    document.querySelector("#container").appendChild(this.canvas);
    return this;
  }

  detachFromHtml(): DrawSurface {
    this.canvas.remove();
    return this;
  }

  plot(
    xy: XY,
    pixel: boolean,
    color: ColorAttribute,
    customCollisionPixel: boolean = false
  ) {
    this.canvasRenderingContext2D.fillStyle = (
      color.bright ? brightColors : normalColors
    )[pixel ? color.ink : color.paper];

    if (pixel || !this.noInkIsTransparent) {
      this.canvasRenderingContext2D.fillRect(xy.x, xy.y, 1, 1);
    }

    this.pixels[xy.y][xy.x] = pixel;

    if (this.customCollisionMap && customCollisionPixel !== null) {
      this.customCollisionMap[xy.y][xy.x] = customCollisionPixel;
    }
  }

  plotByte(
    xyPixelLocation: XY,
    byte: number,
    attribute: ColorAttribute,
    customCollisionByte: number = 0
  ) {
    const attribX = Math.floor(xyPixelLocation.x / 8);
    const attribY = Math.floor(xyPixelLocation.y / 8);

    this.attribs[attribY][attribX] = attribute;

    const plotBit = (location: XY, mask: number, offset: number) =>
      this.plot(
        location.getOffset(offset, 0),
        !!(byte & mask),
        attribute,
        customCollisionByte === null ? null : !!(customCollisionByte & mask)
      );

    plotBit(xyPixelLocation, 128, 0);
    plotBit(xyPixelLocation, 64, 1);
    plotBit(xyPixelLocation, 32, 2);
    plotBit(xyPixelLocation, 16, 3);
    plotBit(xyPixelLocation, 8, 4);
    plotBit(xyPixelLocation, 4, 5);
    plotBit(xyPixelLocation, 2, 6);
    plotBit(xyPixelLocation, 1, 7);
  }

  addDebugText(text: string, xyPixelLocation: XY) {
    this.debugTexts.push({ text, xyPixelLocation });
  }

  flushDebugTexts() {
    const c = this.canvasRenderingContext2D;
    c.font = "8px Arial";
    c.fillStyle = "#fff";

    this.debugTexts.forEach((dt) =>
      c.fillText(dt.text, dt.xyPixelLocation.x + 4, dt.xyPixelLocation.y+ 4)
    );
    this.debugTexts = [];
  }

  setAttribute(attributeLocation: XY, color: ColorAttribute) {
    this.attribs[attributeLocation.y][attributeLocation.x] = color;
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        this.plot(
          new XY(attributeLocation.x * 8 + x, attributeLocation.y * 8 + y),
          this.pixels[attributeLocation.y * 8 + y][attributeLocation.x * 8 + x],
          color
        );
      }
    }
  }

  setPosition(position: XY): DrawSurface {
    this.x = position.x;
    this.y = position.y;

    this.canvas.style.left = this.x + "px";
    this.canvas.style.top = this.y + "px";

    return this;
  }

  setStyle(css: { [key: string]: string }): DrawSurface {
    Object.keys(css).forEach((key) => {
      this.canvas.style.setProperty(key, css[key]);
    });
    return this;
  }

  flipHorizontally(flip: boolean): DrawSurface {
    this.flippedHorizontally = flip;
    this.setStyle({
      transform: "scaleX(" + (flip ? -1 : 1) + ")",
    });
    return this;
  }

  isFlippedHorizontally(): boolean {
    return this.flippedHorizontally;
  }

  updateCustomCollisionMap(
    locationInPixels: XY,
    widthInPixels: number,
    heightInPixels: number,
    value: boolean
  ) {
    for (
      let y = locationInPixels.y;
      y < locationInPixels.y + heightInPixels;
      y++
    ) {
      for (
        let x = locationInPixels.x;
        x < locationInPixels.x + widthInPixels;
        x++
      ) {
        this.customCollisionMap[y][x] = value;
      }
    }
  }

  isInCollisionWith(another: DrawSurface): boolean {
    if (
      this.x + this.widthInPixels < another.x ||
      this.x > another.x + another.widthInPixels ||
      this.y + this.heightInPixels < another.y ||
      this.y > another.y + another.heightInPixels
    ) {
      return false;
    }

    const collisionData = this.customCollisionMap || this.pixels;
    const anotherCollisionData = another.customCollisionMap || another.pixels;

    for (let y = 0; y < this.heightInPixels; y++) {
      const yInAnother = y + this.y - another.y;
      if (yInAnother < 0 || yInAnother > another.heightInPixels - 1) {
        continue;
      }

      for (let x = 0; x < this.widthInPixels; x++) {
        const xInAnother = x + this.x - another.x;
        if (xInAnother < 0 || xInAnother > another.widthInPixels - 1) {
          continue;
        }

        if (!collisionData[y][x]) {
          continue;
        }

        if (anotherCollisionData[yInAnother][xInAnother]) {
          return true;
        }
      }
    }

    return false;
  }
}
