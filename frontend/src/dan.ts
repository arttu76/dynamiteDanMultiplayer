import DrawSurface from "./drawSurface";
import XY from "./xy";

export default class Dan extends XY {
  public x: number;
  public y: number;

  public jumpFrame = 0;
  public jumpMaxHeight = 24;
  
  public facingLeft: boolean;
  public frame: number;
  public rightFacingFrames: DrawSurface[];
  public leftFacingFrames: DrawSurface[];

  public constructor(
    position: XY,
    facingLeft: boolean,
    frame: number,
    rightFacingFrames: DrawSurface[],
    leftFacingFrames: DrawSurface[]
  ) {
    super(position.x, position.y);
    this.facingLeft = facingLeft;
    this.frame = frame;
    this.leftFacingFrames = leftFacingFrames;
    this.rightFacingFrames = rightFacingFrames;
  }

  getCurrentFrame(): DrawSurface {
    return (this.facingLeft ? this.leftFacingFrames : this.rightFacingFrames)[
      this.frame
    ];
  }

  move(xy: XY) {
    this.x+=xy.x;
    this.y+=xy.y;
    [
    ...this.leftFacingFrames,
    ...this.rightFacingFrames
    ].forEach(frame => frame.setPosition(new XY(
      this.x, this.y
    )));
  }

}
