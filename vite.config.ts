import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@windows-explorer/contracts": fileURLToPath(new URL("./src/contracts.ts", import.meta.url)),
    },
  },
  test: { environment: "jsdom", globals: true, include: ["src/**/*.test.ts"] },
});
