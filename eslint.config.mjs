import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";

/** @type {import('eslint').Linter.Config[]} */
export default [
  { files: ["**/*.{js,jsx,ts,tsx}"] },
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  {
    settings: {
      react: {
        version: "detect", // Автоматически определяет версию React из package.json
      },
    },
    rules: {
      "react/prop-types": "off", // Отключаем проверку prop-types, так как используем TypeScript
      "no-console": "warn", // Предупреждаем о console.log
      "@typescript-eslint/no-unused-vars": "warn", // Предупреждаем о неиспользуемых переменных
    },
  },
];