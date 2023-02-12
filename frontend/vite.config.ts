import { defineConfig, Plugin } from "vite";
import fs from "fs";

const snaLoader: Plugin = {
  name: "sna-loader",
  transform(code, id) {
    if (!id.endsWith(".sna")) return null;
    const data = fs.readFileSync(id);
    const hex = data.toString("hex");
    return `export default '${hex}';`;
  },
};

export default defineConfig({
  assetsInclude: ["**/*.sna"],
  plugins: [snaLoader],
  publicDir: "resources",
  server: {
    proxy: {
      "/socket.io": "http://localhost:55080",
    },
  },
  resolve: {
    extensions: [ '.ts' ]
  }
});
