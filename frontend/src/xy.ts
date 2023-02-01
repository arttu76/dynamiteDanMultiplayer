export default class XY {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  getOffset(x: number, y: number) {
    return new XY(this.x + x, this.y + y);
  }

  getInverse() {
    return new XY(-this.x, -this.y);
  }

  getCopy() {
    return new XY(this.x, this.y);
  }
}
