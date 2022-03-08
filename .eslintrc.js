module.exports = {
  env: {
    browser: true,
    node: true,
    es2021: true,
  },
  extends: [
  ],
  parserOptions: {
    sourceType: 'module',
  },
  plugins: [
  ],
  rules: {
    indent: [1, 2],
    quotes: [1, 'single'],
    semi: [1, 'never'],
    'no-trailing-spaces': 1,
    'quote-props': [1, 'as-needed'],
    'comma-dangle': [1, 'always-multiline'],
    'no-debugger': 2,
    'no-console': 1,
    'no-undef': 2,
    'space-infix-ops': 1,
  },
}
