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
	},
	plugins: ['import', 'prettier', 'promise', 'no-only-tests'],
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
			parser: '@typescript-eslint/parser',
			plugins: ['@typescript-eslint/eslint-plugin'],
			extends: [
				'airbnb-typescript/base',
				'plugin:@typescript-eslint/recommended',
				'plugin:@typescript-eslint/recommended-requiring-type-checking',
				'prettier',
				'plugin:promise/recommended',
			],
			parserOptions: {
				project: 'apps/server/tsconfig.lint.json',
			},
			env: {
				node: true,
				es6: true,
			},
			rules: {
				'import/no-unresolved': 'off', // better handled by ts resolver
				'import/no-extraneous-dependencies': 'off', // better handles by ts resolver
				'import/prefer-default-export': 'off',
				'no-void': ['error', { allowAsStatement: true }],
				'max-classes-per-file': 'off',
				'class-methods-use-this': 'off',
				'no-param-reassign': 'off',
				'no-underscore-dangle': 'off',
				'@typescript-eslint/unbound-method': 'error',
				'@typescript-eslint/no-unused-vars': 'error',
				'@typescript-eslint/no-empty-interface': [
					'error',
					{
						allowSingleExtends: true,
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
						'jest/unbound-method': 'error',
					},
				},
			],
		},
	],
};
