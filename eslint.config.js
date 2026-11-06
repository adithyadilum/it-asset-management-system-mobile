// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['node_modules/**', '.expo/**', 'dist/**', 'android/**', 'ios/**'],
  },
  {
    rules: {
      // Informational logging is not gated in this app yet; warn/error only.
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
  {
    files: ['**/*.test.ts', '**/*.test.tsx'],
    rules: { 'no-console': 'off' },
  },
  {
    // Command-line scripts report to stdout; that is their entire output. The
    // dependency test runner printing its results is not stray logging.
    files: ['scripts/**/*'],
    rules: { 'no-console': 'off' },
  },
]);
