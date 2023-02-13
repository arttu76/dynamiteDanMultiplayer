
# Dynamite Dan Multiplayer

Both frontend and backend TypeScript implementation share some interfaces. Those common interfaces are defined in /common/commonTypes.ts file.

## Frontend

Front uses socket.io to communicate with backend.

### How to build

Have nodejs and npm installed, and do:

    npm build

### What to do with the build:

To run it:

    node backend/dist/server.js

And open your browser in port 55080.

### Development build
If you want to do a development build which automatically updates components when you modify the code, do:

    npm run dev

Browser window will automatically open.

## Socket communication

The game contains 48 rooms. There is a channel for each room where the players in that room are (for example `/room34`) and a global room that everyone belongs to (`/global`). When player, for example walks to the edge of a room into another room, the player is removed from the "room's channel" and placed into "the another room's channel". The player is always present in the global channel.

### `commontypes.ts`
Channel names or channel name prefixes are named in `CommChannels`-enumeration.
Event names are named in `CommEventName`-enumeration.
Interfaces are specified for each piece of communication, and the TypeScript backend and frontend use these (=change one side, the other side does not compile until "the interface contract is respected").

### Server functionality
Server stores couple of things in memory:
 * Which player (=socket) is in which room 
 * Newest received player state for each player
 * Last time a monster has died (=collided in player) for all monsters

Communication goes like this:
| Channel | When server receives | What does the server do then? |
| --- |---- | ----|
| - | When server (re)starts | Send `CommEventNames.RequestClientReset` to everyone in the global channel - clients should fully reinitialize. |  
| Global | New connection | Send `CommInitInfo` |
| Global | `CommEventNames.MonsterDeath`| Store the monster death in memory and send the same message to everyone in the Global channel |
| Room-specific | New connection | Add new player's socket into memory. Send list of player counts to everyone (`CommEventNames.MapUpdate`) in the global channel. Send every other player's info who is in the same room (`CommEventNames.PlayerStatusFromServer` / `CommPlayerStateFromServer`) into the room-specific channel. Broadcast all `CommMonsterDeaths` related to this room into the global channel (`CommEventNames.MonsterDeath`) |
| Room-specific | Disconnection | Remove that player/socket from memory. Send `CommEventNames.PlayerRemove` / `CommRemoveOtherPlayerFromServer` to the room-specific channel. Send list of player counts to everyone (`CommEventNames.MapUpdate`) in the global channel. |
| Room-specific | `CommEventNames.PlayerUpdateFromClient` | Update newest player states. Emit `CommEventNames.PlayerStatusFromServer`/ `CommPlayerStateFromServer`to everyone in the room-specific channel. |
| Room-specific | `CommEventNames.ChatMessage`| Emit `CommEventNames.ChatMessage`/ `CommChatMessage`to everyone in the room-specific channel |

## TODO
### Frontend
 - fix iphone not closing sockets instantly when closing tab
 - check that channel communication described above is up-to-date
### Backend
 - backend with golang
