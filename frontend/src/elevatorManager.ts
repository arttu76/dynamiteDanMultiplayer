import ColorAttribute from "./colorAttribute";

import RoomManager from "./roomManager";
import DrawSurface from "./drawSurface";
import XY from "./xy";
import { range, repeat } from "./util";

const roomHeightInChars = 20;
const roomPreviewInChars = 3; // each room shows this many chars from the room above it

export default class ElevatorManager {
  public elevatorY = 20;
  elevator: DrawSurface;
  elevatorPositions: number[];

  constructor(private roomManager: RoomManager) {
    this.elevator = new DrawSurface(
      new XY(50, 120),
      3 * 8,
      8,
      true,
      false,
      new ColorAttribute(5, 1, false),
      [
        0b01100110, 0b01100110, 0b01100110, 0b01111111, 0b11111111, 0b11111110,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      ]
    );

    const elevatorStops = [8, 34, 36, 51, 57, 68, 81, 94];

    const elevatorRoute = [
      ...elevatorStops,
      ...elevatorStops.slice(0, -1).reverse(),
    ].map((val) => val * 8);

    this.elevatorPositions = elevatorRoute
      .map((_, idx) => ({
        from: elevatorRoute[idx],
        to: elevatorRoute[(idx + 1) % elevatorRoute.length],
      }))
      .map((stop) => [
        stop.to > stop.from
          ? range(stop.to - stop.from).map((val) => val + stop.from)
          : range(stop.from - stop.to)
              .map((val) => val + stop.to)
              .reverse(),
        repeat(stop.to, 100),
      ])
      .flat()
      .flat();

    this.elevator.attachToHtml();
  }

  isPlayerCurrently(): {
    inTopmostElevatorRoom: boolean;
    inAnyRoomWithElevatorShaft: boolean;
  } {
    const xy = this.roomManager.getRoomXY(this.roomManager.getRoomIndex());
    const inAnyRoomWithElevatorShaft = xy.x === 5;
    return {
      inTopmostElevatorRoom: inAnyRoomWithElevatorShaft && xy.y === 5,
      inAnyRoomWithElevatorShaft,
    };
  }

  getElevatorInCurrentRoomY(time: number): number | null {
    if (!this.isPlayerCurrently().inAnyRoomWithElevatorShaft) {
      return null;
    }

    const roomXy = this.roomManager.getRoomXY(this.roomManager.getRoomIndex());

    const elevatorGlobalY =
      this.elevatorPositions[
        Math.round(time / 50) % this.elevatorPositions.length
      ];

    const roomYFromTop = 5 - roomXy.y;

    const roomYMin =
      (roomHeightInChars - roomPreviewInChars) * roomYFromTop * 8;
    const roomYMax = roomYMin + roomHeightInChars * 8;

    return elevatorGlobalY >= roomYMin && elevatorGlobalY <= roomYMax
      ? elevatorGlobalY - roomYMin
      : null;
  }

  updateElevator(time: number): void {
    const isPlayer = this.isPlayerCurrently();

    if (!isPlayer.inAnyRoomWithElevatorShaft) {
      return;
    }

    // topmost elevator room matters because of the elevator roof
    this.roomManager
      .getCurrentRoom()
      .updateCustomCollisionMap(
        new XY(15 * 8, isPlayer.inTopmostElevatorRoom ? 2 * 8 : 0),
        3 * 8,
        20 * 8 - (isPlayer.inTopmostElevatorRoom ? 2 * 8 : 0),
        false
      );

    const elevatorLocalY = this.getElevatorInCurrentRoomY(time);
    if (elevatorLocalY === null) {
      this.elevator.hide();
    } else {
      this.elevator.setPosition(new XY(8 * 15, elevatorLocalY)).show();
      this.roomManager
        .getCurrentRoom()
        .updateCustomCollisionMap(
          new XY(15 * 8, elevatorLocalY),
          3 * 8,
          2,
          true
        );
    }
  }
}
