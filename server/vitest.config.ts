import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
    setupFiles: ["tests/setup.ts"],
env: {
      DB_PATH: "./station-test.db",
      REACT_URL: "http://localhost:3000",
    },
  },
});
