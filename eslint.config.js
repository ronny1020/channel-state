import globals from 'globals'
import pluginJs from '@eslint/js'
import tseslint from 'typescript-eslint'
import pluginPrettier from 'eslint-plugin-prettier'
import configPrettier from 'eslint-config-prettier'
import pluginVue from 'eslint-plugin-vue'
import vueParser from 'vue-eslint-parser'
import pluginSvelte from 'eslint-plugin-svelte'
import svelteParser from 'svelte-eslint-parser'

export default [
  {
    ignores: ['**/dist/**', '**/node_modules/**', '**/coverage/**'],
  },
  pluginJs.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      prettier: pluginPrettier,
    },
    rules: {
      'prettier/prettier': 'error',
      'require-jsdoc': 'off',
      'valid-jsdoc': 'off',
      'no-console': ['error', { allow: ['warn', 'error', 'log'] }],
    },
  },
  ...tseslint.configs.recommended.map((config) => ({
    ...config,
    files: [
      'packages/**/src/**/*.{ts,tsx}',
      'examples/**/src/**/*.{ts,tsx}',
      'packages/**/vitest.config.ts',
      'examples/**/vite.config.ts',
      'scripts/**/*.ts',
    ],
  })),
  ...tseslint.configs.strictTypeChecked.map((config) => ({
    ...config,
    files: [
      'packages/**/src/**/*.{ts,tsx}',
      'examples/**/src/**/*.{ts,tsx}',
      'packages/**/vitest.config.ts',
      'examples/**/vite.config.ts',
      'scripts/**/*.ts',
    ],
    languageOptions: {
      ...config.languageOptions,
      parserOptions: {
        ...config.languageOptions?.parserOptions,
        project: [
          './tsconfig.base.json',
          './packages/*/tsconfig.json',
          './examples/*/tsconfig.json',
          './scripts/tsconfig.json',
        ],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  })),
  ...tseslint.configs.stylisticTypeChecked.map((config) => ({
    ...config,
    files: [
      'packages/**/src/**/*.{ts,tsx}',
      'examples/**/src/**/*.{ts,tsx}',
      'packages/**/vitest.config.ts',
      'examples/**/vite.config.ts',
      'scripts/**/*.ts',
    ],
    languageOptions: {
      ...config.languageOptions,
      parserOptions: {
        ...config.languageOptions?.parserOptions,
        project: [
          './tsconfig.base.json',
          './packages/*/tsconfig.json',
          './examples/*/tsconfig.json',
          './scripts/tsconfig.json',
        ],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  })),
  {
    files: [
      'packages/**/src/**/*.{ts,tsx}',
      'examples/**/src/**/*.{ts,tsx}',
      'packages/**/vitest.config.ts',
      'examples/**/vite.config.ts',
      'scripts/**/*.ts',
    ],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  ...pluginVue.configs['flat/recommended'],
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser,
        project: [
          './tsconfig.base.json',
          './packages/*/tsconfig.json',
          './examples/*/tsconfig.json',
        ],
        tsconfigRootDir: import.meta.dirname,
        extraFileExtensions: ['.vue'],
      },
    },
  },
  ...pluginSvelte.configs['flat/recommended'],
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parser: svelteParser,
      parserOptions: {
        parser: tseslint.parser,
        project: [
          './tsconfig.base.json',
          './packages/*/tsconfig.json',
          './examples/*/tsconfig.json',
        ],
        tsconfigRootDir: import.meta.dirname,
        extraFileExtensions: ['.svelte'],
      },
    },
  },
  {
    files: ['packages/**/src/**/*.{js,jsx}', 'examples/**/src/**/*.{js,jsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    files: ['**/*.cjs'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
  },
  configPrettier,
]
