import "../resources/index.css";

import RoomManager from "./roomManager";
import TeleporterManager from "./teleportManager";
import ElevatorManager from "./elevatorManager";
import RaftManager from "./raftManager";
import DanManager from "./danManager";
import XY from "./xy";

const resizer = () =>
  ((document.querySelector("#container") as HTMLElement).style.transform =
    "scale(" +
    Math.min(window.innerWidth / 256, window.innerHeight / (192-4*8)) +
    ")");
addEventListener("resize", resizer);
resizer();

(async function () {
  const roomManager = new RoomManager(new XY(3, 5)); // proper start location 3,5
  const teleporterManager = new TeleporterManager(roomManager);
  const elevatorManager = new ElevatorManager(roomManager);
  const raftManager = new RaftManager(roomManager);

  const danManager = new DanManager(
    new XY(130, 20), // proper start location 130, 20
    roomManager,
    teleporterManager,
    elevatorManager
  );

  document.addEventListener("keyup", (event) => {
    const key = event.key;

    if (key === "ArrowUp") danManager.pressedJump = false;
    if (key === "ArrowDown") danManager.pressedDown = false;
    if (key === "ArrowRight") danManager.pressedRight = false;
    if (key === "ArrowLeft") danManager.pressedLeft = false;

    if (key === "d") roomManager.moveRight();
    if (key === "a") roomManager.moveLeft();
    if (key === "w") roomManager.moveUp();
    if (key === "s") roomManager.moveDown();

    if (key === "z") danManager.player.x -= 5;
    if (key === "v") danManager.player.x += 5;
    if (key === "x") danManager.player.y -= 5;
    if (key === "c") danManager.player.y += 5;
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "ArrowUp") danManager.pressedJump = true;
    if (event.key === "ArrowDown") danManager.pressedDown = true;
    if (event.key === "ArrowRight") danManager.pressedRight = true;
    if (event.key === "ArrowLeft") danManager.pressedLeft = true;
  });

  setInterval(() => {
    const time = Date.now();
    roomManager.updateMonsters(time);
    teleporterManager.updateTeleporter(time);
    elevatorManager.updateElevator(time);
    raftManager.updateRaft(time);
    danManager.update(time);
  }, 1000 / 25);
})();
