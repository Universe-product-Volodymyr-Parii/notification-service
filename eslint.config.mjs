import { FlatCompat } from '@eslint/eslintrc';
import pluginJs from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier/flat';

import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const SRC = ['src/**/*.{ts,js,mjs}'];
const TEST = ['test/**/*.{ts,js,mjs}'];

const ALL_CODE = [...SRC, ...TEST];

export default [
  { ignores: ['**/node_modules/**', '**/dist/**', '**/.*/**'] },
  { ...pluginJs.configs.recommended, files: ALL_CODE },
  ...tseslint.configs.recommended.map((c) => ({ ...c, files: ALL_CODE })),
  ...compat
    .config({
      extends: ['plugin:import/recommended', 'plugin:import/typescript'],
    })
    .map((c) => ({ ...c, files: ALL_CODE })),
  {
    files: ALL_CODE,
    languageOptions: {
      ecmaVersion: 2024,
      globals: globals.node,
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },

    settings: {
      'import/resolver': {
        typescript: {
          project: './tsconfig.json',
          tsconfigRootDir: __dirname,
        },
        node: true,
      },
    },

    rules: {
      curly: ['warn', 'all'],
      'no-var': 'off',
      'no-fallthrough': ['error', { commentPattern: 'falls-through' }],

      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          disallowTypeAnnotations: false,
          fixStyle: 'separate-type-imports',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'import/no-named-as-default-member': 'off',
      'import/no-unresolved': 'error',
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            ['sibling', 'parent'],
            ['unknown', 'index', 'object'],
            'type',
          ],
          pathGroups: [
            { pattern: '@modules/**', group: 'internal', position: 'before' },
            { pattern: '@infra/**', group: 'internal', position: 'before' },
            { pattern: '@lib/**', group: 'internal', position: 'before' },
            { pattern: '@/**', group: 'internal', position: 'before' },
          ],
          alphabetize: { order: 'asc', caseInsensitive: true },
          pathGroupsExcludedImportTypes: ['builtin'],
          'newlines-between': 'always',
        },
      ],
    },
  },

  eslintConfigPrettier,
];
