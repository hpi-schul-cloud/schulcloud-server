module.exports = {
	extends: ['airbnb-base', 'prettier', 'plugin:promise/recommended'],
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
		'max-classes-per-file': ['warn', 1],
	},
	plugins: ['import', 'prettier', 'promise', 'no-only-tests', 'filename-rules'],
	env: {
		node: true,
		mocha: true,
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
			files: ['apps/**/*.ts'],
			env: {
				node: true,
				es6: true,
			},
			parser: '@typescript-eslint/parser',
			parserOptions: {
				project: 'apps/server/tsconfig.lint.json',
				sourceType: 'module',
			},
			plugins: ['@typescript-eslint/eslint-plugin', 'import'],
			extends: [
				'airbnb-typescript/base',
				'plugin:@typescript-eslint/recommended',
				'plugin:@typescript-eslint/recommended-requiring-type-checking',
				'prettier',
				'plugin:promise/recommended',
				'plugin:import/typescript',
			],
			rules: {
				'import/no-unresolved': 'off', // better handled by ts resolver
				'import/no-extraneous-dependencies': 'off', // better handles by ts resolver
				'import/prefer-default-export': 'off',
				'no-void': ['error', { allowAsStatement: true }],
				'class-methods-use-this': 'off',
				'no-param-reassign': 'off',
				'no-underscore-dangle': 'off',
				'filename-rules/match': [1, 'kebabcase'],
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
				'@typescript-eslint/no-restricted-imports': [
					'warn',
					{
						patterns: [
							{
								group: ['@src/apps/**', '@src/core/**', '@src/modules/*/*', '@src/shared/**'],
								message: 'Remove src/ from import path',
							},
							{
								group: ['@infra/*/*', '@modules/*/*', '!@modules/*/testing', '!*.module'],
								message: 'Do not deep import from a module',
							},
						],
					},
				],
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
						'jest/prefer-spy-on': 'warn',
						'jest/unbound-method': 'error',
						'@typescript-eslint/explicit-function-return-type': 'off',
						'max-classes-per-file': 'off',
						'@typescript-eslint/explicit-member-accessibility': 'off',
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
										group: ['@apps/**', '@infra/**', '@modules/**/*.ts', '@shared/**', '!@modules/**/*.app.module.ts'],
										message: 'apps-modules may NOT import from @apps, @infra, @modules or @shared',
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
										group: ['@apps/**', '@core/**', '@infra/**', '@modules/**'],
										message: 'core-modules may NOT import from @apps, @core, @infra or @modules',
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
										group: ['@apps/**', '@core/**', '@modules/**'],
										message: 'infra-modules may NOT import from @apps, @core or @modules',
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
										group: ['@apps/**'],
										message: 'modules-modules may NOT import from @apps',
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
										group: ['@apps/**', '@core/**', '@infra/**', '@modules/**', '@shared/**'],
										message: 'shared modules may NOT import from @apps, @core, @infra, @modules or @shared',
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
			],
		},
	],
};
