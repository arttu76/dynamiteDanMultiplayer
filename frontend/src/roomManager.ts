import DrawSurface from "./drawSurface";
import ColorAttribute from "./colorAttribute";

import * as ROM from "./rom";
import { range, h, d, b } from "./util";
import Monster from "./monster";
import XY from "./xy";
import Dan from "./dan";

const floors = 6;
const roomsPerFloor = 8;

const ladderUdgIds = [
  150, // regular ladder (2 chars wide)
  99, // another regular ladder (2 chars wide)
  98, // top of ladder (2 chars wide)
  25, // zeppelin propeller (one char wide)
];

const nonCollisionUdgIds = [
  ...ladderUdgIds,
  132, // zeppelin left top
  133, // zeppeling left bottom
  134, // zeppelin right top
  135, // zeppelin right bottom
  25, // zeppelin propeller
];

export default class RoomManager {
  currentRoom: XY;
  rooms: DrawSurface[] = [];
  ladderCollisionMaps: DrawSurface[] = [];
  monsters: Monster[][] = [];

  constructor(initialRoom: XY) {
    range(roomsPerFloor * floors)
      .map((num) => this.initializeRoom(num))
      .forEach((roomAndLaddersAndMonsters, roomNumber) => {
        this.rooms[roomNumber] = roomAndLaddersAndMonsters.room;
        this.ladderCollisionMaps[roomNumber] =
          roomAndLaddersAndMonsters.ladderCollisionMap;
        this.monsters[roomNumber] = roomAndLaddersAndMonsters.monsters;
      });

    this.moveToRoom(initialRoom); // original starting position: 3,5
    this.getCurrentMonsters().forEach((m) => m.show());
  }

  getCurrentMonsters(): Monster[] {
    return this.monsters[this.getRoomIndex()];
  }

  getCurrentRoom(): DrawSurface {
    return this.rooms[this.getRoomIndex()];
  }

  moveRight(): void {
    this.moveToRoom(
      new XY((8 + this.currentRoom.x - 1) % 8, this.currentRoom.y)
    );
  }

  moveLeft(): void {
    this.moveToRoom(
      new XY((8 + this.currentRoom.x + 1) % 8, this.currentRoom.y)
    );
  }

  moveUp(): void {
    this.moveToRoom(
      new XY(this.currentRoom.x, Math.min(5, this.currentRoom.y + 1))
    );
  }

  moveDown(): void {
    this.moveToRoom(
      new XY(this.currentRoom.x, Math.max(0, this.currentRoom.y - 1))
    );
  }

  updateMonsters(time: number): void {
    this.getCurrentMonsters().forEach((m) => m.update(time));
  }

  updateMonsterCollisionsAndGetHitMonsters(player: DrawSurface, time: number): Monster[] {
    const justDiedMonsters = this.getCurrentMonsters()
      .filter((m) => !m.isDead(time))
      .filter((m) => m.isInCollisionWith(player));

    justDiedMonsters.forEach((m) => (m.diedAt = time));
    return justDiedMonsters;
  }

  killMonster(
    roomNumber: number,
    monsterId: number,
    wantedDeadAt: number,
  ): void {
    if (this.getRoomIndex() !== roomNumber) {
      return;
    }
    const victim = this.getCurrentMonsters().find(m => m.id===monsterId);
    if (victim && wantedDeadAt > victim.diedAt) {
      victim.diedAt = wantedDeadAt;
    }
  }

  public getRoomIndex(forXY?: XY) {
    return forXY
      ? forXY.x + forXY.y * roomsPerFloor
      : this.currentRoom.x + this.currentRoom.y * roomsPerFloor;
  }

  public getRoomXY(roomIndex?: number) {
    const idx = roomIndex ?? this.getRoomIndex();
    return new XY(idx % roomsPerFloor, Math.floor(idx / roomsPerFloor));
  }

  moveToRoom(roomXy: XY) {
    if (this.currentRoom) {
      this.getCurrentRoom().detachFromHtml();
      this.getCurrentMonsters().forEach((m) => m.hide());
    }
    this.currentRoom = roomXy;
    this.getCurrentRoom().attachToHtml().setStyle({ "z-index": "0" }).show();
    this.getCurrentMonsters().forEach((m) => m.show());

    console.log(
      "Moved to room x:" +
        this.currentRoom.x +
        " y:" +
        this.currentRoom.y +
        " number " +
        this.getRoomIndex()
    );
  }

