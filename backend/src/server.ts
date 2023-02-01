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
  CommMonsterDeath
} from "./../../commonTypes";

const app = express();

const range = (maxExclusive: number) => Array.from(Array(maxExclusive).keys());

interface PlayerInRoom {
  socket: Socket;
  player: string;
}

const playersInRooms: PlayerInRoom[][] = range(48).map(() => []);
const newestPlayerStates: { [key: string]: CommPlayerStateFromPlayer } = {};

// index = roomn number, content=array of latest monster death timestamps
const monsterDeaths: number[][] = range(48).map(() => []);

const io = require("socket.io")(1000, {
  cors: {
    origin: "http://localhost:9000",
    methods: ["GET", "POST"],
  },
});

app.get("/", (_, res) => res.redirect("http://localhost:9000"));

const global = io.of(CommChannels.Global);
global.on("connection", (socketOnGlobal) => {
  socketOnGlobal.on(CommEventNames.Initialize, (_, callback) =>
    callback({
      serverTime: Date.now(),
    } as CommInitInfo)
  );
  socketOnGlobal.on(CommEventNames.MonsterDeath, (death: CommMonsterDeath) => {
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
  roomSpecific.on("connection", (socket) => {
    playersInRooms[roomNumber].push({
      socket,
      player: null,
    } as PlayerInRoom);
    updateGlobalPlayerCount();

    console.log("/room" + roomNumber + " " + socket.id + " connected");

    // tell about other playes
    playersInRooms[roomNumber]
      .filter((sp) => sp.socket.id !== socket.id)
      .forEach((sp) =>
        socket.emit(CommEventNames.PlayerStatusFromServer, {
          ...newestPlayerStates[sp.socket.id],
          id: sp.socket.id,
        } as CommPlayerStateFromServer)
      );

    socket.on("disconnect", () => {
      console.log("/room" + roomNumber + " " + socket.id + " disconnected");
      playersInRooms[roomNumber] = playersInRooms[roomNumber].filter(
        (sp) => sp.socket.connected
      );
      roomSpecific.emit(CommEventNames.PlayerRemove, {
        id: socket.id,
      } as CommRemoveOtherPlayerFromServer);
      delete newestPlayerStates[socket.id];
      updateGlobalPlayerCount();
    });

    socket.on(
      CommEventNames.PlayerUpdateFromClient,
      (playerState: CommPlayerStateFromPlayer) => {
        newestPlayerStates[socket.id] = playerState;
        roomSpecific.emit(CommEventNames.PlayerStatusFromServer, {
          ...playerState,
          id: socket.id,
        } as CommPlayerStateFromServer);
      }
    );
  });
});

app.listen(55080);

console.log("Server started at " + new Date());
