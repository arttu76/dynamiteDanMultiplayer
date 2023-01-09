import Dan from "./dan";
import DrawSurface from "./drawSurface";
import ColorAttribute from "./colorAttribute";

import * as ROM from "./rom";
import { range, h, d, b } from "./util";
import RoomManager from "./roomManager";
import XY from "./xy";

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

  roomManager: RoomManager;

  public pressedLeft: boolean = false;
  public pressedRight: boolean = false;
  public pressedJump: boolean = false;

  constructor(roomManager: RoomManager) {
    this.roomManager = roomManager;
    this.others = [];

    const frames = this.parseDanFrames();
    this.player = new Dan(
      210,
      105,
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

  private updatePlayer(): void {
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

    let isOnStableGround = collidesWithRoom(0, 1);

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

    this.player.jumpVelocity = Math.min(50, this.player.jumpVelocity + 1);

    // going upwards and hit head?
    if (
      !isOnStableGround &&
      this.player.jumpVelocity < 0 &&
      collidesWithRoom(0, this.player.jumpVelocity)
    ) {
      this.player.jumpVelocity = 1;
    }

    // landed?
    if (!isOnStableGround) {
      for (let y = 0; y < this.player.jumpVelocity + 1; y++) {
        if (collidesWithRoom(0, y)) {
          this.player.y += y - 1;
          isOnStableGround = true;
          break;
        }
      }
      // didn't land, accelerate downwards
      if (!isOnStableGround) {
        // this.player.y += this.player.jumpVelocity;
      }
    }

    // initialize jump
    if (this.pressedJump && isOnStableGround) {
      this.player.jumpVelocity = -7;
      this.player.y += this.player.jumpVelocity;
    }

    if (!isOnStableGround) {
      // this.player.y++;
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
    if (this.player.y < 0) {
      this.player.y = 192 - danHeightInChars * 8;
      this.roomManager.moveUp();
    }
    if (this.player.y > 192 - danHeightInChars * 8) {
      this.player.y = 0;
      this.roomManager.moveDown();
    }
  }

  private updateOthers() {}

  update(time: number): void {
    this.updateOthers();
    this.updatePlayer();
    this.roomManager.updateMonsterCollisions(
      this.player.getCurrentFrame(),
      time
    );
    this.roomManager.teleportPlayerIfRequired(this.player);
  }
}
