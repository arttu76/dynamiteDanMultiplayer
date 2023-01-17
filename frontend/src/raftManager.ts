import ColorAttribute from "./colorAttribute";

import * as ROM from "./rom";
import RoomManager from "./roomManager";
import DrawSurface from "./drawSurface";
import XY from "./xy";
import { range, d } from "./util";

export default class RaftManager {
  raftFrames: DrawSurface[];
  waterSurface: DrawSurface;

  constructor(private roomManager: RoomManager) {
    const raftColor = new ColorAttribute(2, 0, false);
    this.waterSurface = new DrawSurface(new XY(0, 19*8), 256, 8*3, false, false)
    .attachToHtml()
    .setStyle({ "z-index": "100" })
    .hide();

    this.raftFrames = range(4).map(
      (frameNumber) =>
        new DrawSurface(
          new XY(50 + frameNumber * 8, 20),
          8 * 4,
          8,
          true,
          false,
          raftColor
        )
    );

    // raft pixel data is not 3 charater wide, but instead
    // three one-charater-wide blocks one after another
    this.raftFrames.forEach((raftFrame, raftFrameIndex) =>
      range(4).forEach((raftCharIndex) =>
        range(8).forEach((y) =>
          raftFrame.plotByte(
            new XY(raftCharIndex * 8 - (3 - raftFrameIndex) * 2 + 1, y),
            ROM.peek(
              d("6899") + y + raftCharIndex * 8 + raftFrameIndex * 8 * 4
            ),
            raftColor
          )
        )
      )
    );
  }

  private drawRaft(time: number, room: DrawSurface): void {
    // roomX=0 is the LEFTMOST room, 7 is the RIGHTMOST room
    const roomX = 7 - this.roomManager.getRoomXY().x;

    // clear raft from current screen
    range(32).forEach((x) =>
      range(8).forEach((y) =>
        room.plotByte(
          new XY(x * 8, 18 * 8 + y),
          0,
          new ColorAttribute(2, 0, false),
          0
        )
      )
    );
    this.hideAllRaftFrames();

    const totalWorldWidth = 30 * 8 * 8;
    const raftGlobalX =
      totalWorldWidth - (Math.round(time / 50) % totalWorldWidth);

    const currentRoomStartX = roomX * 30 * 8;
    const raftX =
      roomX === 0
        ? raftGlobalX < 512
          ? raftGlobalX
          : raftGlobalX - totalWorldWidth
        : raftGlobalX - currentRoomStartX;

    const collisionUpdateWidth=raftX<0 ? 32+raftX : 32;
    if(collisionUpdateWidth) {
      room.updateCustomCollisionMap(
        new XY(Math.max(0, raftX), 18*8),
        collisionUpdateWidth,
        8,
        true
      );
    }

    if (raftX < -24 || raftX > 32 * 8) {
      return;
    }

    const raftFrame = Math.round(time / 125) % 4;

    this.raftFrames[raftFrame].setPosition(new XY(raftX, 8 * 18)).show();
  }

  private hideAllRaftFrames() {
    this.raftFrames.forEach((frame) => frame.hide());
  }

  private drawWater(time: number): void {
    const animationOffset = Math.round(time / 125);

    this.waterSurface.show();

    range(32).forEach((x) =>
      range(8).forEach((y) =>
        this.waterSurface.plotByte(
          new XY(x * 8, y),
          y < 3
            ? ROM.peek(d("6985") + ((y + (x + animationOffset) * 4) % 97))
            : 0,
          new ColorAttribute(7, 1, true),
          0
        )
      )
    );
  }

  updateRaft(time: number): void {
    if (this.roomManager.getRoomXY().y > 0) {
      this.hideAllRaftFrames();
      this.waterSurface.hide();
      return;
    }
    const room = this.roomManager.getCurrentRoom();
    this.drawRaft(time, room);
    this.drawWater(time);
  }
}
