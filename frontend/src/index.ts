import "../resources/index.css";

import RoomManager from "./roomManager";
import TeleporterManager from "./teleportManager";
import ElevatorManager from "./elevatorManager";
import DanManager from "./danManager";
import XY from "./xy";

const resizer = () =>
  ((document.querySelector("#container") as HTMLElement).style.transform =
    "scale(" +
    Math.min(window.innerWidth / 256, window.innerHeight / 192) +
    ")");
addEventListener("resize", resizer);
resizer();

(async function () {
  const roomManager = new RoomManager(new XY(3, 5));
  const teleporterManager = new TeleporterManager(roomManager);
  const elevatorManager = new ElevatorManager(roomManager);

  const danManager = new DanManager(
    new XY(75, 32),
    roomManager,
    teleporterManager,
    elevatorManager
  );

  document.addEventListener("keyup", (event) => {
    if (event.key === "ArrowUp") danManager.pressedJump = false;
    if (event.key === "ArrowRight") danManager.pressedRight = false;
    if (event.key === "ArrowLeft") danManager.pressedLeft = false;

    if (event.key === "d") roomManager.moveRight();
    if (event.key === "a") roomManager.moveLeft();
    if (event.key === "w") roomManager.moveUp();
    if (event.key === "s") roomManager.moveDown();

    if (event.key === "z") danManager.player.x -= 5;
    if (event.key === "v") danManager.player.x += 5;
    if (event.key === "x") danManager.player.y -= 5;
    if (event.key === "c") danManager.player.y += 5;
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "ArrowUp") danManager.pressedJump = true;
    if (event.key === "ArrowRight") danManager.pressedRight = true;
    if (event.key === "ArrowLeft") danManager.pressedLeft = true;
  });

  setInterval(() => {
    const time = Date.now();
    roomManager.updateMonsters(time);
    teleporterManager.updateTeleporter(time);
    elevatorManager.updateElevator(time);
    danManager.update(time);
  }, 1000 / 25);
})();
