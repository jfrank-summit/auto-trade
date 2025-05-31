// eslint.config.js
import globals from "globals";
import tseslint from "typescript-eslint";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";

export default tseslint.config(
  {
    // Global ignores
    ignores: [
      "node_modules/",
      "dist/",
      "coverage/",
      "prettier.config.js",
      "*.config.js",
    ],
  },
  {
    // Base JavaScript/ESLint recommended rules for .js files
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.es2020,
      },
    },
    rules: {
      "no-console": "warn",
    },
  },
  // TypeScript specific configurations for .ts files
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.node,
        ...globals.es2020,
      },
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
    },
    rules: {
      ...tseslint.configs.recommendedTypeChecked.rules,
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-use-before-define": [
        "error",
        { functions: true, classes: true, variables: true },
      ],
    },
  },
  // Prettier configuration - should be last and apply to all relevant files
  eslintPluginPrettierRecommended
);
