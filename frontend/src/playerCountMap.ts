import PlayerManager from "./playerManager";
import { range } from "./util";

export default class PlayerCountMap {
  mapRoomDivs: HTMLElement[] = [];

  constructor(private playerManager: PlayerManager) {
    const mapContainer = document.querySelector("#map");
    range(48).forEach((idx) => {
      const div = document.createElement("div");
      div.className="mapRoom";
      mapContainer.appendChild(div);
      this.mapRoomDivs[47 - idx] = div;

      if (idx % 8 === 7) {
        mapContainer.appendChild(document.createElement("br"));
      }
    });

    const mapButtonsContainer = document.createElement('div');
    mapButtonsContainer.className='mapButtons';
    mapContainer.appendChild(mapButtonsContainer);

    const addButton = (buttonText: string, func: () => void) => {
      const button = document.createElement("div");
      button.innerText = buttonText;
      button.addEventListener("click", func);
      mapButtonsContainer.appendChild(button);
    };

    addButton("Reset", () => {
      if (confirm("Really reset?")) {
        location.href = "/?name=" + encodeURIComponent(this.playerManager.name);
      }
    });

    addButton("Rename", () => {
      this.playerManager.rename(
        prompt("Enter your new nickname", this.playerManager.name)
      );
    });
  }

  updateMap(peopleInRooms: number[]) {
    peopleInRooms.forEach((amount, idx) => {
      this.mapRoomDivs[idx].innerHTML = "" + (amount || "");
    });
  }
}
