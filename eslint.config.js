import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import vuePlugin from "eslint-plugin-vue";
import vueParser from "vue-eslint-parser";

export default [
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "*.config.*",
      "e2e/**",
    ],
  },

  // TypeScript files
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: { project: false },
    },
    plugins: { "@typescript-eslint": tsPlugin },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      "@typescript-eslint/no-explicit-any": "off",
    },
  },

  // Vue SFCs (script blocks parsed by the TS parser)
  ...vuePlugin.configs["flat/recommended"].map((cfg) => ({
    ...cfg,
    files: ["**/*.vue"],
  })),
  {
    files: ["**/*.vue"],
    languageOptions: {
      parser: vueParser,
      parserOptions: { parser: tsParser, project: false },
    },
    plugins: { "@typescript-eslint": tsPlugin, vue: vuePlugin },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      "@typescript-eslint/no-explicit-any": "off",
      // Single-word components App/Breadcrumbs/SearchBar are intentional
      "vue/multi-word-component-names": "off",
    },
  },
];