  private getRoomData(roomNumber: number): number[] {
    const roomBase = d("69E6");
    const roomLength = 12;
    const roomAddress = roomBase + roomLength * roomNumber;
    return ROM.copy(roomAddress, roomLength);
  }

  private initializeRoom(roomNumber: number): {
    room: DrawSurface;
    ladderCollisionMap: DrawSurface;
    monsters: Monster[];
  } {
    const parsedRoom = this.parseRoomFromRom(roomNumber);
    return {
      room: parsedRoom.room,
      ladderCollisionMap: parsedRoom.ladderCollisionMap,
      monsters: this.parseMonstersFromRom(roomNumber),
    };
  }

  private parseRoomFromRom(roomNumber: number): {
    room: DrawSurface;
    ladderCollisionMap: DrawSurface;
  } {
    let udgPointer = ROM.pointer(this.getRoomData(roomNumber), 0);

    const room = new DrawSurface(new XY(0, 0), 256, 160, false, true);

    const ladderCollisionMap = new DrawSurface(
      new XY(0, 0),
      256,
      160,
      true,
      false
    );

    const addToLadderCharCollosionMapIfRequired = (udgId: number, xy: XY) => {
      if (ladderUdgIds.includes(udgId)) {
        range(8).forEach((y) =>
          range(udgId === 25 ? 1 : 2).forEach((x) =>
            ladderCollisionMap.plotByte(
              new XY(xy.x * 8 + x * 8, xy.y * 8 + y),
              255,
              new ColorAttribute(7, 0, false) // doesn't actually matter
            )
          )
        );
      }
    };

    do {
      const y = ROM.peek(udgPointer++);
      const x = ROM.peek(udgPointer++);
      const id = ROM.peek(udgPointer++);

      if (ROM.peek(udgPointer) > 250 && ROM.peek(udgPointer) < 255) {
        const direction = ROM.peek(udgPointer++);
        const skip = ROM.peek(udgPointer++);
        const repeat = ROM.peek(udgPointer++);

        let xDir =
          direction === 254
            ? 1
            : direction === 252 || direction === 251
            ? 1
            : 0;
        let yDir =
          direction === 253 || direction === 251
            ? -1
            : direction === 252
            ? 1
            : 0;

        let xy = new XY(x, y);
        for (let i = 0; i < repeat; i++) {
          this.drawUdg(room, xy, id);
          addToLadderCharCollosionMapIfRequired(id, xy);
          xy = xy.getOffset(xDir * skip, yDir * skip);
        }
      } else {
        this.drawUdg(room, new XY(x, y), id);
        addToLadderCharCollosionMapIfRequired(id, new XY(x, y));
      }
    } while (ROM.peek(udgPointer) !== 255);

    return { room, ladderCollisionMap };
  }

  private drawUdg(room: DrawSurface, xy: XY, udgId: number) {
    const udgIndex = d("6C46") + udgId * 2;
    let udgPointer = ROM.pointer([ROM.peek(udgIndex), ROM.peek(udgIndex + 1)]);

    const width = ROM.peek(udgPointer++);
    const height = ROM.peek(udgPointer++);
    const udgSize = width * height;

    let colorPointer = udgPointer + udgSize * 8;
    const inkOrRepeatFlagZero = ROM.peek(colorPointer);
    const colors = Array.from({ length: udgSize }).map(() =>
      !inkOrRepeatFlagZero
        ? ROM.peek(colorPointer + 1)
        : ROM.peek(colorPointer++)
    );

    range(height).forEach((row) =>
      range(8).forEach((udgY) =>
        range(width).forEach((udgX) => {
          const udgGraphicsByte = ROM.peek(
            udgPointer + udgX + row * width * 8 + udgY * width
          );
          room.plotByte(
            new XY(xy.x * 8 + udgX * 8, xy.y * 8 + row * -8 + udgY),
            udgGraphicsByte,
            udgId === 132 || udgId === 134 // color hack tweak for zeppelin girders
              ? new ColorAttribute(2, 0, false)
              : new ColorAttribute(colors[udgX + Math.floor(udgY / 8) * width]),
            !nonCollisionUdgIds.includes(udgId) && udgGraphicsByte
              ? 0b11111111
              : 0
          );
        })
      )
    );
  }

