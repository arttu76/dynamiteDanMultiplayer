import { io, Socket } from "socket.io-client";

import Dan from "./dan";
import PlayerCountMap from "./playerCountMap";
import XY from "./xy";

import {
    CommChannels,
  CommEventNames,
  CommInitInfo,
  CommMap,
  CommMonsterDeath,
  CommPlayerStateFromPlayer,
  CommPlayerStateFromServer,
  CommRemoveOtherPlayerFromServer,
} from "./../../commonTypes";
import RoomManager from "./roomManager";

export default class NetworkManager {
  public timeDiff: null | number = null;

  playerCountMap = new PlayerCountMap();

  playersInRoom: { [key: string]: Dan } = {};

  globalSocket: Socket = null;
  roomSocket: Socket = null;

  previousPlayerState = "";
  previousRoomNumber: number = -1;

  private getSocket(channel: CommChannels, extra: number | string = '') {
    return io(":1000"+channel+extra);
  }

  constructor(private roomManager: RoomManager) {
    this.globalSocket = this.getSocket(CommChannels.Global);
    this.globalSocket.on("connect", () => {
      this.globalSocket.emit(
        CommEventNames.Initialize,
        null,
        (initReply: CommInitInfo) => {
          this.timeDiff = Date.now() - initReply.serverTime;
        }
      );
      this.globalSocket.on(CommEventNames.MapUpdate, (mapState: CommMap) => {
        this.playerCountMap.updateMap(mapState.playerCounts);
      });
      this.globalSocket.on(CommEventNames.MonsterDeath, (death: CommMonsterDeath) => {
        this.roomManager.killMonster(
            death.roomNumber,
            death.monsterId,
            death.deadAt
        );
      })
    });
  }

  removePlayersFromLocalClient(specificPlayerId?: string) {
    (specificPlayerId
      ? [specificPlayerId]
      : Object.keys(this.playersInRoom)
    ).forEach((id) => {
      this.playersInRoom[id].destroy();
      delete this.playersInRoom[id];
    });
  }

  sendPlayerStatusToServer(player: Dan, roomNumber: number) {
    const newState: CommPlayerStateFromPlayer = {
      x: player.x,
      y: player.y,
      facingLeft: player.facingLeft,
      frame: player.frame,
    };

    // don't send if nothing changed
    const serializedState = Object.values(newState).join("_");
    if (serializedState === this.previousPlayerState) {
      return;
    }
    this.previousPlayerState = serializedState;

    if (roomNumber !== this.previousRoomNumber) {
      // exit old room
      this.roomSocket?.connected && this.roomSocket.disconnect();
      this.removePlayersFromLocalClient();

      // enter new room
      this.roomSocket = this.getSocket(CommChannels.RoomPrefix, roomNumber);
      this.previousRoomNumber = roomNumber;

      this.roomSocket.on(
        CommEventNames.PlayerStatusFromServer,
        (pl: CommPlayerStateFromServer) => {

          // don't update itself
          if (this.roomSocket.id === pl.id) {
            return;
          }

          // we don't know about this player? add it
          if (!this.playersInRoom[pl.id]) {
            this.playersInRoom[pl.id] = new Dan(
              new XY(pl.x, pl.y),
              pl.facingLeft,
              pl.frame
            );
          }

          // update the player
          this.playersInRoom[pl.id].setAllAttributes(
            new XY(pl.x, pl.y),
            pl.facingLeft,
            pl.frame
          );
        }
      );

      this.roomSocket.on(
        CommEventNames.PlayerRemove,
        (info: CommRemoveOtherPlayerFromServer) => {
          const id = info.id;

          // don't remove itself or player we know nothing about
          if (this.roomSocket.id === id || !this.playersInRoom[id]) {
            return;
          }

          this.removePlayersFromLocalClient(id);
        }
      );
    }

    if (this.roomSocket?.connected) {
      this.roomSocket.emit(CommEventNames.PlayerUpdateFromClient, newState);
    }
  }

  sendMonsterDeathToServer(roomNumber: number, monsterId: number, time: number) {
    if (this.globalSocket?.connected) {
      this.globalSocket.emit(CommEventNames.MonsterDeath, {
        roomNumber,
        monsterId,
        deadAt: time
      } as CommMonsterDeath);
    }
  }

}
