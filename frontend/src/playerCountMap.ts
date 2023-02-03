import { range } from "./util";

export default class PlayerCountMap {
  mapRoomDivs: HTMLElement[] = [];

  constructor() {
    const mapContainer = document.querySelector("#map");
    range(48).forEach((idx) => {
      const div = document.createElement("div");
      mapContainer.appendChild(div);
      this.mapRoomDivs[47 - idx] = div;

      if (idx % 8 === 7) {
        mapContainer.appendChild(document.createElement("br"));
      }
    });
  }

  updateMap(peopleInRooms: number[]) {
    peopleInRooms.forEach((amount, idx) => {      
      this.mapRoomDivs[idx].innerHTML = "" + (amount || "");
      this.mapRoomDivs[idx].style.opacity = amount ? '0.5' : '0.25';
    });
  }
}
