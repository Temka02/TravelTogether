import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    mockReset: true, // важно: сбрасывать моки между тестами
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "**/node_modules/**",
        "**/test/**",
        "**/*.config.*",
        "**/dist/**",
        "**/src/components/ui/**",
        "**/src/main.tsx",
        "**/src/__mocks__/**",
        "src/app/components/pages/CreateTrip.tsx",
        "src/app/components/pages/EditTrip.tsx",
      ],
      thresholds: {
        statements: 80,
        branches: 68,
        functions: 70,
        lines: 80,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
