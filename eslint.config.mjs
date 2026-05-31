// eslint.config.mjs
// Source: https://typescript-eslint.io/getting-started/
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
  js.configs.recommended,
  tseslint.configs.recommended,
  reactHooks.configs.flat['recommended-latest'],
  prettierConfig,
  {
    // Apply only to src/
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      // D-12: recommended only, not strict-type-checked
      // warn (not error) to avoid blocking on the ~46 existing as-any casts
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  {
    // Ignore generated output and config files
    ignores: [
      'dist/**',
      'node_modules/**',
      '*.config.mjs',
      '*.config.ts',
      'vitest.config.ts',
    ],
  }
);