  private isTouchingLadderCollisionMap(player: Dan, offset: XY) {
    const playerFrame = player.getCurrentFrame();

    playerFrame.setPosition(new XY(player.x + offset.x, player.y + offset.y));

    const result = playerFrame.isInCollisionWith(
      this.ladderCollisionMaps[this.getRoomIndex()]
    );

    playerFrame.setPosition(new XY(player.x - offset.x, player.y - offset.y));

    return result;
  }

  isInLadder(player: Dan): boolean {
    return this.isTouchingLadderCollisionMap(player, new XY(0, 0));
  }

  isOnTopOfLadder(player: Dan): boolean {
    return (
      !this.isInLadder(player) &&
      this.isTouchingLadderCollisionMap(player, new XY(0, 1))
    );
  }

  private parseMonstersFromRom(roomNumber: number): Monster[] {
    let monsterPointer = ROM.pointer(this.getRoomData(roomNumber), 7);

    // only parse monsters for specific room only so there's not shitloads of debug logging
    // if (roomNumber !== 44) return [];

    const vertical1Id = ROM.peek(monsterPointer++);
    const vertical2Id = ROM.peek(monsterPointer++);
    const horizontal1Id = ROM.peek(monsterPointer++);
    const horizontal2Id = ROM.peek(monsterPointer++);
    const verticalAmount = ROM.peek(monsterPointer++);
    const vertical1Amount = (verticalAmount & 0b11110000) >> 4;
    const vertical2Amount = verticalAmount & 0b1111;
    const horizontalAmount = ROM.peek(monsterPointer++);
    const horizontal1Amount = (horizontalAmount & 0b11110000) >> 4;
    const horizontal2Amount = horizontalAmount & 0b1111;

    const parseVerticalOrHorizontal = (
      horizontal: boolean,
      spriteId: number,
      amount: number
    ) => {
      if (amount === 0) {
        return [];
      }

      return range(amount)
        .map(() => {
          const yCoordinate = ROM.peek(monsterPointer++);
          const xCoordinate = ROM.peek(monsterPointer++);
          const minVaryingCoordinate = ROM.peek(monsterPointer++);
          const maxVaryingCoordinate = ROM.peek(monsterPointer++);

          const flags = ROM.peek(monsterPointer++);

          const color = new ColorAttribute(ROM.peek(monsterPointer++));
          const currentFrame = ROM.peek(monsterPointer++); // "current frame" in the ROM is ignored

          const maxFrames = horizontal ? 4 : 2; ROM.peek(monsterPointer++);
          const fast = !!(flags & 0b10000000);

          const spritePointerBase = d("AE60") + spriteId * 2;
          let spriteDataLocation =
            ROM.peek(spritePointerBase) +
            (ROM.peek(spritePointerBase + 1) << 8);

          const spriteSize = ROM.peek(spriteDataLocation++);
          const spriteWidthInChars = spriteSize & 0b11;
          const spriteHeightInChars = (spriteSize & 0b11111100) >> 2;

          const spriteOneFrameDataSize =
            spriteWidthInChars * spriteHeightInChars * 8;
          const frames = range(maxFrames).map(
            (frameIndex) =>
              new DrawSurface(
                new XY(xCoordinate, yCoordinate),
                spriteWidthInChars * 8,
                spriteHeightInChars * 8,
                true,
                false,
                color,
                ROM.copy(
                  spriteDataLocation + spriteOneFrameDataSize * frameIndex,
                  spriteOneFrameDataSize
                )
              )
          );

          return new Monster(
            horizontal,
            fast,
            xCoordinate,
            yCoordinate,
            minVaryingCoordinate,
            maxVaryingCoordinate,
            frames,
            !!(flags & 0b10)
          );
        })
        .filter((monster) => monster !== null);
    };

    return [
      ...parseVerticalOrHorizontal(false, vertical1Id, vertical1Amount),
      ...parseVerticalOrHorizontal(false, vertical2Id, vertical2Amount),
      ...parseVerticalOrHorizontal(true, horizontal1Id, horizontal1Amount),
      ...parseVerticalOrHorizontal(true, horizontal2Id, horizontal2Amount),
    ].map((monster, idx) => monster.setId(roomNumber * 100 + idx));
  }
}
