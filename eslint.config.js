// @ts-check
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');
const importX = require('eslint-plugin-import-x');
const promisePlugin = require('eslint-plugin-promise');
const prettierPlugin = require('eslint-plugin-prettier');
const prettierConfig = require('eslint-config-prettier');
const jestPlugin = require('eslint-plugin-jest');
const noOnlyTests = require('eslint-plugin-no-only-tests');
const checkFile = require('eslint-plugin-check-file');
const globals = require('globals');

const airbnbRules = {
	'prefer-const': ['error', { destructuring: 'any', ignoreReadBeforeAssign: true }],
	'@typescript-eslint/no-empty-function': ['error', { allow: ['arrowFunctions', 'functions', 'methods'] }],
};

const globalIgnores = {
	ignores: [
		'src/**',
		'config/**',
		'scripts/**',
		'test/**',
		'backup/setup/*.json',
		'migrations/helpers/*.json',
		'dist/**',
		'build/**',
		'docs/**',
		'coverage/**',
		'node_modules/**',
		'.nyc_output/**',
		'lib/**',
		'data/**',
		'backup/**',
		'!backup/setup/**',
		'!backup/idm/**',
		'apps/server/src/modules/board/loadtest/**/*.html',
		'apps/server/src/modules/board/loadtest/artilleryreport.json',
		'*.loadtest.json',
	],
};

const baseConfig = {
	name: 'schulcloud/base',
	plugins: {
		'import-x': importX,
		prettier: prettierPlugin,
		promise: promisePlugin,
		'no-only-tests': noOnlyTests,
	},
	languageOptions: {
		ecmaVersion: 2018,
		globals: {
			...globals.node,
			...globals.mocha,
			...globals.es2015,
		},
	},
	rules: {
		// prettier
		...prettierConfig.rules,
		...promisePlugin.configs.recommended.rules,
		'prettier/prettier': ['error'],
		// general
		'no-process-env': 'error',
		'no-multiple-empty-lines': ['error', { max: 2, maxBOF: 0, maxEOF: 0 }],
		'no-tabs': 'off',
		'no-restricted-syntax': 'off',
		'class-methods-use-this': 'off',
		'no-underscore-dangle': ['error', { allow: ['_id', '_v', '__v'] }],
		'prefer-destructuring': ['error', { object: true, array: false }],
		'no-param-reassign': ['warn', { props: false }],
		'no-unused-vars': ['error', { args: 'after-used', argsIgnorePattern: 'app|req|res|next|options|params|^_' }],
		'arrow-parens': ['error', 'always'],
		'arrow-body-style': ['error', 'as-needed', { requireReturnForObjectLiteral: true }],
		'no-only-tests/no-only-tests': 'error',
		'max-classes-per-file': 'off',
	},
	settings: {
		'import-x/resolver': {
			node: { extensions: ['.js', '.ts'] },
		},
	},
};

const tsBase = {
	name: 'schulcloud/typescript',
	files: ['apps/server/src/**/*.ts'],
	plugins: {
		'@typescript-eslint': tsPlugin,
		'import-x': importX,
		prettier: prettierPlugin,
		promise: promisePlugin,
		'check-file': checkFile,
	},
	languageOptions: {
		parser: tsParser,
		parserOptions: {
			project: 'apps/server/tsconfig.lint.json',
			sourceType: 'module',
			ecmaVersion: 2018,
			ecmaFeatures: { generators: false, objectLiteralDuplicateProperties: false },
		},
		globals: {
			...globals.node,
			...globals.es2015,
		},
	},
	rules: {
		...airbnbRules,
		...prettierConfig.rules,
		...promisePlugin.configs.recommended.rules,
		...tsPlugin.configs['recommended-requiring-type-checking'].rules,
		...importX.configs['flat/typescript'].rules,
		'prettier/prettier': ['error'],
		'import-x/prefer-default-export': 'off',
		'no-void': ['error', { allowAsStatement: true }],
		'no-param-reassign': 'off',
		'no-underscore-dangle': 'off',
		'require-await': 'error',
		'@typescript-eslint/unbound-method': 'error',
		'@typescript-eslint/no-non-null-assertion': 'warn',
		'@typescript-eslint/no-unused-vars': ['error', { args: 'after-used', argsIgnorePattern: '^_' }],
		'@typescript-eslint/explicit-function-return-type': 'error',
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
		'@typescript-eslint/no-empty-interface': ['error', { allowSingleExtends: true }],
		'check-file/filename-naming-convention': ['warn', { '**/*.ts': 'KEBAB_CASE' }, { ignoreMiddleExtensions: true }],
		'no-restricted-imports': 'off',
		'no-only-tests/no-only-tests': 'error',
		'max-classes-per-file': 'off',
		'@typescript-eslint/consistent-type-imports': ['error', { 'prefer': 'type-imports', 'fixStyle': 'inline-type-imports' }]
	},
	settings: {
		'import-x/resolver': {
			node: { extensions: ['.js', '.ts'] },
		},
	},
};

