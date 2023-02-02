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

const socketsByRooms: Socket[][] = range(48).map(() => []);
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
    playerCounts: socketsByRooms.map((sockets) => sockets.length),
  } as CommMap);
};

range(48).forEach((roomNumber) => {
  const roomSpecific = io.of(CommChannels.RoomPrefix + roomNumber);
  roomSpecific.on("connection", (socketForRoom) => {
    socketsByRooms[roomNumber].push(socketForRoom);
    updateGlobalPlayerCount();

    console.log("/room" + roomNumber + " " + socketForRoom.id + " connected");

    // tell about other players
    socketsByRooms[roomNumber]
      // don't tell about ourselves & tell only players we know something about
      .filter((playerSocket) => playerSocket.id !== socketForRoom.id)
      .forEach((playerSocket) =>
        socketForRoom.emit(CommEventNames.PlayerStatusFromServer, {
          ...newestPlayerStates[playerSocket.id],
          id: playerSocket.id,
        } as CommPlayerStateFromServer)
      );

    // broadcast monster deaths for this room
    monsterDeaths
      .filter((md) => md.roomNumber === roomNumber)
      .forEach((md) => global.emit(CommEventNames.MonsterDeath, md));

    socketForRoom.on("disconnect", () => {
      console.log(
        "/room" + roomNumber + " " + socketForRoom.id + " disconnected"
      );
      socketsByRooms[roomNumber] = socketsByRooms[roomNumber].filter(
        (playerSocket) => playerSocket.connected
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
      roomSpecific.emit(CommEventNames.ChatMessage, chat);
    });
  });
});

app.listen(55080);

console.log(
  "Server started at " +
    new Date() +
    ", requesting clients to do full reset in a sec..."
);
setTimeout(() => {
  console.log("Requesting full client reset NOW!");
  global.emit(CommEventNames.RequestClientReset);
}, 5000);
