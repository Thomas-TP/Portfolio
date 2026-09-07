import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';

const eslintConfig = [
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-hooks/set-state-in-effect': 'off', // Valid for listeners and mount guards
      'react-hooks/refs': 'off',                 // Valid for controlled transitions
      'react-hooks/purity': 'off',               // Math.random() in useMemo is intentional (particles)
      'react-hooks/use-memo': 'off',             // useMergedRefs needs a dynamic-length dep array (rest params)
      'no-unused-vars': 'off', // Handled by TypeScript
      'no-undef': 'off',       // Handled by TypeScript
    },
  },
  {
    files: ['scripts/**/*.{js,mjs,cjs}', '*.{js,mjs,cjs}'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**', 'cloudflare-worker/**', 'public/**'],
  },
];

export default eslintConfig;

