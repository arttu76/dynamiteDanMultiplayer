export enum CommChannels {
    Global = "/global",
    RoomPrefix = "/room"
}

export enum CommEventNames {
    Initialize = 'i',
    MapUpdate = 'm',
    PlayerUpdateFromClient = 'u',
    PlayerStatusFromServer = 'p',
    PlayerRemove = 'r',
    MonsterDeath = 'd'
}

// info player receives from server when first initializing
export interface CommInitInfo {
    serverTime: number; // server time in milliseconds 
}

// "global" information transmitted to every player
export interface CommMap {
    playerCounts: number[]; // array of number of users in each room
}

// state player sends to server 
export interface CommPlayerStateFromPlayer {
    x: number;
    y: number;
    facingLeft: boolean;
    frame: number;
}

// state player received from server about one player
export interface CommPlayerStateFromServer extends CommPlayerStateFromPlayer {
    id: string; // socket id
}

// sent to players in a room when another player leaves
export interface CommRemoveOtherPlayerFromServer {
    id: string;
}

// transmitted when someone hits a monster
export interface CommMonsterDeath {
    roomNumber: number,
    monsterId: number,
    deadAt: number
}
