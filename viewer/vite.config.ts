import Icons from "unplugin-icons/vite";
import tailwindcss from "@tailwindcss/vite";
import { execSync } from "child_process";
import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import { META_DESCRIPTION } from "./src/marketing";

const gitSha = process.env.GIT_SHA ?? execSync("git rev-parse HEAD").toString().trim();

export default defineConfig({
  plugins: [
    tailwindcss(),
    solidPlugin(),
    Icons({
      compiler: "solid",
      scale: 1,
      defaultClass: "w-5 h-5",
    }),
    {
      name: "inject-marketing",
      transformIndexHtml: (html) =>
        html.replaceAll("%META_DESCRIPTION%", META_DESCRIPTION),
    },
  ],
  build: {
    target: "esnext",
  },
  define: {
    __GIT_SHA__: JSON.stringify(gitSha),
  },
});
