module.exports = {
	extends: ['airbnb-base', 'prettier'],
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
	plugins: ['import', 'prettier'],
	env: {
		node: true,
		mocha: true,
		browser: true,
	},
	overrides: [
		{
			files: ['*.test.js'],
			rules: {
				'no-unused-expressions': 'off',
				'global-require': 'warn',
			},
		},
	],
};
