/** @type {import('prettier').Config} */
const config = {
  trailingComma: "all",
  tabWidth: 2,
  semi: false,
  singleQuote: true,
  printWidth: 100,
  ignorePatterns: ["dist", "node_modules"],
  plugins: ["@ianvs/prettier-plugin-sort-imports"],
  importOrder: [
    "<BUILTIN_MODULES>",
    "",
    "<THIRD_PARTY_MODULES>",
    "",
    "^@/(.*)$",
    "",
    "^./(.*)$",
    "",
    "<TYPES>",
  ],
  importOrderParserPlugins: ["typescript"],
  importOrderTypeScriptVersion: "5.8.3",
  importOrderCaseSensitive: false,
  overrides: [
    {
      files: ["*.md"],
      options: {
        parser: "markdown",
        proseWrap: "always",
      },
    },
  ],
};

export default config;
