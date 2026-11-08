import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/unit/**/*.test.ts"],
    environment: "jsdom",
    // Fixed zone so date maths (including the March DST change) is tested deterministically.
    env: { TZ: "Europe/London" }
  }
});
