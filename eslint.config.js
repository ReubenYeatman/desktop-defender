import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';

export default [
  {
    files: ['src/**/*.ts'],
    ignores: ['src/config/**/*.ts'], // Config files CAN have magic numbers
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      // Warn on magic numbers in game logic
      'no-magic-numbers': ['warn', {
        ignore: [0, 1, -1, 2, 0.5, 100, 1000], // Common safe values
        ignoreArrayIndexes: true,
        ignoreDefaultValues: true,
        enforceConst: true,
      }],
      // Catch unused variables
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
    },
  },
  {
    // Config files - allow magic numbers
    files: ['src/config/**/*.ts'],
    languageOptions: {
      parser: tsParser,
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      'no-magic-numbers': 'off',
    },
  },
];
