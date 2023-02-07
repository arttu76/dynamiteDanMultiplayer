import "../resources/index.css";

import RoomManager from "./roomManager";
import TeleporterManager from "./teleportManager";
import ElevatorManager from "./elevatorManager";
import RaftManager from "./raftManager";
import PlayerManager from "./playerManager";
import XY from "./xy";

const resizer = () => {
  const { innerWidth, innerHeight } = window as any;

  const px = (value: number) => Math.round(value) + "px";

  const sideBySideLayout = window.innerWidth > window.innerHeight;

  const scale = Math.min(
    innerWidth / (sideBySideLayout ? 2 : 1) / 256,
    innerHeight / (sideBySideLayout ? 1 : 2) / (192 - 4 * 8)
  );

  const container = document.querySelector<HTMLElement>("#container");
  const map = document.querySelector<HTMLElement>("#map");
  const chat = document.querySelector<HTMLElement>("#chat");
  const touch = document.querySelector<HTMLElement>("#touchControls");

  if (sideBySideLayout) {
    container.style.transformOrigin = "left center";
    touch.style.transformOrigin = "left center";
    container.style.left = px(0);
    touch.style.left = px(0);
    const top = innerHeight / 2 - container.clientHeight / 2;
    container.style.top = px(top);
    touch.style.top = px(top);

    map.style.top = px(10);
    map.style.right = px(10);

    chat.style.top = px(0);
    chat.style.right = px(0);
    chat.style.width = px(innerWidth / 2);
    chat.style.boxShadow =
      "inset 0 0px 65px 52px rgb(0 0 0 / 25%), inset 10px 0 30px black";
  } else {
    container.style.transformOrigin = "left top";
    touch.style.transformOrigin = "left top";
    const left = innerWidth / 2 - (container.clientWidth * scale) / 2;
    container.style.left = px(left);
    touch.style.left = px(left);
    container.style.top = px(0);
    (touch.style.top = px(0)),
      (map.style.top = px(container.clientHeight * scale + 10));
    map.style.right = px(10);

    chat.style.top = px(container.clientHeight * scale);
    chat.style.right = px(0);
    chat.style.width = px(innerWidth);
    chat.style.boxShadow =
      "inset 0 0px 65px 52px rgb(0 0 0 / 25%), inset 0 10px 30px 0px black";
  }

  container.style.transform = "scale(" + scale + ")";
  touch.style.transform = "scale(" + scale + ")";
};
addEventListener("resize", resizer);

(async function () {
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

  resizer();
})();
