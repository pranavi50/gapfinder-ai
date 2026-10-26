import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next";
import nextTs from "eslint-config-next/typescript.js";

export default defineConfig([
  ...nextVitals.configs["core-web-vitals"],
  ...nextTs,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);
