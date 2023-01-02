import DrawSurface from "./drawSurface";
import Positionable from "./positionable";

enum MonsterState {
  Alive,
  Dying,
  Dead,
  Resurrecting,
}

export default class Monster extends Positionable {
  id: number;
  frames: DrawSurface[];
  currentFrame: number;
  horizontal: boolean;
  minVaryingCoordinate: number;
  maxVaryingCoordinate: number;
  dirX: number;
  dirY: number;
  state: MonsterState;

  constructor(
    horizontal: boolean,
    x: number,
    y: number,
    minVaryingCoordinate: number,
    maxVaryingCoordinate: number,
    frames: DrawSurface[],
    inverseDir: boolean,
    id: number = -1
  ) {
    super(x * 8, y * 8);

    this.horizontal = horizontal;
    const direction = inverseDir ? -1 : 1;
    this.dirX = horizontal ? direction : 0;
    this.dirY = horizontal ? 0 : direction;

    if (this.dirX === -1) {
      this.x += 8;
    }
    if (this.dirY === -1) {
      this.y += 8;
    }

    this.minVaryingCoordinate = minVaryingCoordinate * 8;
    this.maxVaryingCoordinate = (maxVaryingCoordinate + 1) * 8;

    this.frames = frames;
    this.frames.forEach((f) => f.flipHorizontally(inverseDir));

    this.currentFrame = 0;
  }

  setId(id: number) {
    this.id = id;
    return this;
  }

  show() {
    this.frames.forEach((f) => f.attachToHtml().hide());
  }

  hide() {
    this.frames.forEach((f) => f.detachFromHtml().hide());
  }

  flipFrames(flip: boolean) {
    this.frames.forEach((frame) => frame.flipHorizontally(flip));
  }

  update() {
    this.x += this.dirX;
    this.y += this.dirY;

    if (this.horizontal) {
      if (this.x <= this.minVaryingCoordinate) {
        this.dirX = 1;
        this.flipFrames(false);
      }
      if (this.x >= this.maxVaryingCoordinate) {
        this.dirX = -1;
        this.flipFrames(true);
      }
    }

    if (!this.horizontal) {
      if (this.y <= this.minVaryingCoordinate) {
        this.dirY = 1;
      }
      if (this.y >= this.maxVaryingCoordinate) {
        this.dirY = -1;
      }
    }

    this.frames[this.currentFrame].hide();
    this.currentFrame = (this.currentFrame + 1) % this.frames.length;
    this.frames[this.currentFrame].setPosition(this.x, this.y).show();
  }
}
