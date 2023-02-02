import express from "express";
import { Socket } from "socket.io";
import {
  CommChannels,
  CommEventNames,
  CommInitInfo,
  CommMap,
  CommPlayerStateFromPlayer,
  CommPlayerStateFromServer,
  CommRemoveOtherPlayerFromServer,
  CommMonsterDeath,
  CommChatMessage,
} from "./../../commonTypes";

const app = express();

const range = (maxExclusive: number) => Array.from(Array(maxExclusive).keys());

interface PlayerInRoom {
  socket: Socket;
  player: string;
}

const playersInRooms: PlayerInRoom[][] = range(48).map(() => []);
const newestPlayerStates: { [key: string]: CommPlayerStateFromPlayer } = {};

let monsterDeaths: CommMonsterDeath[] = [];

const io = require("socket.io")(1000, {
  cors: {
    origin: "http://localhost:9000",
    methods: ["GET", "POST"],
  },
});

app.get("/", (_, res) => res.redirect("http://localhost:9000"));

const global = io.of(CommChannels.Global);
global.on("connection", (socketForGlobal) => {
  socketForGlobal.on(CommEventNames.Initialize, (_, callback) =>
    callback({
      serverTime: Date.now(),
    } as CommInitInfo)
  );
  socketForGlobal.on(CommEventNames.MonsterDeath, (death: CommMonsterDeath) => {
    monsterDeaths = monsterDeaths.filter(
      (md) =>
        md.roomNumber !== death.roomNumber || md.monsterId !== death.monsterId
    );
    monsterDeaths.push(death);
    global.emit(CommEventNames.MonsterDeath, death);
  });
});
const updateGlobalPlayerCount = () => {
  global.emit(CommEventNames.MapUpdate, {
    playerCounts: playersInRooms.map((players) => players.length),
  } as CommMap);
};

range(48).forEach((roomNumber) => {
  const roomSpecific = io.of(CommChannels.RoomPrefix + roomNumber);
  roomSpecific.on("connection", (socketForRoom) => {
    playersInRooms[roomNumber].push({
      socket: socketForRoom,
      player: null,
    } as PlayerInRoom);
    updateGlobalPlayerCount();

    console.log("/room" + roomNumber + " " + socketForRoom.id + " connected");

    // tell about other players
    playersInRooms[roomNumber]
      // don't tell about ourselves & tell only players we know something about
      .filter((sp) => sp.socket.id !== socketForRoom.id && sp.player)
      .forEach((sp) =>
        socketForRoom.emit(CommEventNames.PlayerStatusFromServer, {
          ...newestPlayerStates[sp.socket.id],
          id: sp.socket.id,
        } as CommPlayerStateFromServer)
      );

    // broadcast monster deaths for this room
    monsterDeaths
        .filter(md => md.roomNumber===roomNumber)  
        .forEach(md => global.emit(CommEventNames.MonsterDeath, md));

    socketForRoom.on("disconnect", () => {
      console.log(
        "/room" + roomNumber + " " + socketForRoom.id + " disconnected"
      );
      playersInRooms[roomNumber] = playersInRooms[roomNumber].filter(
        (sp) => sp.socket.connected
      );
      roomSpecific.emit(CommEventNames.PlayerRemove, {
        id: socketForRoom.id,
      } as CommRemoveOtherPlayerFromServer);
      delete newestPlayerStates[socketForRoom.id];
      updateGlobalPlayerCount();
    });

    socketForRoom.on(
      CommEventNames.PlayerUpdateFromClient,
      (playerState: CommPlayerStateFromPlayer) => {
        newestPlayerStates[socketForRoom.id] = playerState;
        roomSpecific.emit(CommEventNames.PlayerStatusFromServer, {
          ...playerState,
          id: socketForRoom.id,
        } as CommPlayerStateFromServer);
      }
    );

    socketForRoom.on(CommEventNames.ChatMessage, (chat: CommChatMessage) => {
      console.log("received chat message " + chat.text);
      roomSpecific.emit(CommEventNames.ChatMessage, chat);
    });
  });
});

app.listen(55080);

console.log("Server started at " + new Date());
