import { defineConfig } from "vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import { devtools } from "@tanstack/devtools-vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { paraglideVitePlugin } from "@inlang/paraglide-js";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";

export default defineConfig(() => {
  return {
    plugins: [
      cloudflare(),
      nitro(),
      devtools(),
      paraglideVitePlugin({
        project: "./project.inlang",
        outdir: "./src/paraglide",
        strategy: ["url", "baseLocale"],
      }),
      tsconfigPaths({ projects: ["./tsconfig.json"] }),
      tailwindcss(),
      tanstackStart(),
      viteReact({
        babel: {
          plugins: ["babel-plugin-react-compiler"],
        },
      }),
    ],
    server: {
      proxy: {
        "/api/ingest": {
          target: "https://us.i.posthog.com",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/ingest/, ""),
          secure: false,
        },
      },
    },
  };
});
