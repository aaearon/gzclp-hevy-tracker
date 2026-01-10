import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import prettier from 'eslint-config-prettier'

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'coverage', '*.config.js', '*.config.ts', '*.config.d.ts', 'specs/*/contracts/*.ts'] },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ['tests/*.ts', 'tests/*.tsx', 'tests/*/*.ts', 'tests/*/*.tsx', 'tests/*/*/*.ts', 'tests/*/*/*.tsx'],
          maximumDefaultProjectFileMatchCount_THIS_WILL_SLOW_DOWN_LINTING: 50,
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  // Test files have relaxed rules for jest-dom matchers and test utilities
  {
    files: ['tests/**/*.{ts,tsx}'],
    rules: {
      // jest-dom matchers are not properly typed for ESLint strict type checking
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      // Allow deprecated APIs in tests (e.g., document.createElement for testing)
      '@typescript-eslint/no-deprecated': 'off',
      // Allow non-null assertions in tests (common for test fixtures)
      '@typescript-eslint/no-non-null-assertion': 'off',
      // Allow unused vars in tests (common pattern for destructuring)
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      // Allow empty functions in tests (common for mocks)
      '@typescript-eslint/no-empty-function': 'off',
      // Allow reject with non-Error in tests
      '@typescript-eslint/prefer-promise-reject-errors': 'off',
      // Allow unnecessary conditions in tests (defensive coding)
      '@typescript-eslint/no-unnecessary-condition': 'off',
      // Allow require-await issues in tests
      '@typescript-eslint/require-await': 'off',
      // Allow floating promises in tests (often intentional)
      '@typescript-eslint/no-floating-promises': 'off',
      // Allow Array<T> syntax in tests
      '@typescript-eslint/array-type': 'off',
      // Allow template expressions in tests
      '@typescript-eslint/restrict-template-expressions': 'off',
      // Allow explicit any in tests (useful for mocking)
      '@typescript-eslint/no-explicit-any': 'off',
      // Allow || vs ?? in tests
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
    },
  },
  prettier
)
