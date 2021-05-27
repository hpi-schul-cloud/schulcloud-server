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
		'arrow-body-style': ['error', 'as-needed'],
	},
	plugins: ['import', 'prettier', 'promise'],
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
			// nest.js server in 'apps/server/**' */ which is excluded from outer rules
			// this section is more less (parserOptions/project path) only what nest.js defines
			files: ['apps/server/**'],
			parser: '@typescript-eslint/parser',
			plugins: ['@typescript-eslint', 'import'],
			extends: [
				'eslint:recommended',
				'plugin:@typescript-eslint/eslint-recommended',
				'plugin:@typescript-eslint/recommended',
				'plugin:prettier/recommended',
				'plugin:promise/recommended',
			],
			parserOptions: {
				project: 'apps/server/tsconfig.lint.json',
				// sourceType: 'module',
			},
			env: {
				node: true,
				es6: true,
			},
			settings: {
				'import/parsers': {
					'@typescript-eslint/parser': ['.ts'],
				},

				'import/resolver': {
					typescript: {
						alwaysTryTypes: true,
						project: ['tsconfig.json', 'apps/server/tsconfig.lint.json'],
					},
				},
			},
			rules: {
				'import/no-unresolved': 'error',
				'import/extensions': ['error', 'always', { ts: 'never' }],
				'import/prefer-default-export': 'off',
				'import/no-extraneous-dependencies': ['error', { devDependencies: ['**/*spec.ts'] }],
				// '@typescript-eslint/interface-name-prefix': 'off',
				// '@typescript-eslint/explicit-function-return-type': 'off',
				// '@typescript-eslint/explicit-module-boundary-types': 'off',
				// '@typescript-eslint/no-explicit-any': 'off',
			},
			overrides: [
				{
					files: ['*.test.ts'],
					env: {
						jest: true,
					},
				},
			],
		},
		{
			// legacy test files js/ts
			files: ['{test,src}/**/*.test.js', '{test,src}/**/*.test.ts'],
			rules: {
				'no-unused-expressions': 'off',
				'global-require': 'warn',
			},
		},
		{
			// legacy typescript
			files: ['{test,src}/**/*.ts'],
			parser: '@typescript-eslint/parser',
			plugins: ['@typescript-eslint'],
			extends: ['plugin:@typescript-eslint/recommended', 'plugin:prettier/recommended'],
		},
	],
};
