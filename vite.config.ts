import { defineConfig, loadEnv } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { nitro } from "nitro/vite";
import path from "node:path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), ["VITE_", "SUPABASE_", "GEMINI_"]);
  Object.assign(process.env, env);

  const envDefine: Record<string, string> = {};
  for (const [key, value] of Object.entries(env)) {
    if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)) {
      envDefine[`import.meta.env.${key}`] = JSON.stringify(value);
      envDefine[`process.env.${key}`] = JSON.stringify(value);
    }
  }

  return {
    define: envDefine,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      dedupe: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@tanstack/react-query",
        "@tanstack/query-core",
      ],
    },
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react-dom/client",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
      ],
      ignoreOutdatedRequests: true,
    },
    plugins: [
      tailwindcss(),
      tsConfigPaths({ projects: ["./tsconfig.json"] }),
      tanstackStart({
        server: { entry: "server" },
        importProtection: {
          behavior: "error",
          client: {
            files: ["**/server/**"],
            specifiers: ["server-only"],
          },
        },
      }),
      nitro({
        preset: "vercel",
      }),
      viteReact(),
    ],
  };
});
