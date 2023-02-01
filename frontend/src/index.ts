import "../resources/index.css";

import NetworkManager from "./networkManager";
import RoomManager from "./roomManager";
import TeleporterManager from "./teleportManager";
import ElevatorManager from "./elevatorManager";
import RaftManager from "./raftManager";
import PlayerManager from "./playerManager";
import XY from "./xy";

const resizer = () =>
  ((document.querySelector("#container") as HTMLElement).style.transform =
    "scale(" +
    Math.min(window.innerWidth / 256, window.innerHeight / (192-4*8)) +
    ")");
addEventListener("resize", resizer);
resizer();

(async function () {
  const roomManager = new RoomManager(new XY(4, 5)); // proper start location 3,5
  const networkManager = new NetworkManager(roomManager);
  const teleporterManager = new TeleporterManager(roomManager);
  const elevatorManager = new ElevatorManager(roomManager);
  const raftManager = new RaftManager(roomManager);

  const playerManager = new PlayerManager(
    new XY(130, 20), // proper start location 130, 20
    roomManager,
    teleporterManager,
    networkManager
  );

  document.addEventListener("keyup", (event) => {
    const key = event.key;

    if (key === "ArrowUp") playerManager.pressedJump = false;
    if (key === "ArrowDown") playerManager.pressedDown = false;
    if (key === "ArrowRight") playerManager.pressedRight = false;
    if (key === "ArrowLeft") playerManager.pressedLeft = false;

    if (key === "d") roomManager.moveRight();
    if (key === "a") roomManager.moveLeft();
    if (key === "w") roomManager.moveUp();
    if (key === "s") roomManager.moveDown();

    if (key === "z") playerManager.player.x -= 15;
    if (key === "v") playerManager.player.x += 15;
    if (key === "x") playerManager.player.y -= 15;
    if (key === "c") playerManager.player.y += 15;
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "ArrowUp") playerManager.pressedJump = true;
    if (event.key === "ArrowDown") playerManager.pressedDown = true;
    if (event.key === "ArrowRight") playerManager.pressedRight = true;
    if (event.key === "ArrowLeft") playerManager.pressedLeft = true;
  });

  setInterval(() => {
    const time = Date.now() - (
      networkManager.timeDiff===null
      ? 0
      : networkManager.timeDiff
      );
    roomManager.updateMonsters(time);
    teleporterManager.updateTeleporter(time);
    elevatorManager.updateElevator(time);
    raftManager.updateRaft(time);
    playerManager.update(time);
  }, 1000 / 25);
})();
