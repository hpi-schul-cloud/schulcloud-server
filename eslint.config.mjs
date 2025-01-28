import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import typescriptEslintEslintPlugin from '@typescript-eslint/eslint-plugin';
import typescriptEslintParser from '@typescript-eslint/parser';
import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginFilenameRules from 'eslint-plugin-filename-rules';
import eslintPluginImport from 'eslint-plugin-import';
import eslintPluginJest from 'eslint-plugin-jest';
import eslintPluginNoOnlyTests from 'eslint-plugin-no-only-tests';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
	baseDirectory: __dirname,
	recommendedConfig: js.configs.recommended,
	allConfig: js.configs.all,
});

export default [
	{
		ignores: ['backup/setup/*.json', 'migrations/helpers/*.json', 'dist', '.gitignore'],
	},
	...compat.extends('plugin:promise/recommended'),
	eslintPluginImport.flatConfigs.recommended,
	eslintConfigPrettier,
	eslintPluginPrettierRecommended,
	eslintPluginFilenameRules,
	{
		plugins: {
			'@typescript-eslint': typescriptEslintEslintPlugin,
			// 'filename-rules': eslintPluginFilenameRules,
			'no-only-tests': eslintPluginNoOnlyTests,
		},

		languageOptions: {
			globals: {
				...globals.node,
				...globals.mocha,
			},

			parser: typescriptEslintParser,
			ecmaVersion: 5,
			sourceType: 'module',

			parserOptions: {
				project: 'tsconfig.json',
				tsconfigRootDir: '.',
			},
		},

		rules: {
			'prettier/prettier': ['error'],
			'no-process-env': 'error',
			'no-multiple-empty-lines': [
				'error',
				{
					max: 2,
					maxBOF: 0,
					maxEOF: 0,
				},
			],
			'no-tabs': 'off',
			'no-restricted-syntax': 'off',
			'class-methods-use-this': 'off',
			'no-underscore-dangle': [
				'error',
				{
					allow: ['_id', '_v', '__v'],
				},
			],
			'no-shadow': [
				'error',
				{
					allow: ['err', 'error'],
				},
			],
			'prefer-destructuring': [
				'warn',
				{
					object: true,
					array: false,
				},
			],
			'no-param-reassign': [
				'warn',
				{
					props: false,
				},
			],
			'@typescript-eslint/no-unused-vars': [
				'warn',
				{
					args: 'after-used',
					argsIgnorePattern: 'app|req|res|next|options|params|^_',
				},
			],
			'arrow-parens': ['error', 'always'],
			'arrow-body-style': ['error', 'as-needed', { requireReturnForObjectLiteral: true }],
			'no-only-tests/no-only-tests': 'error',
			'max-classes-per-file': 'off',
		},
		settings: {
			'import/resolver': {
				typescript: {
					project: './',
				},
			},
			'import/parsers': {
				'@typescript-eslint/parser': ['.ts', '.tsx'],
			},
		},
	},
	{
		files: ['apps/**/*.ts'],
		languageOptions: {
			globals: {
				...globals.node,
				...globals.jest,
			},

			parser: typescriptEslintParser,
			ecmaVersion: 5,
			sourceType: 'module',

			parserOptions: {
				project: 'apps/server/tsconfig.lint.json',
				sourceType: 'module',
			},
		},
		rules: {
			'import/no-unresolved': 'off', // better handled by ts resolver
			'import/no-extraneous-dependencies': 'off', // better handled by ts resolver
			'import/prefer-default-export': 'off',
			'no-void': ['error', { allowAsStatement: true }],
			'class-methods-use-this': 'off',
			'no-param-reassign': 'off',
			'no-underscore-dangle': 'off',
			'filename-rules/match': ['error', 'kebabcase'],
			'require-await': 'warn',
			'@typescript-eslint/unbound-method': 'error',
			'@typescript-eslint/no-non-null-assertion': 'warn',
			'@typescript-eslint/explicit-function-return-type': 'warn',
			'@typescript-eslint/explicit-member-accessibility': [
				'warn',
				{
					accessibility: 'explicit',
					overrides: {
						accessors: 'no-public',
						constructors: 'no-public',
						methods: 'explicit',
						properties: 'explicit',
						parameterProperties: 'explicit',
					},
				},
			],
			'@typescript-eslint/no-unused-vars': 'error',
			'@typescript-eslint/no-empty-interface': [
				'error',
				{
					allowSingleExtends: true,
				},
			],
		},
	},
	{
		files: ['**/*spec.ts'],
		plugins: {
			jest: eslintPluginJest,
		},
		rules: {
			// you should turn the original rule off *only* for test files
			'@typescript-eslint/unbound-method': 'off',
			'jest/prefer-spy-on': 'warn',
			'jest/unbound-method': 'error',
			'@typescript-eslint/explicit-function-return-type': 'off',
			'@typescript-eslint/explicit-member-accessibility': 'off',
		},
	},
	{
		files: ['apps/server/src/migrations/**/*.ts'],
		rules: {
			'@typescript-eslint/no-restricted-imports': [
				'warn',
				{
					patterns: [
						{
							group: ['**/apps/**', '@infra/**', '@shared/**', '**/migrations/**'],
							message: 'apps/server/src/migrations may NOT import from apps, @infra, @shared, or migrations',
						},
					],
				},
			],
			// 'filename-rules/match': ['warn', 'PascalCase'],
			'no-console': 'off',
		},
	},
	{
		files: ['apps/server/src/apps/**/*.ts'],
		rules: {
			'@typescript-eslint/no-restricted-imports': [
				'warn',
				{
					patterns: [
						{
							group: ['**/apps/**', '@infra/**', '@shared/**', '**/migrations/**'],
							message: 'apps-modules may NOT import from apps, @infra, @shared, or migrations',
						},
						{
							group: ['@infra/*/*', '@modules/*/*', '!@modules/*/testing', '!*.module'],
							message: 'Do not deep import from a module',
						},
					],
				},
			],
		},
	},
	{
		files: ['apps/server/src/core/**/*.ts'],
		rules: {
			'@typescript-eslint/no-restricted-imports': [
				'warn',
				{
					patterns: [
						{
							group: ['**/apps/**', '@core/**', '@infra/**', '@modules/**'],
							message: 'core-modules may NOT import from apps, @core, @infra, or @modules',
						},
						{
							group: ['@infra/*/*', '@modules/*/*', '!@modules/*/testing', '!*.module'],
							message: 'Do not deep import from a module',
						},
					],
				},
			],
		},
	},

	{
		files: ['apps/server/src/infra/**/*.ts'],
		rules: {
			'@typescript-eslint/no-restricted-imports': [
				'warn',
				{
					patterns: [
						{
							group: ['**/apps/**', '@core/**', '@modules/**', '**/migrations/**'],
							message: 'infra-modules may NOT import from apps, @core, @modules, or migrations',
						},
						{
							group: ['@infra/*/*', '@modules/*/*', '!@modules/*/testing', '!*.module'],
							message: 'Do not deep import from a module',
						},
					],
				},
			],
		},
	},
	{
		files: ['apps/server/src/modules/**/*.ts'],
		rules: {
			'@typescript-eslint/no-restricted-imports': [
				'warn',
				{
					patterns: [
						{
							group: ['**/apps/**'],
							message: 'modules-modules may NOT import from apps',
						},
						{
							group: ['@infra/*/*', '@modules/*/*', '!@modules/*/testing', '!*.module'],
							message: 'Do not deep import from a module',
						},
					],
				},
			],
		},
	},
	{
		files: ['apps/server/src/shared/**/*.ts'],
		rules: {
			'@typescript-eslint/no-restricted-imports': [
				'warn',
				{
					patterns: [
						{
							group: ['**/apps/**', '@core/**', '@infra/**', '@modules/**', '@shared/**', '**/migrations/**'],
							message: 'shared modules may NOT import from apps, @core, @infra, @modules, @shared, or migrations',
						},
						{
							group: ['@infra/*/*', '@modules/*/*', '!@modules/*/testing', '!*.module'],
							message: 'Do not deep import from a module',
						},
					],
				},
			],
		},
	},
	{
		files: ['apps/server/src/testing/**/*.ts'],
		rules: {
			'@typescript-eslint/no-restricted-imports': [
				'error',
				{
					patterns: [
						{
							group: ['@modules/*', '!@modules/account'],
							message: 'testing may NOT import from @modules',
						},
					],
				},
			],
		},
	},
	{
		files: ['apps/server/src/**/*.entity.ts'],
		rules: {
			'@typescript-eslint/explicit-member-accessibility': [
				'warn',
				{
					accessibility: 'explicit',
					overrides: {
						accessors: 'no-public',
						constructors: 'no-public',
						methods: 'explicit',
						properties: 'no-public',
						parameterProperties: 'explicit',
					},
				},
			],
		},
	},
	{
		files: [
			'apps/server/src/**/*.repo.ts',
			'apps/server/src/**/*.service.ts',
			'apps/server/src/**/*.controller.ts',
			'apps/server/src/**/*.uc.ts',
		],
		rules: {
			'max-classes-per-file': ['warn', 1],
		},
	},
];
