import { defineConfig } from "vitest/config"
import path from "node:path"

export default defineConfig({
  resolve: {
    // Mirror tsconfig's "@/*" → "./*" alias so tests import like app code.
    alias: { "@": path.resolve(__dirname) },
  },
  test: {
    include: ["**/*.test.ts"],
    exclude: ["node_modules", ".next"],
  },
})
