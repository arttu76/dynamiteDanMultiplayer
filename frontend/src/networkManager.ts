import { io, Socket } from "socket.io-client";

import Dan from "./dan";
import PlayerCountMap from "./playerCountMap";
import XY from "./xy";

import {
  CommChannels,
  CommChatMessage,
  CommEventNames,
  CommInitResponse,
  CommMonsterDeath,
  CommPlayerStateFromPlayer,
  CommPlayerStateFromServer,
  CommRemoveOtherPlayerFromServer,
  CommPlayerGlobals,
} from "./../../commonTypes";
import RoomManager from "./roomManager";
import PlayerManager from "./playerManager";
import ChatUi from "./chatUi";

export default class NetworkManager {
  public timeDiff: null | number = null;

  playerCountMap = new PlayerCountMap(this.playerManager);
  chatUi = new ChatUi(this);

  playersInRoom: { [key: string]: Dan } = {};

  globalSocket: Socket = null;
  roomSocket: Socket = null;

  previousPlayerState = "";
  previousRoomNumber: number = -1;

  private getSocket(channel: CommChannels, extra: number | string = "") {
    return io("//" + channel + extra);
  }

  constructor(
    private roomManager: RoomManager,
    private playerManager: PlayerManager
  ) {
    this.globalSocket = this.getSocket(CommChannels.Global);
    this.globalSocket.on("connect", () => {
      const updateGlobals = (globalState: CommPlayerGlobals) => {
        this.playerCountMap.updateMap(globalState.playerCounts);
      };

      this.globalSocket.emit(
        CommEventNames.Initialize,
        null,
        (initReply: CommInitResponse) => {
          this.timeDiff = Date.now() - initReply.serverTime;
          updateGlobals(initReply);
        }
      );
      this.globalSocket.on(CommEventNames.RequestClientReset, () => {
        location.reload();
      });
      this.globalSocket.on(CommEventNames.PlayerGlobalsUpdate, updateGlobals);

      this.globalSocket.on(
        CommEventNames.MonsterDeath,
        (death: CommMonsterDeath) => {
          this.roomManager.killMonster(
            death.roomNumber,
            death.monsterId,
            death.deadAt
          );
        }
      );
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
      name: player.name,
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
      this.chatUi.clearChat();

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
              pl.frame,
              pl.name
            );
          }

          // update the player
          this.playersInRoom[pl.id].setAllAttributes(
            new XY(pl.x, pl.y),
            pl.facingLeft,
            pl.frame,
            pl.name
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

      this.roomSocket.on(
        CommEventNames.ChatMessage,
        (chat: CommChatMessage) => {
          this.chatUi.addLineToChat(chat.text, false);
        }
      );
    }

    if (this.roomSocket?.connected) {
      this.roomSocket.emit(CommEventNames.PlayerUpdateFromClient, newState);
    } else {
      // invalidate cache state, so we try to connect immediately again
      this.previousPlayerState = null;
    }
  }

  sendMonsterDeathToServer(
    roomNumber: number,
    monsterId: number,
    time: number
  ) {
    if (this.globalSocket?.connected) {
      this.globalSocket.emit(CommEventNames.MonsterDeath, {
        roomNumber,
        monsterId,
        deadAt: time,
      } as CommMonsterDeath);
    }
  }

  rename(newName: string) {
    if (this.globalSocket?.connected) {
      this.globalSocket.emit(CommEventNames.PlayerRenameRequest, newName);
      this.playerManager.player.rename(newName);
    }
  }

  sendChat(text: string): boolean {
    if (!this.roomSocket?.connected) {
      return false;
    }

    this.roomSocket.emit(CommEventNames.ChatMessage, {
      text: this.playerManager.name + ": " + text,
    } as CommChatMessage);

    return true;
  }

  getTimeDiff(): number {
    return this.timeDiff || 0;
  }
}
