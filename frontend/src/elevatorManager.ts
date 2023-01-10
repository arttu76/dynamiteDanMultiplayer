import ColorAttribute from "./colorAttribute";

import RoomManager from "./roomManager";
import DrawSurface from "./drawSurface";
import XY from "./xy";
import { range, repeat } from "./util";
import { Manager } from "socket.io-client";

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
      new ColorAttribute(5, 1, false),
      [
        0b01100110, 0b01100110, 0b01100110, 0b01111111, 0b11111111, 0b11111110,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      ]
    );

    const elevatorStops = [8, 34, 36, 51, 57, 68, 81, 94];

    const elevatorRoute = [
      ...elevatorStops,
      ...elevatorStops.slice().reverse(),
    ].map((val) => val * 8);

    this.elevatorPositions = elevatorRoute
      .map((_, idx) => ({
        from: elevatorRoute[idx],
        to: elevatorRoute[(idx + 1) % elevatorRoute.length],
      }))
      .filter((val) => val.from !== val.to)
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

  getElevatorInCurrentRoomY(time: number): number | null {
    const roomXy = this.roomManager.getRoomXY(this.roomManager.getRoomIndex());

    // not at elevator shaft
    if (roomXy.x !== 5) {
      return null;
    }

    const y =
      this.elevatorPositions[
        Math.round(time / 50) % this.elevatorPositions.length
      ];

    const roomYFromTop = 5 - roomXy.y;

    const roomYMin =
      (roomHeightInChars - roomPreviewInChars) * roomYFromTop * 8;
    const roomYMax = roomYMin + roomHeightInChars * 8;

    return y >= roomYMin && y <= roomYMax ? y - roomYMin : null;
  }

  updateElevator(time: number): void {
    const y = this.getElevatorInCurrentRoomY(time);
    if (y === null) {
      this.elevator.hide();
    } else {
      this.elevator.setPosition(new XY(8 * 15, y)).show();
    }
  }
}
