import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      // Thresholds set in Plan 04 after measuring achieved coverage (RISK-T2 / TEST-04 / D-05).
      thresholds: {
        lines: 0,
        functions: 0,
        statements: 0,
        branches: 0,
      },
      exclude: [
        "**/index.ts",
        "src/types.ts",
        "**/*.test.*",
        "**/*.test.tsx",
        "rollup.config.mjs",
        "src/test-utils.tsx",
      ],
    },
  },
});
