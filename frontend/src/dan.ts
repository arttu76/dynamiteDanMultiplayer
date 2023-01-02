import DrawSurface from "./drawSurface";
import Positionable from "./positionable";

export default class Dan extends Positionable {
  public x: number;
  public y: number;
  public facingLeft: boolean;
  public frame: number;
  public rightFacingFrames: DrawSurface[];
  public leftFacingFrames: DrawSurface[];

  public constructor(
    x: number,
    y: number,
    facingLeft: boolean,
    frame: number,
    rightFacingFrames: DrawSurface[],
    leftFacingFrames: DrawSurface[]
  ) {
    super(x, y);
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
