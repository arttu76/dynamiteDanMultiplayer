import DrawSurface from "./drawSurface";
import XY from "./xy";

enum MonsterState {
  Alive,
  Dying,
  Dead,
  Resurrecting,
}

export default class Monster extends XY {
  id: number;
  frames: DrawSurface[];
  initialDiffOffset: number;
  currentFrame: number;
  horizontal: boolean;
  fast: boolean;
  diffAmount: number;
  baseX: number;
  baseY: number;
  diedAt: number = 0;
  state: MonsterState;

  constructor(
    horizontal: boolean,
    fast: boolean,
    x: number,
    y: number,
    minVaryingCoordinate: number,
    maxVaryingCoordinate: number,
    frames: DrawSurface[],
    inverseDir: boolean
  ) {
    super(x * 8, y * 8);

    this.horizontal = horizontal;
    this.fast = fast;

    this.diffAmount = (maxVaryingCoordinate + 1 - minVaryingCoordinate) * 8;

    this.initialDiffOffset =
      (minVaryingCoordinate - (horizontal ? x : y)) * 8 + (inverseDir ? -8 : 0);

    if (horizontal) {
      this.baseX = Math.min(minVaryingCoordinate, x) * 8;
      this.baseY = y * 8;
    } else {
      this.baseX = x * 8;
      this.baseY = Math.min(minVaryingCoordinate, y) * 8;
    }

    this.frames = frames;
    this.frames.forEach((f) => f.flipHorizontally(inverseDir));

    this.currentFrame = 0;
  }

  setId(id: number) {
    this.id = id;
    return this;
  }

  show() {
    this.frames.forEach((f) => f.attachToHtml().setStyle({ "z-index": "2000 "}));
  }

  hide() {
    this.frames.forEach((f) => f.detachFromHtml().hide());
  }

  flipFrames(flip: boolean) {
    this.frames.forEach((frame) => frame.flipHorizontally(flip));
  }

  isDead(time: number): boolean {
    return this.diedAt + 1000 * 5 > time;
  }

  isInCollisionWith(other: DrawSurface): boolean {
    return this.frames[this.currentFrame].isInCollisionWith(other);
  }

  update(time: number) {
    const tickForMovement = Math.round((time / 1200) * 23);
    const tickForAnimation = Math.round((time / 1200) * 25);

    const totalCurrentDiff =
      (this.initialDiffOffset + tickForMovement * (this.fast ? 1: 1)) % (this.diffAmount * 2);
    const goingBack = totalCurrentDiff >= this.diffAmount;
    const halfCurrentDiff = totalCurrentDiff % this.diffAmount;

    if (this.horizontal) {
      this.flipFrames(goingBack);
      this.x =
        this.baseX +
        (goingBack ? this.diffAmount - halfCurrentDiff : halfCurrentDiff);
    }

    if (!this.horizontal) {
      this.y =
        this.baseY +
        (goingBack ? this.diffAmount - halfCurrentDiff : halfCurrentDiff);
    }

    this.frames[this.currentFrame].hide();
    this.currentFrame = Math.floor(tickForAnimation / 2) % this.frames.length;
    this.frames[this.currentFrame].setPosition(new XY(this.x, this.y)).show();

    this.frames.forEach((f) =>
      f.setStyle({ opacity: this.isDead(time) ? "0.125" : "1" })
    );
  }
}
