import NetworkManager from "./networkManager";
import { range } from "./util";

export default class ChatUi {
  chatContainer: HTMLElement;

  alreadyClearedOnce = false;

  constructor(private networkManager: NetworkManager) {
    this.chatContainer = document.querySelector("#chat");
  }

  private addInputToChat(focus = false) {
    const input = document.createElement("input");
    input.setAttribute("type", "text");
    input.addEventListener("keydown", (event) => event.stopPropagation());
    input.addEventListener("keyup", (event) => {
      if (event.key === "Enter" && input.value.trim()) {
        const sentOk = this.networkManager.sendChat(input.value);
        if (sentOk) {
          input.value = "";
        }
      }
      event.stopPropagation();
    });
    const containerInnerDiv = this.chatContainer.querySelector("div");
    containerInnerDiv.appendChild(input);
    containerInnerDiv.scrollTop = containerInnerDiv.scrollHeight;
    focus && input.focus();
  }

  clearChat() {
    this.chatContainer.innerHTML = "<div></div>";
    this.addInputToChat();

    if (!this.alreadyClearedOnce) {
      this.alreadyClearedOnce = true;
      this.addLineToChat(
        "Welcome to Dan Dare Multiplayer chatroom complex!",
        true
      );
      this.addLineToChat(
        "TLDR: This is a reverse-engineered/reprogrammed version of the classic (at least for some Europeans) 8-bit game. " +
          "While there is no real goal in this version, the platforming implementation is enhanced by turning it into an online multiplayer chat room. " +
          "Click on the screen and use arrow keys to move." +
          "You can chat with other players located in the same room: write your text into the text box and press enter. " +
          "The grid in the corner of the chat indicates the rooms in which other players are located. " +
          "Can you and your friends surivive a trip around the map on the river raft together? " +
          "Where do the teleporters take you? " +
          "Who survives if your gang accidentally misses the elevator and fall through the empty elevator shaft? " +
          "Who makes the most amazing leaps on the trampolines? " +
          "These mysteries (and not much more, to be honest) await you!",
        true
      );
    }
  }

  addLineToChat(text: string, specialStyle = false) {
    if (!text.trim().length) {
      return;
    }

    const oldInput = this.chatContainer.querySelector("input");
    const wasFocused = document.activeElement === oldInput;
    oldInput?.remove();

    const line = document.createElement("div");
    line.innerText = text;
    line.className = specialStyle ? "special" : "normal";
    this.chatContainer.querySelector("div").appendChild(line);

    this.addInputToChat(wasFocused);
  }
}
