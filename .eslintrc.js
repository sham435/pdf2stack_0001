import tseslint from 'typescript-eslint';
import nextPlugin from '@next/eslint-plugin-next';

export default [
 ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: { project: true }
    },
    plugins: { '@next/next': nextPlugin },
    rules: {
      '@next/next/no-html-link-for-pages': 'error',
      '@typescript-eslint/no-explicit-any': 'warn'
    }
  }
];
