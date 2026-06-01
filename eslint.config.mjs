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
      // Respect the established `_`-prefix convention for intentionally-unused
      // bindings (e.g. vestigial public-API props kept for compatibility).
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      // eslint-plugin-react-hooks v7 ships React-Compiler-readiness diagnostics.
      // Forge deliberately walks/clones the children tree and reads RHF subjects
      // during render — correct for a form-orchestration library that does not use
      // the React Compiler. Downgrade these to warn (same precedent as no-explicit-any
      // above); rules-of-hooks + exhaustive-deps remain errors.
      'react-hooks/static-components': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/use-memo': 'warn',
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
