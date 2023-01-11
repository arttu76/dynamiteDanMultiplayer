import Dan from "./dan";
import DrawSurface from "./drawSurface";
import ColorAttribute from "./colorAttribute";

import * as ROM from "./rom";
import { range, h, d, b } from "./util";
import XY from "./xy";
import RoomManager from "./roomManager";
import TeleporterManager from "./teleportManager";
import ElevatorManager from "./elevatorManager";

const danWidthInChars = 3;
const danHeightInChars = 4;
// annoyingly the dan sprite is not 4 chars
// (32 pixels) tall, but 32-3 = 29 pixels tall
const danHeightDeficiencyInPixels = 4;
const danDataSize =
  danWidthInChars * (danHeightInChars * 8 - danHeightDeficiencyInPixels);
const danColor = new ColorAttribute(5, 0, false);

export default class DanManager {
  player: Dan;
  others: Dan[];

  public pressedLeft: boolean = false;
  public pressedRight: boolean = false;
  public pressedJump: boolean = false;

  constructor(
    initialDanPosition: XY,
    private roomManager: RoomManager,
    private teleporterManager: TeleporterManager,
    private elevatorManager: ElevatorManager
  ) {
    this.roomManager = roomManager;
    this.others = [];

    const frames = this.parseDanFrames();
    this.player = new Dan(
      initialDanPosition,
      true,
      0,
      frames.rightFacingFrames,
      frames.leftFacingFrames
    );

    /* uncomment to view dan frames
    [...frames.leftFacingFrames,
      ...frames.rightFacingFrames]
      .forEach(
      (f, idx) => f.setStyle({"opacity": "1", "background":"black", "border": "1px solid blue" }).setPosition(idx*30, 10)
    );
    */
  }

  private parseDanFrames(): {
    rightFacingFrames: DrawSurface[];
    leftFacingFrames: DrawSurface[];
  } {
    const grabFrames = (offsetHex: string, pixelOffsets: number[]) =>
      range(4).map(
        (index) =>
          new DrawSurface(
            new XY(0, 0),
            danWidthInChars * 8,
            danHeightInChars * 8,
            true,
            false,
            danColor,
            ROM.copy(d(offsetHex) + danDataSize * index, danDataSize),
            pixelOffsets[index] // pixel data for dan is not left-aligned
          )
      );

    return {
      rightFacingFrames: grabFrames("633A", [-2, -4, -6, -8]),
      leftFacingFrames: grabFrames("648A", [-4, -6, -8, -10]),
    };
  }

  private updatePlayer(time: number): void {
    const collidesWithRoom = (offsetX: number, offsetY: number) => {
      this.player
        .getCurrentFrame()
        .setPosition(new XY(this.player.x + offsetX, this.player.y + offsetY));
      const collisionResult = this.player
        .getCurrentFrame()
        .isInCollisionWith(this.roomManager.getCurrentRoom());
      this.player
        .getCurrentFrame()
        .setPosition(new XY(this.player.x - offsetX, this.player.y - offsetY));
      return collisionResult;
    };

    this.player.getCurrentFrame().hide();

    // extra check for elevator
    if(
      collidesWithRoom(0, 0) // elevator floor moving up "digs into" players' feet
      && !collidesWithRoom(0, -1) // player would be okay if it was on the elevator
    ) {
      this.player.y--;
    }

    if (this.pressedLeft && !this.pressedRight) {
      let walkedLeft = false;
      // walk horizontally to left
      if (!collidesWithRoom(-1, 0)) {
        walkedLeft = true;
        // try climbing
      } else if (!collidesWithRoom(-1, -1)) {
        walkedLeft = true;
        this.player.y--;
      }
      if (walkedLeft) {
        this.player.x--;
        this.player.facingLeft = true;
        this.player.frame = this.player.frame === 0 ? 3 : this.player.frame - 1;
      }
    }

    if (!this.pressedLeft && this.pressedRight) {
      let walkedRight = false;
      // walk horizontally to right
      if (!collidesWithRoom(1, 0)) {
        walkedRight = true;
        // try climbing
      } else if (!collidesWithRoom(1, -1)) {
        walkedRight = true;
        this.player.y--;
      }

      if (walkedRight) {
        this.player.x++;
        this.player.facingLeft = false;
        this.player.frame = (this.player.frame + 1) % 4;
      }
    }

    let isOnStableGround = collidesWithRoom(0, 1);

    // initialize jump
    if(this.pressedJump && isOnStableGround) {
      this.player.jumpFrame = 1;
      this.player.jumpMaxHeight = 26;
    }

    // if ...
    if(
      this.player.jumpFrame // ... jumping ...
      && this.player.jumpFrame < this.player.jumpMaxHeight // ... and we can go up
      && !collidesWithRoom(0, -1) // ... and there is room
    ) {
      // ... then move up ...
      this.player.jumpFrame++;
      this.player.y--;
    } else {
      // ... but otherwise fall down
      if(!isOnStableGround && !collidesWithRoom(0, 1)) {
        this.player.jumpFrame = 0;
        this.player.y++;
      }
    }

    this.player
      .getCurrentFrame()
      .setPosition(new XY(this.player.x, this.player.y))
      .show();

    if (this.player.x < 0 - 4) {
      this.player.x = 256 - danWidthInChars * 8 + 8;
      this.roomManager.moveLeft();
    }
    if (this.player.x > 256 - danWidthInChars * 8 + 10) {
      this.player.x = 0;
      this.roomManager.moveRight();
    }
    if (
      this.player.y >
      192 - danHeightInChars * 8 - 4 * 8 + danHeightDeficiencyInPixels
    ) {
      this.player.y = 0;
      this.roomManager.moveDown();
    }
    if (this.player.y < 0) {
      this.player.y = 8*19 - danHeightInChars * 8 + danHeightDeficiencyInPixels + 4;
      this.roomManager.moveUp();
    }
  }

  private updateOthers() {}

  update(time: number): void {
    this.updateOthers();
    this.updatePlayer(time);
    this.roomManager.updateMonsterCollisions(
      this.player.getCurrentFrame(),
      time
    );
    this.teleporterManager.teleportPlayerIfRequired(this.player);
  }
}
