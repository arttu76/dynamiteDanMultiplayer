import ColorAttribute from "./colorAttribute";

import * as ROM from "./rom";
import { range, h, d, b } from "./util";
import XY from "./xy";
import Dan from "./dan";
import RoomManager from "./roomManager";

interface Teleporter {
  fromRoom: number;
  positionInChars: XY;
  toRoom: number;
  toPixelLocation: XY;
}

const teleporterBeamWidthInChars = 4;
const teleporterBeamHeightInChars = 4;

const charsPerLine = 32;

export default class TeleporterManager {
  teleporters: Teleporter[] = [];
  teleporterActiveInThisFrame = false;
  teleporterActiveInPreviousFrame = false;

  constructor(private roomManager: RoomManager) {
    this.teleporters = range(10)
    .map((index) => {
      let teleporterPointer = d("EDBC") + index * 6; // each teleporter is 6 bytes

      const fromRoom = ROM.peek(teleporterPointer++);
      const attributePosition =
        ROM.peek(teleporterPointer++) +
        ROM.peek(teleporterPointer++) * 256 -
        parseInt("58", 16) * 256; // start of attribute ram
      const teleporterXInChars = attributePosition % charsPerLine;

      return {
        fromRoom: fromRoom,
        positionInChars: new XY(
          teleporterXInChars,
          (attributePosition - teleporterXInChars) / charsPerLine
        ),
        toRoom: ROM.peek(teleporterPointer++),
        toPixelLocation: new XY(
          ROM.peek(teleporterPointer + 1) * 8,
          ROM.peek(teleporterPointer)
        ),
      };
    });
  }

  getTeleporterForCurrentRoom(): Teleporter | null {
    return (
      this.teleporters.find((t) => t.fromRoom === this.roomManager.getRoomIndex()) || null
    );
  }

  updateTeleporter(time: number): void {
    const teleporter = this.getTeleporterForCurrentRoom();
    if (!teleporter) {
      this.teleporterActiveInPreviousFrame = false;
      this.teleporterActiveInThisFrame = true;
      return;
    }

    this.teleporterActiveInPreviousFrame = this.teleporterActiveInThisFrame;
    this.teleporterActiveInThisFrame = time % 20000 < 5000;

    if (!this.teleporterActiveInThisFrame) {
      for (let x = 0; x < teleporterBeamWidthInChars; x++) {
        // teleporter "emitters"
        this.roomManager.getCurrentRoom().setAttribute(
          teleporter.positionInChars.getOffset(x, 0),
          new ColorAttribute(((Math.round(time / 75) + x) % 7) + 1, 0, false)
        );

        if (this.teleporterActiveInPreviousFrame) {
          for (let y = 0; y < teleporterBeamHeightInChars; y++) {
            this.roomManager.getCurrentRoom().setAttribute(
              teleporter.positionInChars.getOffset(x, y + 1),
              new ColorAttribute(7, 0, false)
            );
          }
        }
      }
      return;
    }

    const color = new ColorAttribute(0, (Math.round(time / 25) % 7) + 1, false);

    for (let x = 0; x < teleporterBeamWidthInChars; x++) {
      // teleporter "emitters"
      this.roomManager.getCurrentRoom().setAttribute(
        teleporter.positionInChars.getOffset(x, 0),
        new ColorAttribute(
          ((Math.round(time / 75) + (4 - x)) % 7) + 1,
          0,
          false
        )
      );

      // teleporter "air"
      for (let y = 0; y < teleporterBeamHeightInChars; y++) {
        this.roomManager.getCurrentRoom().setAttribute(
          teleporter.positionInChars.getOffset(x, y + 1),
          color
        );
      }
    }
  }

  teleportPlayerIfRequired(player: Dan): void {
    const teleporter = this.getTeleporterForCurrentRoom();

    if (
      !teleporter ||
      this.teleporterActiveInThisFrame ||
      !this.teleporterActiveInPreviousFrame
    ) {
      return;
    }

    if (
      player.x > teleporter.positionInChars.x * 8 &&
      player.x < teleporter.positionInChars.x * 8 + 20 &&
      player.y > teleporter.positionInChars.y * 8 + 6 &&
      player.y < teleporter.positionInChars.y * 8 + 15
    ) {
      this.roomManager.moveToRoom(this.roomManager.getRoomXY(teleporter.toRoom));
      player.x = teleporter.toPixelLocation.x;
      player.y = teleporter.toPixelLocation.y;
    }
  }

}
