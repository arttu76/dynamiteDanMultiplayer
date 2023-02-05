import Dan from "./dan";
import DrawSurface from "./drawSurface";
import ColorAttribute from "./colorAttribute";

import { range } from "./util";
import XY from "./xy";
import RoomManager from "./roomManager";
import TeleporterManager from "./teleportManager";
import NetworkManager from "./networkManager";

const danWidthInChars = 3;
const danHeightInChars = 4;
// annoyingly the dan sprite is not 4 chars
// (32 pixels) tall, but 32-3 = 29 pixels tall
const danHeightDeficiencyInPixels = 4;

const danCollisionFrame = new DrawSurface(
  new XY(0, 0),
  danWidthInChars * 8,
  danHeightInChars * 8,
  true,
  false
);
range(danHeightInChars * 8 - danHeightDeficiencyInPixels - 4).forEach((y) => {
  danCollisionFrame.plotByte(
    new XY(0, y + 2),
    0b01111111,
    new ColorAttribute(2, 0, false)
  );
  danCollisionFrame.plotByte(
    new XY(8, y + 2),
    0b11100000,
    new ColorAttribute(3, 0, false)
  );
});

export default class PlayerManager {
  player: Dan;
  fallHeight = 0;

  public pressedLeft: boolean = false;
  public pressedRight: boolean = false;
  public pressedJump: boolean = false;
  public pressedDown: boolean = false;

  constructor(
    initialDanPosition: XY,
    private roomManager: RoomManager,
    private teleporterManager: TeleporterManager,
    private networkManager: NetworkManager
  ) {
    this.roomManager = roomManager;
    this.player = new Dan(initialDanPosition);
  }

  private updatePlayer(time: number): void {
    const collidesWithRoom = (offset?: XY) => {
      danCollisionFrame.setPosition(
        offset ? this.player.getOffset(offset.x, offset.y) : this.player
      );
      return danCollisionFrame.isInCollisionWith(
        this.roomManager.getCurrentRoom()
      );
    };

    const isInRoomWithWater = this.roomManager.getRoomXY().y === 0;

    this.player.getCurrentFrame().hide();

    // extra check for elevator
    if (
      collidesWithRoom() && // elevator floor moving up "digs into" players' feet
      !collidesWithRoom(new XY(0, -1)) // player would be okay if it was on the elevator
    ) {
      this.player.move(new XY(0, -1));
    }

    if (this.pressedLeft && !this.pressedRight) {
      let walkedLeft = false;
      // walk horizontally to left
      if (!collidesWithRoom(new XY(-1, 0))) {
        walkedLeft = true;
        // try climbing
      } else if (!collidesWithRoom(new XY(-1, -1))) {
        walkedLeft = true;
        this.player.y--;
      }
      if (walkedLeft) {
        this.player.move(new XY(-1, 0));
        this.player.facingLeft = true;
        this.player.frame = this.player.frame === 0 ? 3 : this.player.frame - 1;
      }
    }

    if (!this.pressedLeft && this.pressedRight) {
      let walkedRight = false;
      // walk horizontally to right
      if (!collidesWithRoom(new XY(1, 0))) {
        walkedRight = true;
        // try climbing
      } else if (!collidesWithRoom(new XY(1, -1))) {
        walkedRight = true;
        this.player.y--;
      }

      if (walkedRight) {
        this.player.move(new XY(1, 0));
        this.player.facingLeft = false;
        this.player.frame = (this.player.frame + 1) % 4;
      }
    }

    // on ladder
    if (this.roomManager.isInLadder(this.player)) {
      if (
        this.pressedJump &&
        !this.pressedDown &&
        !collidesWithRoom(new XY(0, -1))
      ) {
        this.player.move(new XY(0, -1));
      }

      if (
        !this.pressedJump &&
        this.pressedDown &&
        !collidesWithRoom(new XY(0, 1))
      ) {
        this.player.move(new XY(0, 1));
      }
    } else {
      const isOnBasicRoom = collidesWithRoom(new XY(0, 1));

      // have to include basic room in this check, because
      // some basic room udgs are drawn on top of trampolines
      // and we want those situations to be considered as "not on trampoline"
      const isOnTopOfTrampoline =
        !isOnBasicRoom && this.roomManager.isOnTopOfTrampoline(this.player);

      const isOnStableGround =
        isOnBasicRoom ||
        this.roomManager.isOnTopOfAThingThatCanBeStoodOn(this.player) ||
        this.roomManager.isOnTopOfLadder(this.player) ||
        isOnTopOfTrampoline;

      if (isOnStableGround && !isOnTopOfTrampoline) {
        this.fallHeight = 0;
      }

      // bounce from trampoline?
      if (isOnTopOfTrampoline) {
        if (this.pressedJump) {
          // jump even higher?
          this.player.jumpFrame = 1;
          this.player.jumpMaxHeight = Math.round(
            Math.max(this.fallHeight * 2, 26)
          );
          this.fallHeight = 0;
        } else {
          // make smaller and smaller bounces automatically
          this.player.jumpMaxHeight = Math.round(this.fallHeight / 2);
          this.player.jumpFrame =
            this.player.jumpMaxHeight > 1
              ? 1 // bounce automatically
              : 0; // don't bounce eventually
          this.fallHeight = 0;
        }
      } else {
        // initialize jump
        if (this.pressedJump && isOnStableGround) {
          this.player.jumpFrame = 1;
          this.player.jumpMaxHeight = 26;
          this.fallHeight = 0;
        }
      }

      // if ...
      if (
        this.player.jumpFrame && // ... jumping ...
        this.player.jumpFrame < this.player.jumpMaxHeight && // ... and we can go up
        !collidesWithRoom(new XY(0, -1)) // ... and there is room
      ) {
        // ... then move up ...
        this.player.jumpFrame++;
        this.player.y--;
      } else {
        // ... but otherwise fall down
        if (!isOnStableGround && !collidesWithRoom(new XY(0, 1))) {
          this.player.jumpFrame = 0;
          this.player.y++;
          this.fallHeight++;
        }
      }

      // going down on ladder
      if (
        this.pressedDown &&
        !this.pressedJump &&
        this.roomManager.isOnTopOfLadder(this.player) &&
        !collidesWithRoom(new XY(0, 1))
      ) {
        this.player.move(new XY(0, 1));
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
      !isInRoomWithWater &&
      this.player.y >
        192 + -danHeightInChars * 8 - 4 * 8 + danHeightDeficiencyInPixels
    ) {
      this.player.y = 0;
      this.roomManager.moveDown();
    }
    if (isInRoomWithWater && this.player.y > 160) {
      this.roomManager.moveToRoom(new XY(3, 5));
      this.player.x = 130;
      this.player.y = 20;
    }

    if (this.player.y < 0) {
      this.player.y =
        8 * 19 - danHeightInChars * 8 + danHeightDeficiencyInPixels + 4;
      this.roomManager.moveUp();
    }

    this.networkManager.sendPlayerStatusToServer(
      this.player,
      this.roomManager.getRoomIndex()
    );
  }

  update(time: number): void {
    this.updatePlayer(time);
    const justDiedMonsters =
      this.roomManager.updateMonsterCollisionsAndGetHitMonsters(
        this.player.getCurrentFrame(),
        time
      );

    justDiedMonsters.forEach((m) =>
      this.networkManager.sendMonsterDeathToServer(
        this.roomManager.getRoomIndex(),
        m.id,
        time
      )
    );

    this.teleporterManager.teleportPlayerIfRequired(this.player);
  }
}
