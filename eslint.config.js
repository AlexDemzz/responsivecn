//  @ts-check

import { tanstackConfig } from "@tanstack/eslint-config"

export default [
  ...tanstackConfig,
  {
    rules: {
      "import/no-cycle": "off",
      "import/order": "off",
      "sort-imports": "off",
      "@typescript-eslint/array-type": "off",
      "@typescript-eslint/require-await": "off",
      "pnpm/json-enforce-catalog": "off",
    },
  },
  {
    files: ["registry/**"],
    rules: {
      "@typescript-eslint/naming-convention": "off",
    },
  },
  {
    ignores: [
      "eslint.config.js",
      ".prettierrc",
      ".source/**",
      "prototypes/**",
      "src/components/ui/**",
      "src/lib/utils.ts",
    ],
  },
]
