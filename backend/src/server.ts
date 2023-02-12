import express from "express";
import http from "http";
import { Server, Socket } from "socket.io";
import {
  CommChannels,
  CommEventNames,
  CommInitResponse,
  CommPlayerStateFromPlayer,
  CommPlayerStateFromServer,
  CommRemoveOtherPlayerFromServer,
  CommMonsterDeath,
  CommChatMessage,
  CommPlayerGlobals,
} from "./../../common/commonTypes";
import path from "path";

const range = (maxExclusive: number) => Array.from(Array(maxExclusive).keys());
const app = express();
const server = http.createServer(app);
const io = new Server(server);

const socketsByRooms: Socket[][] = range(48).map(() => []);
const newestPlayerStates: { [key: string]: CommPlayerStateFromPlayer } = {};
let monsterDeaths: CommMonsterDeath[] = [];

const serveStatic = (url: string, frontendDistFilename: string = null) => {
  app.get(url, (req, res) => {
    res.sendFile(
      path.join(
        __dirname,
        "../../frontend/dist/" + (frontendDistFilename || req.originalUrl)
      )
    );
  });
};
serveStatic("/favicon.ico");
serveStatic("/", "index.html");
serveStatic("/index.html");

app.use('/', express.static(path.join(  __dirname, "../../frontend/dist")));

const global = io.of(CommChannels.Global);
global.on("connection", (socketForGlobal) => {
  socketForGlobal.on(CommEventNames.Initialize, (_, callback) => {
    callback({
      serverTime: Date.now(),
      ...getPlayerGlobals(),
    } as CommInitResponse);
  });

  socketForGlobal.on(CommEventNames.MonsterDeath, (death: CommMonsterDeath) => {
    monsterDeaths = monsterDeaths.filter(
      (md) =>
        md.roomNumber !== death.roomNumber || md.monsterId !== death.monsterId
    );
    monsterDeaths.push(death);
    global.emit(CommEventNames.MonsterDeath, death);
  });
});

const getPlayerGlobals = (): CommPlayerGlobals => ({
  playerCounts: socketsByRooms.map((sockets) => sockets.length),
});

const emitPlayerGlobals = () => {
  global.emit(CommEventNames.PlayerGlobalsUpdate, getPlayerGlobals());
};

range(48).forEach((roomNumber) => {
  const roomSpecific = io.of(CommChannels.RoomPrefix + roomNumber);
  roomSpecific.on("connection", (socketForRoom) => {
    socketsByRooms[roomNumber].push(socketForRoom);
    emitPlayerGlobals();

    console.log("/room" + roomNumber + " " + socketForRoom.id + " connected");

    // tell about other players
    socketsByRooms[roomNumber]
      // don't tell about ourselves & tell only players we know something about
      .filter((playerSocket) => playerSocket.id !== socketForRoom.id && newestPlayerStates[playerSocket.id]?.name)
      .forEach((playerSocket) => {
        socketForRoom.emit(CommEventNames.PlayerStatusFromServer, {
          ...newestPlayerStates[playerSocket.id],
          id: playerSocket.id,
        } as CommPlayerStateFromServer);
      });

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
      emitPlayerGlobals();
    });

    socketForRoom.on(
      CommEventNames.PlayerUpdateFromClient,
      (playerState: CommPlayerStateFromPlayer) => {
        newestPlayerStates[socketForRoom.id] = playerState;
        roomSpecific.emit(CommEventNames.PlayerStatusFromServer, {
          ...playerState,
          name: playerState.name,
          id: socketForRoom.id,
        } as CommPlayerStateFromServer);
      }
    );

    socketForRoom.on(CommEventNames.ChatMessage, (chat: CommChatMessage) => {
      roomSpecific.emit(CommEventNames.ChatMessage, chat);
    });

    // prune unused connections
    setInterval(() => {
      let removedSomething = false;

      range(48).forEach((room) => {
        const sockets = socketsByRooms[room];
        if (sockets?.length) {
          return;
        }
        sockets
          .filter((socket) => !socket?.connected)
          .forEach((socket) => {
            removedSomething = true;
            roomSpecific.emit(CommEventNames.PlayerRemove, {
              id: socket.id,
            } as CommRemoveOtherPlayerFromServer);
            delete newestPlayerStates[socket.id];
            console.log("...pruned non-connected socket" + socket.id);
          });

        if (removedSomething) {
          socketsByRooms[roomNumber] = socketsByRooms[roomNumber].filter(
            (playerSocket) => playerSocket.connected
          );
          emitPlayerGlobals();
        }
      });
    }, 30 * 1000);
  });
});

server.listen(55080);

console.log(
  "55080 port server started at " +
    new Date() +
    path.join(__dirname) +
    ", requesting clients to do full reset in a sec..."
);
setTimeout(() => {
  console.log("Requesting full client reset NOW!");
  global.emit(CommEventNames.RequestClientReset);
}, 5000);
