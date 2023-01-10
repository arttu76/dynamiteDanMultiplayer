import DrawSurface from "./drawSurface";
import XY from "./xy";

export default class Dan extends XY {
  public x: number;
  public y: number;
  public jumpVelocity = 0;
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

}
