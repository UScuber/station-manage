import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";


export default defineConfig({
  server: {
    host: true,
    open: true,
    port: 3000,
  },
  resolve: {
    alias: {
      src: resolve(__dirname, "./src/"),
    },
  },
  build: {
    outDir: "build",
  },
  plugins: [react()],
});
