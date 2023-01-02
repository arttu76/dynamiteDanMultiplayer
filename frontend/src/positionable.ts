export default class Positionable {
  x: number;
  y: number;
  constructor(
    x: number,
    y: number
  ) {
    this.setXY(x, y);
  }

  setXY(x: number, y:number) {
    this.x=x;
    this.y=y;
  }

}
