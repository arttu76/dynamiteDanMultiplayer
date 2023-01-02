import ColorAttribute from "./colorAttribute";
import Positionable from "./positionable";

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

export default class DrawSurface extends Positionable {
  widthInPixels: number;
  heightInPixels: number;

  canvas: HTMLCanvasElement;
  canvasRenderingContext2D: CanvasRenderingContext2D;

  pixels: boolean[][];
  attribs: (ColorAttribute | null)[][];
  blackIsTransparent: boolean;

  public flippedHorizontally: boolean;

  constructor(
    x: number,
    y: number,
    widthInPixels: number,
    heightInPixels: number,
    blackIsTransparent: boolean,
    color: ColorAttribute = null,
    pixelData: number[] = null,
    xAdjust: number = 0 // offset for drawing pixels
  ) {
    super(x, y);

    this.widthInPixels = widthInPixels;
    this.heightInPixels = heightInPixels;

    this.blackIsTransparent = blackIsTransparent;

    this.canvas = document.createElement("canvas");
    this.canvas.width = widthInPixels;
    this.canvas.height = heightInPixels;
    this.canvas.style.position = "absolute";
    this.canvas.style.width = widthInPixels + "px";
    this.canvas.style.height = heightInPixels + "px";

    const initAttrib = <T>(divider: number, init: T): T[][] =>
      new Array(heightInPixels / divider)
        .fill(-1)
        .map(() => new Array(widthInPixels / divider).fill(init));

    this.pixels = initAttrib(1, false);
    this.attribs = initAttrib(8, null);

    this.canvasRenderingContext2D = this.canvas.getContext("2d", {
      alpha: true,
      antialias: false,
    }) as CanvasRenderingContext2D;

    this.flippedHorizontally = false;

    if (color && pixelData) {
      for (let y = 0; y < heightInPixels; y++) {
        for (let x = 0; x < widthInPixels; x++) {
          this.plotByte(
            x * 8 + xAdjust,
            y,
            pixelData[(widthInPixels / 8) * y + x],
            color
          );
        }
      }
    }

    this.attachToHtml().hide();
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

  plot(x: number, y: number, color: number, bright: boolean) {
    this.canvasRenderingContext2D.fillStyle = (
      bright ? brightColors : normalColors
    )[color];
    if (color !== 0 || !this.blackIsTransparent) {
      this.canvasRenderingContext2D.fillRect(x, y, 1, 1);
    }

    this.pixels[y][x] = color !== 0;
  }

  plotByte(x: number, y: number, byte: number, attribute: ColorAttribute) {
    const attribX = Math.floor(x / 8);
    const attribY = Math.floor(y / 8);

    const existingAttrib = this.attribs[attribY][attribX];

    const color = new ColorAttribute(
      (existingAttrib && existingAttrib.ink) || attribute.ink,
      (existingAttrib && existingAttrib.paper) || attribute.paper,
      (existingAttrib && existingAttrib.bright) || attribute.bright
    );

    this.attribs[attribY][attribX] = color;

    const plot = (x: number, y: number, bit: number, offset: number) =>
      this.plot(
        x + offset,
        y,
        byte & bit ? color.ink : color.paper,
        color.bright
      );

    plot(x, y, 128, 0);
    plot(x, y, 64, 1);
    plot(x, y, 32, 2);
    plot(x, y, 16, 3);
    plot(x, y, 8, 4);
    plot(x, y, 4, 5);
    plot(x, y, 2, 6);
    plot(x, y, 1, 7);
  }

  setAttribute(attribX: number, attribY: number, color: ColorAttribute) {
    this.attribs[attribY][attribX] = color;
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        this.plot(
          attribX * 8 + x,
          attribY * 8 + y,
          this.pixels[attribY * 8 + y][attribX * 8 + x]
            ? color.ink
            : color.paper,
          color.bright
        );
      }
    }
  }

  setPosition(x: number, y: number): DrawSurface {
    this.x = x;
    this.y = y;

    this.canvas.style.left = this.x + "px";
    this.canvas.style.top = this.y + "px";

    return this;
  }

  // { border: '1px solid blue', opacity: 0.5 }
  setStyle(css: { [key: string]: string }): DrawSurface {
    Object.keys(css).forEach((key) =>
      this.canvas.style.setProperty(key, css[key])
    );
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

  isInCollisionWith(another: DrawSurface): boolean {
    if (
      this.x + this.widthInPixels < another.x ||
      this.x > another.x + another.widthInPixels ||
      this.y + this.heightInPixels < another.y ||
      this.y > another.y + another.heightInPixels
    ) {
      return false;
    }

    for (let y = 0; y < this.heightInPixels; y++) {
      for (let x = 0; x < this.widthInPixels; x++) {
        if (!this.pixels[y][x]) {
          continue;
        }

        const yInAnother = y + (this.y - another.y);
        if (yInAnother < 0 || yInAnother > another.heightInPixels - 1) {
          continue;
        }
        const xInAnother = x + (this.x - another.x);
        if (xInAnother < 0 || xInAnother > another.widthInPixels - 1) {
          continue;
        }
        if (!another.pixels[yInAnother][xInAnother]) {
          continue;
        }

        return true;
      }
    }

    return false;
  }
}
