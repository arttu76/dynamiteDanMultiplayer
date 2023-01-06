import "../resources/index.css";

import RoomManager from "./roomManager";
import DanManager from "./danManager";

const resizer = () =>
  ((document.querySelector("#container") as HTMLElement).style.transform =
    "scale(" +
    Math.min(window.innerWidth / 256, window.innerHeight / 192) +
    ")");
addEventListener("resize", resizer);
resizer();

(async function () {
  const roomManager = new RoomManager();
  const danManager = new DanManager(roomManager);

  document.addEventListener("keyup", (event) => {
    if (event.key === "ArrowUp") danManager.pressedJump = false;
    if (event.key === "ArrowRight") danManager.pressedRight = false;
    if (event.key === "ArrowLeft") danManager.pressedLeft = false;

    if (event.key === "d") roomManager.moveRight();
    if (event.key === "a") roomManager.moveLeft();
    if (event.key === "w") roomManager.moveUp();
    if (event.key === "s") roomManager.moveDown();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "ArrowUp") danManager.pressedJump = true;
    if (event.key === "ArrowRight") danManager.pressedRight = true;
    if (event.key === "ArrowLeft") danManager.pressedLeft = true;
  });

  setInterval(() => {
    roomManager.updateMonsters(Date.now());
    danManager.update();
  }, 1000 / 25);
})();
