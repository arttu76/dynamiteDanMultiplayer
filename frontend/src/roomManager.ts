import DrawSurface from "./drawSurface";
import ColorAttribute from "./colorAttribute";

import * as ROM from "./rom";
import { range, h, d, b } from "./util";
import Monster from "./monster";
import XY from "./xy";

const floors = 6;
const roomsPerFloor = 8;

export default class RoomManager {
  currentRoom: XY;
  rooms: DrawSurface[] = [];
  monsters: Monster[][] = [];

  constructor(initialRoom: XY) {
    range(roomsPerFloor * floors)
      .map((num) => this.initializeRoom(num))
      .forEach((roomAndMonsters, roomNumber) => {
        this.rooms[roomNumber] = roomAndMonsters.room;
        this.monsters[roomNumber] = roomAndMonsters.monsters;
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

  updateMonsterCollisions(player: DrawSurface, time: number): void {
    this.getCurrentMonsters()
      .filter((m) => !m.isDead(time))
      .filter((m) => m.isInCollisionWith(player))
      .forEach((m) => (m.diedAt = time));
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
    monsters: Monster[];
  } {
    return {
      room: this.parseRoomFromRom(roomNumber),
      monsters: this.parseMonstersFromRom(roomNumber),
    };
  }

  private parseRoomFromRom(roomNumber: number): DrawSurface {
    let udgPointer = ROM.pointer(this.getRoomData(roomNumber), 0);

    const ds = new DrawSurface(new XY(0, 0), 256, 192, false, true);

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

        let curX = x;
        let curY = y;
        for (let i = 0; i < repeat; i++) {
          this.drawUdg(ds, curX, curY, id);
          curX = curX + xDir * skip;
          curY = curY + yDir * skip;
        }
      } else {
        this.drawUdg(ds, x, y, id);
      }
    } while (ROM.peek(udgPointer) !== 255);

    return ds;
  }

  private drawUdg(surface: DrawSurface, x: number, y: number, udgId: number) {
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

    for (var row = 0; row < height; row++) {
      for (var udgY = 0; udgY < 8; udgY++) {
        for (var udgX = 0; udgX < width; udgX++) {
          const roomByte=ROM.peek(udgPointer + udgX + row * width * 8 + udgY * width);
          surface.plotByte(
            new XY(x * 8 + udgX * 8, y * 8 + row * -8 + udgY),
            roomByte,
            // use this color to show collision bitmap data
            // new ColorAttribute(2)
            new ColorAttribute(colors[udgX + Math.floor(udgY / 8) * width]),
            roomByte ? 0b11111111 : 0
          );
        }
      }
    }
  }

  private parseMonstersFromRom(roomNumber: number): Monster[] {
    let monsterPointer = ROM.pointer(this.getRoomData(roomNumber), 7);

    // only parse monsters for initial room so there's not shitloads of debug logging
    //if (h(roomNumber) !== "2b") return [];

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

      return range(amount).map(() => {
        /*
        console.log("monster dump from " + h(monsterPointer));
        ROM.hexDump(monsterPointer, 8, [
          "x",
          "y",
          "min",
          "max",
          "flags",
          "color",
          "currentframe",
          "maxframes",
        ]);
*/
        const yCoordinate = ROM.peek(monsterPointer++);
        const xCoordinate = ROM.peek(monsterPointer++);
        const minVaryingCoordinate = ROM.peek(monsterPointer++);
        const maxVaryingCoordinate = ROM.peek(monsterPointer++);
        const flags = ROM.peek(monsterPointer++);
        const color = new ColorAttribute(ROM.peek(monsterPointer++));
        monsterPointer++; // "current frame" in the ROM is ignored
        const maxFrames = ROM.peek(monsterPointer++);

        const spritePointerBase = d("AE60") + spriteId * 2;
        let spriteDataLocation =
          ROM.peek(spritePointerBase) + (ROM.peek(spritePointerBase + 1) << 8);

        const spriteSize = ROM.peek(spriteDataLocation++);
        const spriteWidthInChars = spriteSize & 0b11;
        const spriteHeightInChars = (spriteSize & 0b11111100) >> 2;

        /*
        console.log(
          "Monster id: " +
            spriteId +
            " flags:" +
            b(flags) +
            " FRAMES:" +
            maxFrames
        );
        */

        const spriteDataSize = spriteWidthInChars * spriteHeightInChars * 8;
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
                spriteDataLocation + spriteDataSize * frameIndex,
                spriteDataSize
              )
            )
        );

        // console.log("************ end data location " + h(spriteDataLocation));

        return new Monster(
          horizontal,
          xCoordinate,
          yCoordinate,
          minVaryingCoordinate,
          maxVaryingCoordinate,
          frames,
          !!(flags & 0b1)
        );
      });
    };

    return [
      ...parseVerticalOrHorizontal(false, vertical1Id, vertical1Amount),
      ...parseVerticalOrHorizontal(false, vertical2Id, vertical2Amount),
      ...parseVerticalOrHorizontal(true, horizontal1Id, horizontal1Amount),
      ...parseVerticalOrHorizontal(true, horizontal2Id, horizontal2Amount),
    ].map((monster, idx) => monster.setId(roomNumber * 100 + idx));
  }
}
