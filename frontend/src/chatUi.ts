import NetworkManager from "./networkManager";
import { range } from "./util";

export default class ChatUi {
  chatContainer: HTMLElement;

  constructor(private networkManager: NetworkManager) {
    this.chatContainer = document.querySelector("#chat");
    this.clearChat();
  }

  private addInputToChat(focus = false) {
    const input = document.createElement("input");
    input.setAttribute("type", "text");
    input.addEventListener("keydown", (event) => event.stopPropagation());
    input.addEventListener("keyup", (event) => {
      if (event.key === "Enter" && input.value.trim()) {
        this.networkManager.sendChat(input.value);
        input.value = "";
      }
      event.stopPropagation();
    });
    this.chatContainer.appendChild(input);
    focus && input.focus();
  }

  clearChat() {
    this.chatContainer.innerHTML = "";
    this.addInputToChat();
  }

  addLineToChat(text: string) {
    if (!text.trim().length) {
      return;
    }

    const oldInput=this.chatContainer.querySelector("input");
    const wasFocused=document.activeElement === oldInput;
    oldInput?.remove();

    const line = document.createElement("div");
    line.innerHTML = text;
    this.chatContainer.appendChild(line);

    this.addInputToChat(wasFocused);
  }
}
