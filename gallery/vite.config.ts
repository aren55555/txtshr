import tailwindcss from "@tailwindcss/vite";
import { execSync } from "child_process";
import path from "path";
import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";

const gitSha = process.env.GIT_SHA ?? execSync("git rev-parse HEAD").toString().trim();

export default defineConfig({
  plugins: [tailwindcss(), solidPlugin()],
  resolve: {
    // Render the viewer's *actual* components, not copies.
    alias: {
      "@viewer": path.resolve(__dirname, "../viewer/src"),
    },
    // The aliased viewer sources must resolve solid-js from the gallery's
    // node_modules — two Solid runtimes on one page break reactivity.
    dedupe: ["solid-js"],
  },
  build: {
    target: "esnext",
  },
  define: {
    __GIT_SHA__: JSON.stringify(gitSha),
  },
});
