module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin', 'prettier'],
  rules: {
    quotes: [2, 'single', { avoidEscape: true }],
    'prettier/prettier': 2,
    'linebreak-style': ['error', 'unix'],
    'max-len': ['error', 160],
    '@typescript-eslint/no-var-requires': 0,
  },
  ignorePatterns: ['coverage'],
};
