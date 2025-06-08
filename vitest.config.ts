import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    testTimeout: 60000, // 1 minute max per test for API calls
    hookTimeout: 10000, // 10 seconds for setup/teardown
    teardownTimeout: 10000,
    // Run integration tests that require network access
    setupFiles: ["./src/test-setup.ts"],
  },
  esbuild: {
    target: "node18",
  },
});
