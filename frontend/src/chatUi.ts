import NetworkManager from "./networkManager";

export default class ChatUi {
  chatContainer: HTMLElement;

  constructor(private networkManager: NetworkManager) {
    this.chatContainer = document.querySelector("#chat");

    this.chatContainer.innerHTML = '<div id="chatContentContainer"></div>';
    this.addInputToChat(false, '');

      this.addLineToChat(
        "Welcome to Dynamite Dan Multiplayer chatroom complex!",
        true
      );
      this.addLineToChat(
        'TLDR: This is a reverse-engineered/reprogrammed version of the classic (at least for some Europeans: <a href="https://www.crashonline.org.uk/27/awards.htm" target="_blank">best platform game of the year 1985</a>) 8-bit game. ' +
          "While there is no real goal in this version, the platforming implementation is enhanced by turning it into an online multiplayer chat room. " +
          "<b>Click on the game screen and use arrow keys (or touch the game screen edges) to move.</b> " +
          "<b>You can chat with other players</b>: write your text into the text box below and press enter. " +
          "The grid in the corner of the chat (hover your mouse over it to see it better) indicates the rooms in which other players are located and also allows you to rename yourself and reset the game if you somehow get stuck. " +
          "Can you and your friends surivive a trip around the map on the river raft together? " +
          "Where do the teleporters take you? " +
          "Who survives if your gang accidentally misses the elevator and fall through the empty elevator shaft? " +
          "Who makes the most amazing leaps on the trampolines? " +
          'What would <a href="https://postlmg.cc/9DHY0C4R" target="_blank">Rod Bowket</a> think about all this?',
        true
      );
    
  }

  private addInputToChat(focus = false, oldValue: string) {
    const input = document.createElement("input");
    input.value = oldValue || '';
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
    this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    focus && input.focus();
  }

  addLineToChat(text: string, specialStyle = false) {
    if (!text.trim().length) {
      return;
    }

    const oldInput = this.chatContainer.querySelector("input");
    const wasFocused = document.activeElement === oldInput;
    const value = oldInput.value;
    oldInput?.remove();

    const line = document.createElement("div");
    line.classList.add("chatTextItem");
    line[specialStyle ? "innerHTML" : "innerText"] = text;
    line.classList.add(specialStyle ? "special" : "normal");
    this.chatContainer.querySelector("div").appendChild(line);

    this.addInputToChat(wasFocused, value || "");
  }
}
