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
	},
	plugins: ['import', 'prettier', 'promise'],
	env: {
		node: true,
		mocha: true,
		browser: true,
	},
	settings: {
		'import/resolver': {
			node: {
				extensions: ['.js', '.ts'],
			},
		},
	},
	ignorePatterns: [
		// should not be applied on nest apps
		'apps/server/**',
	],
	overrides: [
		{
			// nest.js server in 'apps/server/**' */ which is excluded from outer rules
			files: ['apps/server/**/*.*'],
			parser: '@typescript-eslint/parser',
			parserOptions: {
				project: 'apps/server/tsconfig.app.json',
				sourceType: 'module',
			},
			plugins: ['@typescript-eslint/eslint-plugin'],
			extends: ['plugin:@typescript-eslint/recommended', 'plugin:prettier/recommended'],
			root: true,
			env: {
				node: true,
				jest: true,
			},
			rules: {
				'@typescript-eslint/interface-name-prefix': 'off',
				'@typescript-eslint/explicit-function-return-type': 'off',
				'@typescript-eslint/explicit-module-boundary-types': 'off',
				'@typescript-eslint/no-explicit-any': 'off',
			},
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
			extends: [
				'plugin:@typescript-eslint/recommended', // Uses the recommended rules from the @typescript-eslint/eslint-plugin
				'plugin:import/typescript',
				'plugin:prettier/recommended', // Enables eslint-plugin-prettier and eslint-config-prettier. This will display prettier errors as ESLint errors. Make sure this is always the last configuration in the extends array.
			],
			parserOptions: {
				ecmaVersion: 2020, // Allows for the parsing of modern ECMAScript features
				sourceType: 'module', // Allows for the use of imports
			},
			rules: {
				'import/extensions': ['error', 'never'], // We not want extensions required within of import statements
				'import/prefer-default-export': 'off', // JS can not import default from TS
				'import/no-extraneous-dependencies': ['error', { devDependencies: ['**/*.test.{js,ts}'] }], // We allow dev dependencies to be used in test files only
			},
		},
	],
};
