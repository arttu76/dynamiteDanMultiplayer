import "../resources/index.css";

import NetworkManager from "./networkManager";
import RoomManager from "./roomManager";
import TeleporterManager from "./teleportManager";
import ElevatorManager from "./elevatorManager";
import RaftManager from "./raftManager";
import PlayerManager from "./playerManager";
import XY from "./xy";

const resizer = () => {
  const { innerWidth, innerHeight } = window as any;

  const px = (value: number) => Math.round(value) + "px";

  const sideBySideLayout = window.innerWidth>window.innerHeight;

  const scale = Math.min(
    innerWidth / (sideBySideLayout ? 2 : 1) / 256,
    innerHeight / (sideBySideLayout ? 1 : 2) / (192 - 4 * 8)
  );

  const container: HTMLElement = document.querySelector("#container");
  const map: HTMLElement = document.querySelector("#map");
  const chat: HTMLElement = document.querySelector("#chat");
  if (sideBySideLayout) {
    container.style.transformOrigin = "left center";
    container.style.left = px(0);
    container.style.top = px(innerHeight/2 - container.clientHeight/2);
    map.style.top = px(10);
    map.style.right = px(10);
    chat.style.top = px(0);
    chat.style.right = px(0);
    chat.style.width = px(innerWidth / 2);
    chat.style.boxShadow = "inset 0 0px 65px 52px rgb(0 0 0 / 25%), inset 10px 0 30px black";
  } else {
    container.style.transformOrigin = "left top";
    container.style.left = px(innerWidth/2 - container.clientWidth*scale/2);
    container.style.top = px(0);
    map.style.top = px(container.clientHeight*scale+10);
    map.style.right = px(10);
    chat.style.top = px(container.clientHeight*scale);
    chat.style.right = px(0);
    chat.style.width = px(innerWidth); 
    chat.style.boxShadow = "inset 0 0px 65px 52px rgb(0 0 0 / 25%), inset 0 10px 30px 0px black";
  }

  (document.querySelector("#container") as HTMLElement).style.transform =
    "scale(" + scale + ")";
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
  const networkManager = new NetworkManager(roomManager);
  const teleporterManager = new TeleporterManager(roomManager);
  const elevatorManager = new ElevatorManager(roomManager);
  const raftManager = new RaftManager(roomManager);

  const playerManager = new PlayerManager(
    new XY(parseUrlOr("xy", 0, 130), parseUrlOr("xy", 1, 20)),
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
    /*
    if (key === "d") roomManager.moveRight();
    if (key === "a") roomManager.moveLeft();
    if (key === "w") roomManager.moveUp();
    if (key === "s") roomManager.moveDown();
*/
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
    const time =
      Date.now() -
      (networkManager.timeDiff === null ? 0 : networkManager.timeDiff);

    roomManager.updateMonsters(time);
    roomManager.updateLasers(time);
    teleporterManager.updateTeleporter(time);
    elevatorManager.updateElevator(time);
    raftManager.updateRaft(time);
    playerManager.update(time);
  }, 1000 / 25);

  resizer();

})();
