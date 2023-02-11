import NetworkManager from "./networkManager";

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
    this.chatContainer.innerHTML = '<div id="chatContentContainer"></div>';
    this.addInputToChat();

    if (!this.alreadyClearedOnce) {
      this.alreadyClearedOnce = true;
      this.addLineToChat(
        "Welcome to Dynamite Dan Multiplayer chatroom complex!",
        true
      );
      this.addLineToChat(
        'TLDR: This is a reverse-engineered/reprogrammed version of the classic (at least for some Europeans: <a href="https://www.crashonline.org.uk/27/awards.htm" target="_blank">best platform game of the year 1985</a>) 8-bit game. ' +
          "While there is no real goal in this version, the platforming implementation is enhanced by turning it into an online multiplayer chat room. " +
          "<b>Click on the game screen and use arrow keys (or touch the game screen edges) to move.</b> " +
          "<b>You can chat with other players located in the same room</b>: write your text into the text box below and press enter. " +
          "The grid in the corner of the chat (hover your mouse over it to see it better) indicates the rooms in which other players are located and also allows you to rename yourself and reset the game if you somehow get stuck. " +
          "Can you and your friends surivive a trip around the map on the river raft together? " +
          "Where do the teleporters take you? " +
          "Who survives if your gang accidentally misses the elevator and fall through the empty elevator shaft? " +
          "Who makes the most amazing leaps on the trampolines? " +
          'What would <a href="https://postlmg.cc/9DHY0C4R" target="_blank">Rod Bowket</a> think about all this?',
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
    line.classList.add("chatTextItem");
    line[specialStyle ? "innerHTML" : "innerText"] = text;
    line.classList.add(specialStyle ? "special" : "normal");
    this.chatContainer.querySelector("div").appendChild(line);

    this.addInputToChat(wasFocused);
  }
}
