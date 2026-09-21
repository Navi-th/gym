import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Vitest config.
 *
 * Tests are COLOCATED with the code they cover (`*.test.ts` next to the
 * implementation), so a pure function and its expectations move together and a
 * rename cannot silently orphan the tests.
 *
 * Note: `scripts/check-fsd-layers.mjs` deliberately exempts test files. A test
 * for a model file legitimately imports that file directly rather than going
 * through the slice's public API.
 */
export default defineConfig({
  test: {
    // All tested code so far is pure and framework-free, so no DOM needed.
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
