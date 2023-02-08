import DrawSurface from "./drawSurface";
import ColorAttribute from "./colorAttribute";

import * as ROM from "./rom";
import { range, h, d, b } from "./util";
import Monster from "./monster";
import XY from "./xy";
import Dan from "./dan";
import Floater from "./floater";
import Laser from "./laser";

const floors = 6;
const roomsPerFloor = 8;

const floaterLeftSideUdgId = 189;

const laserTurretCharWidth = 2;
const laserLeftSideUdgId = 164;
const laserRightSideUdgId = 165;

// manually tweaked graphics, key=udgId, value=special color
const colorHacks: { [key: number]: ColorAttribute } = {
  132: new ColorAttribute(2, 0, false),
  134: new ColorAttribute(2, 0, false),
};

// tiles that can be stood on but don't block sideways or upward movement
const canBeStoodOnUdgIds = [
  107, // big two char magenta V
  64, // small magenta V
  59, // small green V
  26, // rope
  212, // lamp
];

const ladderUdgIds = [
  25, // zeppelin propeller (one char wide)
  150, // regular ladder (2 chars wide)
  98, // top of ladder (2 chars wide)
  99, // another regular ladder (2 chars wide)
  100, // bottom of ladder (2 chars wide)
];

const trampolineUdgIds = [
  76, // small three-char trampoline, like on the starting screen
  176, // dotted "clothers hanger" type trampolines
  14, // flast solid line trampolines
];

const nonCollisionUdgIds = [
  ...canBeStoodOnUdgIds,
  ...ladderUdgIds,
  ...trampolineUdgIds,
  132, // zeppelin left top
  133, // zeppeling left bottom
  134, // zeppelin right top
  135, // zeppelin right bottom
  25, // zeppelin propeller
];

export default class RoomManager {
  currentRoom: XY;
  rooms: DrawSurface[] = [];
  canBeStoodOnCollisionMaps: DrawSurface[] = [];
  ladderCollisionMaps: DrawSurface[] = [];
  trampolineCollisionMaps: DrawSurface[] = [];
  floaterCollisionMaps: DrawSurface[] = [];
  floaters: Floater[][] = [];
  monsters: Monster[][] = [];
  lasers: Laser[][] = [];

