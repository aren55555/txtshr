import tailwindcss from "@tailwindcss/vite";
import { execSync } from "child_process";
import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";

const gitSha = process.env.GIT_SHA ?? execSync("git rev-parse HEAD").toString().trim();

export default defineConfig({
  plugins: [tailwindcss(), solidPlugin()],
  build: {
    target: "esnext",
  },
  define: {
    __GIT_SHA__: JSON.stringify(gitSha),
  },
});
