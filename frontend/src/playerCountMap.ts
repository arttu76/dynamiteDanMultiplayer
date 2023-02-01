import { range } from "./util";

export default class PlayerCountMap {

    mapRoomDivs: HTMLElement[] = [];

    constructor() {
        const mapContainer=document.querySelector('#map');
        range(48).forEach(idx => {
            const div = document.createElement('div');
            mapContainer.appendChild(div);
            this.mapRoomDivs[47-idx]=div;
        });
    }

    updateMap(peopleInRooms: number[]) {
        peopleInRooms.forEach((amount, idx) => {
            this.mapRoomDivs[idx].innerHTML=''+(amount || '');
        });
    }
}