  constructor(initialRoom: XY) {
    range(roomsPerFloor * floors)
      .map((num) => this.initializeRoom(num))
      .forEach((roomAndCollisionMapsAndMonstersAndLasers, roomNumber) => {
        this.rooms[roomNumber] = roomAndCollisionMapsAndMonstersAndLasers.room;
        this.canBeStoodOnCollisionMaps[roomNumber] =
          roomAndCollisionMapsAndMonstersAndLasers.canBeStoodOnCollisionMap;
        this.ladderCollisionMaps[roomNumber] =
          roomAndCollisionMapsAndMonstersAndLasers.ladderCollisionMap;
        this.trampolineCollisionMaps[roomNumber] =
          roomAndCollisionMapsAndMonstersAndLasers.trampolineCollisionMap;
        this.floaterCollisionMaps[roomNumber] =
          roomAndCollisionMapsAndMonstersAndLasers.floaterCollisionMap;
        this.floaters[roomNumber] =
          roomAndCollisionMapsAndMonstersAndLasers.floaters;
        this.monsters[roomNumber] =
          roomAndCollisionMapsAndMonstersAndLasers.monsters;
        this.lasers[roomNumber] =
          roomAndCollisionMapsAndMonstersAndLasers.lasers;
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

  updateLasers(time: number): void {
    this.lasers[this.getRoomIndex()].forEach((l) =>
      l.updateBeam(this.getCurrentRoom(), time)
    );
  }

  isFloaterActive(time: number): boolean {
    const floaterPhase = 30000;
    return time % floaterPhase < floaterPhase / 3;
  }

  updateFloaters(time: number): void {
    this.floaters[this.getRoomIndex()].forEach((f) =>
      f.updateFloater(this.getCurrentRoom(), time, this.isFloaterActive(time))
    );
  }

  isInActiveFloaterArea(player: Dan, time: number): boolean {
    return this.isFloaterActive(time)
      ? this.isTouchingCollisionMap(this.floaterCollisionMaps, player)
      : false;
  }

  updateMonsterCollisionsAndGetHitMonsters(
    player: DrawSurface,
    time: number
  ): Monster[] {
    const justDiedMonsters = this.getCurrentMonsters()
      .filter((m) => !m.isDead(time))
      .filter((m) => m.isInCollisionWith(player));

    justDiedMonsters.forEach((m) => (m.diedAt = time));
    return justDiedMonsters;
  }

  killMonster(
    roomNumber: number,
    monsterId: number,
    wantedDeadAt: number
  ): void {
    if (this.getRoomIndex() !== roomNumber) {
      return;
    }
    const victim = this.getCurrentMonsters().find((m) => m.id === monsterId);
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
    trampolineCollisionMap: DrawSurface;
    canBeStoodOnCollisionMap: DrawSurface;
    floaterCollisionMap: DrawSurface;
    floaters: Floater[];
    monsters: Monster[];
    lasers: Laser[];
  } {
    const parsedRoom = this.parseRoomFromRom(roomNumber);
    return {
      room: parsedRoom.room,
      ladderCollisionMap: parsedRoom.ladderCollisionMap,
      trampolineCollisionMap: parsedRoom.trampolineCollisionMap,
      canBeStoodOnCollisionMap: parsedRoom.canBeStoodOnCollisionMap,
      floaterCollisionMap: parsedRoom.floaterCollisionMap,
      floaters: parsedRoom.floaters,
      lasers: parsedRoom.lasers,
      monsters: this.parseMonstersFromRom(roomNumber),
    };
  }

  private parseRoomFromRom(roomNumber: number): {
    room: DrawSurface;
    canBeStoodOnCollisionMap: DrawSurface;
    ladderCollisionMap: DrawSurface;
    trampolineCollisionMap: DrawSurface;
    floaterCollisionMap: DrawSurface;
    floaters: Floater[];
    lasers: Laser[];
  } {
    let udgPointer = ROM.pointer(this.getRoomData(roomNumber), 0);

    const room = new DrawSurface(new XY(0, 0), 256, 160, false, true);

    const getEmptyCollisionMap = () =>
      new DrawSurface(new XY(0, 0), 256, 160, true, false);

    const canBeStoodOnCollisionMap = getEmptyCollisionMap();
    const ladderCollisionMap = getEmptyCollisionMap();
    const trampolineCollisionMap = getEmptyCollisionMap();

    const floaterCollisionMap = getEmptyCollisionMap();
    const floaters: Floater[] = [];

    const laserLeftSideLocations: XY[] = [];
    const laserRightSideLocations: XY[] = [];

    do {
      const y = ROM.peek(udgPointer++);
      const x = ROM.peek(udgPointer++);
      const id = ROM.peek(udgPointer++);

      if (id === laserLeftSideUdgId) {
        laserLeftSideLocations.push(new XY(x, y));
      }
      if (id === laserRightSideUdgId) {
        laserRightSideLocations.push(new XY(x, y));
      }

      if (ROM.peek(udgPointer) > 250 && ROM.peek(udgPointer) < 255) {
        const direction = ROM.peek(udgPointer++);
        const skip = ROM.peek(udgPointer++);
        const repeat = ROM.peek(udgPointer++);

        let xDir =
          direction === 254 || direction === 252 || direction === 251 ? 1 : 0;
        let yDir =
          direction === 253 || direction === 251
            ? -1
            : direction === 252
            ? 1
            : 0;

        if (id === floaterLeftSideUdgId) {
          floaters.push(
            new Floater(x, y + 1 - repeat, repeat, floaterCollisionMap)
          );
        }

        let xy = new XY(x, y);
        for (let i = 0; i < repeat; i++) {
          this.drawUdg(
            room,
            canBeStoodOnCollisionMap,
            ladderCollisionMap,
            trampolineCollisionMap,
            floaterCollisionMap,
            xy,
            id
          );
          xy = xy.getOffset(xDir * skip, yDir * skip);
        }
      } else {
        this.drawUdg(
          room,
          canBeStoodOnCollisionMap,
          ladderCollisionMap,
          trampolineCollisionMap,
          floaterCollisionMap,
          new XY(x, y),
          id
        );
      }
    } while (ROM.peek(udgPointer) !== 255);

    room.flushDebugTexts();

    // find matching closest right side lasers for left side lasers
    const lasers = laserLeftSideLocations.reduce((acc, leftXy) => {
      const closestRightXy = laserRightSideLocations
        .filter((rightXy) => rightXy.y === leftXy.y)
        .filter((rightXy) => leftXy.x < rightXy.x)
        .sort((a, b) => b.x - a.x);
      return closestRightXy.length
        ? [
            ...acc,
            new Laser(
              leftXy.x + laserTurretCharWidth,
              leftXy.y,
              closestRightXy[0].x - leftXy.x - laserTurretCharWidth
            ),
          ]
        : acc;
    }, []);

    return {
      room,
      canBeStoodOnCollisionMap,
      ladderCollisionMap,
      trampolineCollisionMap,
      floaterCollisionMap,
      floaters,
      lasers,
    };
  }

  private drawUdg(
    room: DrawSurface,
    canBeStoodOnCollisionMap: DrawSurface,
    ladderCollisionMap: DrawSurface,
    trampolineCollisionMap: DrawSurface,
    floaterCollisionMap: DrawSurface,
    xy: XY,
    udgId: number
  ) {
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

          const pixelLocation = new XY(
            xy.x * 8 + udgX * 8,
            xy.y * 8 + row * -8 + udgY
          );

          room.plotByte(
            pixelLocation,
            udgGraphicsByte,
            colorHacks[udgId] ||
              new ColorAttribute(colors[udgX + Math.floor(udgY / 8) * width]),
            !nonCollisionUdgIds.includes(udgId) && udgGraphicsByte
              ? 0b11111111
              : 0
          );

          const drawBlockIfMatchingUdg = (
            udgIdList: number[],
            ds: DrawSurface
          ) =>
            udgIdList.includes(udgId) &&
            ds.plotByte(
              pixelLocation,
              255,
              new ColorAttribute(7, 0, false) // doesn't actually matter
            );

          drawBlockIfMatchingUdg(canBeStoodOnUdgIds, canBeStoodOnCollisionMap);
          drawBlockIfMatchingUdg(ladderUdgIds, ladderCollisionMap);
          drawBlockIfMatchingUdg(trampolineUdgIds, trampolineCollisionMap);
        })
      )
    );

