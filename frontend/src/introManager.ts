export default function getName(): Promise<string> {
  return new Promise<string>((resolve) => {
    const closeIntro = (name: string) => {
      document.querySelector("#intro").innerHTML = "Welcome " + name + "!";
      setTimeout(() => resolve(name), 1);
      setTimeout(() => document.querySelector("#intro").remove(), 3000);
    };

    const nameMatch = location.search.match(/[&?]name=([^&$]*)/);
    if (nameMatch && nameMatch[1]) {
      closeIntro(nameMatch[1]);
      return;
    }

    const nameInput = document.querySelector<HTMLInputElement>("#nameInput");
    nameInput.focus();

    const checkName = () => {
      const name = nameInput.value.trim();
      if (name) {
        closeIntro(name);
      }
    };

    nameInput.addEventListener("keydown", (event: KeyboardEvent) => event.key=="Enter" && checkName());
    document.querySelector("#nameButton").addEventListener("click", checkName);
  });
}
