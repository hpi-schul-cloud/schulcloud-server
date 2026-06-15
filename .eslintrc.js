const airbnbRules = require('./.eslint-rules-airbnb.js');

module.exports = {
	extends: ['prettier', 'plugin:promise/recommended'],
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
		'no-unused-vars': [
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
	plugins: ['import-x', 'prettier', 'promise', 'no-only-tests'],
	env: {
		node: true,
		mocha: true,
		es6: true,
	},
	parserOptions: {
		ecmaVersion: 2018,
	},
	settings: {
		'import/resolver': {
			node: {
				extensions: ['.js', '.ts'],
			},
		},
	},
	overrides: [
		{
			files: ['apps/server/src/**/*.ts'],
			env: {
				node: true,
				es6: true,
			},
			parser: '@typescript-eslint/parser',
			parserOptions: {
				project: 'apps/server/tsconfig.lint.json',
				sourceType: 'module',
				ecmaVersion: 2018,
				ecmaFeatures: {
					generators: false,
					objectLiteralDuplicateProperties: false,
				},
			},
			plugins: ['@typescript-eslint/eslint-plugin', 'import-x'],
			extends: [
				'plugin:@typescript-eslint/recommended',
				'plugin:@typescript-eslint/recommended-requiring-type-checking',
				'prettier',
				'plugin:promise/recommended',
				'plugin:import-x/typescript',
			],
			rules: {
				...airbnbRules,
				'import-x/prefer-default-export': 'off',
				'no-void': ['error', { allowAsStatement: true }],
				'no-param-reassign': 'off',
				'no-underscore-dangle': 'off',
				'require-await': 'warn',
				'@typescript-eslint/unbound-method': 'error',
				'@typescript-eslint/no-non-null-assertion': 'warn',
				'@typescript-eslint/no-unused-vars': [
					'warn',
					{
						args: 'after-used',
						argsIgnorePattern: '^_',
					},
				],
				'@typescript-eslint/explicit-function-return-type': 'warn',
				'@typescript-eslint/explicit-member-accessibility': 'off',
				'@typescript-eslint/no-empty-interface': [
					'error',
					{
						allowSingleExtends: true,
					},
				],
				'no-restricted-imports': 'off',
			},
			overrides: [
				{
					files: ['**/*spec.ts'],
					plugins: ['jest'],
					env: {
						jest: true,
					},
					rules: {
						// you should turn the original rule off *only* for test files
						'@typescript-eslint/unbound-method': 'off',
						'@typescript-eslint/no-unnecessary-type-assertion': 'off',
						'@typescript-eslint/no-unsafe-assignment': 'off',
						'jest/prefer-spy-on': 'warn',
						'jest/unbound-method': 'error',
						'@typescript-eslint/explicit-function-return-type': 'off',
						'@typescript-eslint/explicit-member-accessibility': 'off',
						'@typescript-eslint/no-explicit-any': 'warn',
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
									{
										group: ['@infra/*'],
										message: 'testing may NOT import from @infra',
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
			],
		},
	],
};
