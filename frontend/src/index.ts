import "../resources/index.scss";

import getName from "./introManager";
import resizer from "./resizer";

import RoomManager from "./roomManager";
import TeleporterManager from "./teleportManager";
import ElevatorManager from "./elevatorManager";
import RaftManager from "./raftManager";
import PlayerManager from "./playerManager";
import XY from "./xy";

(async function () {
  resizer();
  const name = await getName();

  const parseUrlOr = (
    param: string,
    pos: number,
    defaultValue: number
  ): number => {
    const match = location.search.match(
      new RegExp("[?&]" + param + "=([0-9]+),([0-9]+)")
    );
    return match ? parseInt(match[pos + 1], 10) : defaultValue;
  };

  const roomManager = new RoomManager(
    new XY(parseUrlOr("room", 0, 3), parseUrlOr("room", 1, 5))
  );
  const teleporterManager = new TeleporterManager(roomManager);
  const elevatorManager = new ElevatorManager(roomManager);
  const raftManager = new RaftManager(roomManager);

  const playerManager = new PlayerManager(
    name,
    new XY(parseUrlOr("xy", 0, 130), parseUrlOr("xy", 1, 20)),
    roomManager,
    teleporterManager
  );

  const handleKey = (key: string, pressed: boolean) => {
    if (key === "ArrowUp") playerManager.pressedJump = pressed;
    if (key === "ArrowDown") playerManager.pressedDown = pressed;
    if (key === "ArrowRight") playerManager.pressedRight = pressed;
    if (key === "ArrowLeft") playerManager.pressedLeft = pressed;
  };

  document.addEventListener("keyup", (event) => handleKey(event.key, false));
  document.addEventListener("keydown", (event) => handleKey(event.key, true));

  const addTouchHandler = ["Up", "Down", "Left", "Right"].forEach(
    (direction: string) => {
      const div = document.querySelector("#touch" + direction);
      const key = "Arrow" + direction;
      div.addEventListener("touchstart", () => handleKey(key, true));
      div.addEventListener("touchend", () => handleKey(key, false));
    }
  );

  setInterval(() => {
    const time = Date.now() - playerManager.getTimeDiff();
    roomManager.updateMonsters(time);
    roomManager.updateLasers(time);
    roomManager.updateFloaters(time);
    teleporterManager.updateTeleporter(time);
    elevatorManager.updateElevator(time);
    raftManager.updateRaft(time);
    playerManager.update(time);
  }, 1000 / 25);

})();