    if (location.search.includes("debugUdg")) {
      room.addDebugText(
        "" + udgId,
        xy.getMultiplied(8).getOffset(-4, (xy.x % 2) * -6)
      );
    }
  }

  private isTouchingCollisionMap(
    collisionMapList: DrawSurface[],
    player: Dan,
    offset: XY = new XY(0, 0)
  ) {
    const playerFrame = player.getCurrentFrame();

    playerFrame.setPosition(new XY(player.x + offset.x, player.y + offset.y));

    const result = playerFrame.isInCollisionWith(
      collisionMapList[this.getRoomIndex()]
    );

    playerFrame.setPosition(new XY(player.x - offset.x, player.y - offset.y));

    return result;
  }

  isInLadder(player: Dan): boolean {
    return this.isTouchingCollisionMap(this.ladderCollisionMaps, player);
  }

  isOnTopOfAThingThatCanBeStoodOn(player: Dan): boolean {
    return (
      !this.isTouchingCollisionMap(this.canBeStoodOnCollisionMaps, player) &&
      this.isTouchingCollisionMap(
        this.canBeStoodOnCollisionMaps,
        player,
        new XY(0, 1)
      )
    );
  }

  isOnTopOfLadder(player: Dan): boolean {
    return (
      !this.isInLadder(player) &&
      this.isTouchingCollisionMap(
        this.ladderCollisionMaps,
        player,
        new XY(0, 1)
      )
    );
  }

  isOnTopOfTrampoline(player: Dan): boolean {
    return (
      !this.isTouchingCollisionMap(this.trampolineCollisionMaps, player) &&
      this.isTouchingCollisionMap(
        this.trampolineCollisionMaps,
        player,
        new XY(0, 1)
      )
    );
  }

  private parseMonstersFromRom(roomNumber: number): Monster[] {
    let monsterPointer = ROM.pointer(this.getRoomData(roomNumber), 7);

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

          const maxFrames = horizontal ? 4 : 2;
          ROM.peek(monsterPointer++);
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