// test specific rules, more lenient
const tsSpecs = {
	name: 'schulcloud/typescript-specs',
	files: ['apps/server/src/**/*spec.ts'],
	plugins: {
		'@typescript-eslint': tsPlugin,
		jest: jestPlugin,
	},
	languageOptions: {
		parser: tsParser,
		parserOptions: {
			project: 'apps/server/tsconfig.lint.json',
		},
		globals: { ...globals.jest },
	},
	rules: {
		'@typescript-eslint/unbound-method': 'off',
		'@typescript-eslint/no-unnecessary-type-assertion': 'off',
		'@typescript-eslint/no-unsafe-assignment': 'off',
		'jest/prefer-spy-on': 'warn',
		'jest/unbound-method': 'error',
		'@typescript-eslint/explicit-function-return-type': 'off',
		'@typescript-eslint/explicit-member-accessibility': 'off',
		'@typescript-eslint/no-explicit-any': 'error',
	},
};

const deepImportWarning = {
	group: ['@infra/*/*', '@modules/*/*', '!@modules/*/testing', '!*.module'],
	message: 'Do not deep import from a module',
};

const layerRestrictions = [
	{
		name: 'schulcloud/layer-migrations',
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
			'check-file/filename-naming-convention': ['warn', { '**/*.ts': 'PASCAL_CASE' }, { ignoreMiddleExtensions: true }],
			'no-console': 'off',
		},
	},
	{
		name: 'schulcloud/layer-apps',
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
						deepImportWarning,
					],
				},
			],
		},
	},
	{
		name: 'schulcloud/layer-core',
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
						deepImportWarning,
					],
				},
			],
		},
	},
	{
		name: 'schulcloud/layer-infra',
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
						deepImportWarning,
					],
				},
			],
		},
	},
	{
		name: 'schulcloud/layer-modules',
		files: ['apps/server/src/modules/**/*.ts'],
		rules: {
			'@typescript-eslint/no-restricted-imports': [
				'warn',
				{
					patterns: [{ group: ['**/apps/**'], message: 'modules-modules may NOT import from apps' }, deepImportWarning],
				},
			],
		},
	},
	{
		name: 'schulcloud/layer-shared',
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
						deepImportWarning,
					],
				},
			],
		},
	},
	{
		name: 'schulcloud/layer-testing',
		files: ['apps/server/src/testing/**/*.ts'],
		rules: {
			'@typescript-eslint/no-restricted-imports': [
				'error',
				{
					patterns: [
						{ group: ['@modules/*', '!@modules/account'], message: 'testing may NOT import from @modules' },
						{ group: ['@infra/*'], message: 'testing may NOT import from @infra' },
					],
				},
			],
		},
	},
];

const entityFiles = {
	name: 'schulcloud/entities',
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
};

const singleClassFiles = {
	name: 'schulcloud/single-class',
	files: [
		'apps/server/src/**/*.repo.ts',
		'apps/server/src/**/*.service.ts',
		'apps/server/src/**/*.controller.ts',
		'apps/server/src/**/*.uc.ts',
	],
	rules: {
		'max-classes-per-file': ['error', 1],
	},
};

module.exports = [globalIgnores, baseConfig, tsBase, tsSpecs, ...layerRestrictions, entityFiles, singleClassFiles];
