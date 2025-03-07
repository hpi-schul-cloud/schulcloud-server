module.exports = {
	'import/no-unresolved': [
		'off',
		{
			commonjs: true,
			caseSensitive: true,
			caseSensitiveStrict: false,
		},
	],
	'import/no-extraneous-dependencies': [
		'off',
		{
			devDependencies: [
				'test/**',
				'tests/**',
				'spec/**',
				'**/__tests__/**',
				'**/__mocks__/**',
				'test.{js,jsx}',
				'test.{ts,tsx}',
				'test-*.{js,jsx}',
				'test-*.{ts,tsx}',
				'**/*{.,_}{test,spec}.{js,jsx}',
				'**/*{.,_}{test,spec}.{ts,tsx}',
				'**/jest.config.js',
				'**/jest.config.ts',
				'**/jest.setup.js',
				'**/jest.setup.ts',
				'**/vue.config.js',
				'**/vue.config.ts',
				'**/webpack.config.js',
				'**/webpack.config.ts',
				'**/webpack.config.*.js',
				'**/webpack.config.*.ts',
				'**/rollup.config.js',
				'**/rollup.config.ts',
				'**/rollup.config.*.js',
				'**/rollup.config.*.ts',
				'**/gulpfile.js',
				'**/gulpfile.ts',
				'**/gulpfile.*.js',
				'**/gulpfile.*.ts',
				'**/Gruntfile{,.js}',
				'**/Gruntfile{,.ts}',
				'**/protractor.conf.js',
				'**/protractor.conf.ts',
				'**/protractor.conf.*.js',
				'**/protractor.conf.*.ts',
				'**/karma.conf.js',
				'**/karma.conf.ts',
				'**/.eslintrc.js',
				'**/.eslintrc.ts',
			],
			optionalDependencies: false,
		},
	],
	'class-methods-use-this': [
		'off',
		{
			exceptMethods: {},
			enforceForClassFields: true,
		},
	],
	curly: [0, 'multi-line'],
	'max-len': [
		0,
		100,
		2,
		{
			ignoreUrls: true,
			ignoreComments: false,
			ignoreRegExpLiterals: true,
			ignoreStrings: true,
			ignoreTemplateLiterals: true,
		},
	],
	'no-confusing-arrow': [
		0,
		{
			allowParens: true,
			onlyOneSimpleParam: false,
		},
	],
	'no-mixed-operators': [
		0,
		{
			groups: {},
			allowSamePrecedence: false,
		},
	],
	quotes: [
		0,
		'single',
		{
			avoidEscape: true,
		},
	],
	'@typescript-eslint/quotes': [
		0,
		'single',
		{
			avoidEscape: true,
		},
	],
	'array-bracket-newline': ['off', 'consistent'],
	'array-bracket-spacing': ['off', 'never'],
	'array-element-newline': [
		'off',
		{
			multiline: true,
			minItems: 3,
		},
	],
	'arrow-spacing': [
		'off',
		{
			before: true,
			after: true,
		},
	],
	'block-spacing': ['off', 'always'],
	'brace-style': [
		'off',
		'1tbs',
		{
			allowSingleLine: true,
		},
	],
	'comma-dangle': [
		'off',
		{
			arrays: 'always-multiline',
			objects: 'always-multiline',
			imports: 'always-multiline',
			exports: 'always-multiline',
			functions: 'always-multiline',
		},
	],
	'comma-spacing': [
		'off',
		{
			before: false,
			after: true,
		},
	],
	'comma-style': [
		'off',
		'last',
		{
			exceptions: {
				ArrayExpression: false,
				ArrayPattern: false,
				ArrowFunctionExpression: false,
				CallExpression: false,
				FunctionDeclaration: false,
				FunctionExpression: false,
				ImportDeclaration: false,
				ObjectExpression: false,
				ObjectPattern: false,
				VariableDeclaration: false,
				NewExpression: false,
			},
		},
	],
	'computed-property-spacing': ['off', 'never'],
	'dot-location': ['off', 'property'],
	'eol-last': ['off', 'always'],
	'func-call-spacing': ['off', 'never'],
	'function-call-argument-newline': ['off', 'consistent'],
	'function-paren-newline': ['off', 'multiline-arguments'],
	'generator-star-spacing': [
		'off',
		{
			before: false,
			after: true,
		},
	],
	'implicit-arrow-linebreak': ['off', 'beside'],
	indent: [
		'off',
		2,
		{
			SwitchCase: 1,
			VariableDeclarator: 1,
			outerIIFEBody: 1,
			FunctionDeclaration: {
				parameters: 1,
				body: 1,
			},
			FunctionExpression: {
				parameters: 1,
				body: 1,
			},
			CallExpression: {
				arguments: 1,
			},
			ArrayExpression: 1,
			ObjectExpression: 1,
			ImportDeclaration: 1,
			flatTernaryExpressions: false,
			ignoredNodes: [
				'JSXElement',
				'JSXElement > *',
				'JSXAttribute',
				'JSXIdentifier',
				'JSXNamespacedName',
				'JSXMemberExpression',
				'JSXSpreadAttribute',
				'JSXExpressionContainer',
				'JSXOpeningElement',
				'JSXClosingElement',
				'JSXFragment',
				'JSXOpeningFragment',
				'JSXClosingFragment',
				'JSXText',
				'JSXEmptyExpression',
				'JSXSpreadChild',
			],
			ignoreComments: false,
			offsetTernaryExpressions: false,
		},
	],
	'jsx-quotes': ['off', 'prefer-double'],
	'key-spacing': [
		'off',
		{
			beforeColon: false,
			afterColon: true,
		},
	],
	'keyword-spacing': [
		'off',
		{
			before: true,
			after: true,
			overrides: {
				return: {
					after: true,
				},
				throw: {
					after: true,
				},
				case: {
					after: true,
				},
			},
		},
	],
	'linebreak-style': ['off', 'unix'],
	'max-statements-per-line': [
		'off',
		{
			max: 1,
		},
	],
	'multiline-ternary': ['off', 'never'],
	'newline-per-chained-call': [
		'off',
		{
			ignoreChainWithDepth: 4,
		},
	],
	'no-extra-parens': [
		'off',
		'all',
		{
			conditionalAssign: true,
			nestedBinaryExpressions: false,
			returnAssign: false,
			ignoreJSX: 'all',
			enforceForArrowConditionals: false,
		},
	],
	'no-multi-spaces': [
		'off',
		{
			ignoreEOLComments: false,
		},
	],
	'no-trailing-spaces': [
		'off',
		{
			skipBlankLines: false,
			ignoreComments: false,
		},
	],
	'nonblock-statement-body-position': [
		'off',
		'beside',
		{
			overrides: {},
		},
	],
	'object-curly-newline': [
		'off',
		{
			ObjectExpression: {
				minProperties: 4,
				multiline: true,
				consistent: true,
			},
			ObjectPattern: {
				minProperties: 4,
				multiline: true,
				consistent: true,
			},
			ImportDeclaration: {
				minProperties: 4,
				multiline: true,
				consistent: true,
			},
			ExportDeclaration: {
				minProperties: 4,
				multiline: true,
				consistent: true,
			},
		},
	],
	'object-curly-spacing': ['off', 'always'],
	'object-property-newline': [
		'off',
		{
			allowAllPropertiesOnSameLine: true,
			allowMultiplePropertiesPerLine: false,
		},
	],
	'one-var-declaration-per-line': ['off', 'always'],
	'operator-linebreak': [
		'off',
		'before',
		{
			overrides: {
				'=': 'none',
			},
		},
	],
	'padded-blocks': [
		'off',
		{
			blocks: 'never',
			classes: 'never',
			switches: 'never',
		},
		{
			allowSingleLineBlocks: true,
		},
	],
	'quote-props': [
		'off',
		'as-needed',
		{
			keywords: false,
			unnecessary: true,
			numbers: false,
		},
	],
	'rest-spread-spacing': ['off', 'never'],
	semi: ['off', 'always'],
	'semi-spacing': [
		'off',
		{
			before: false,
			after: true,
		},
	],
	'semi-style': ['off', 'last'],
	'space-before-function-paren': [
		'off',
		{
			anonymous: 'always',
			named: 'never',
			asyncArrow: 'always',
		},
	],
	'space-in-parens': ['off', 'never'],
	'space-unary-ops': [
		'off',
		{
			words: true,
			nonwords: false,
			overrides: {},
		},
	],
	'switch-colon-spacing': [
		'off',
		{
			after: true,
			before: false,
		},
	],
	'template-tag-spacing': ['off', 'never'],
	'unicode-bom': ['off', 'never'],
	'wrap-iife': [
		'off',
		'outside',
		{
			functionPrototypeMethods: false,
		},
	],
	'yield-star-spacing': ['off', 'after'],
	'@typescript-eslint/brace-style': [
		'off',
		'1tbs',
		{
			allowSingleLine: true,
		},
	],
	'@typescript-eslint/comma-dangle': [
		'off',
		{
			arrays: 'always-multiline',
			objects: 'always-multiline',
			imports: 'always-multiline',
			exports: 'always-multiline',
			functions: 'always-multiline',
			enums: 'always-multiline',
			generics: 'always-multiline',
			tuples: 'always-multiline',
		},
	],
	'@typescript-eslint/comma-spacing': [
		'off',
		{
			before: false,
			after: true,
		},
	],
	'@typescript-eslint/func-call-spacing': ['off', 'never'],
	'@typescript-eslint/indent': [
		'off',
		2,
		{
			SwitchCase: 1,
			VariableDeclarator: 1,
			outerIIFEBody: 1,
			FunctionDeclaration: {
				parameters: 1,
				body: 1,
			},
			FunctionExpression: {
				parameters: 1,
				body: 1,
			},
			CallExpression: {
				arguments: 1,
			},
			ArrayExpression: 1,
			ObjectExpression: 1,
			ImportDeclaration: 1,
			flatTernaryExpressions: false,
			ignoredNodes: [
				'JSXElement',
				'JSXElement > *',
				'JSXAttribute',
				'JSXIdentifier',
				'JSXNamespacedName',
				'JSXMemberExpression',
				'JSXSpreadAttribute',
				'JSXExpressionContainer',
				'JSXOpeningElement',
				'JSXClosingElement',
				'JSXFragment',
				'JSXOpeningFragment',
				'JSXClosingFragment',
				'JSXText',
				'JSXEmptyExpression',
				'JSXSpreadChild',
			],
			ignoreComments: false,
			offsetTernaryExpressions: false,
		},
	],
	'@typescript-eslint/keyword-spacing': [
		'off',
		{
			before: true,
			after: true,
			overrides: {
				return: {
					after: true,
				},
				throw: {
					after: true,
				},
				case: {
					after: true,
				},
			},
		},
	],
	'@typescript-eslint/no-extra-parens': [
		'off',
		'all',
		{
			conditionalAssign: true,
			nestedBinaryExpressions: false,
			returnAssign: false,
			ignoreJSX: 'all',
			enforceForArrowConditionals: false,
		},
	],
	'@typescript-eslint/object-curly-spacing': ['off', 'always'],
	'@typescript-eslint/semi': ['off', 'always'],
	'@typescript-eslint/space-before-function-paren': [
		'off',
		{
			anonymous: 'always',
			named: 'never',
			asyncArrow: 'always',
		},
	],
	'getter-return': [
		'off',
		{
			allowImplicit: true,
		},
	],
	'prefer-const': [
		'error',
		{
			destructuring: 'any',
			ignoreReadBeforeAssign: true,
		},
	],
	'valid-typeof': [
		'off',
		{
			requireStringLiterals: true,
		},
	],
	'no-empty-function': [
		'off',
		{
			allow: ['arrowFunctions', 'functions', 'methods'],
		},
	],
	'@typescript-eslint/no-empty-function': [
		'error',
		{
			allow: ['arrowFunctions', 'functions', 'methods'],
		},
	],
	'@typescript-eslint/no-unused-vars': [
		'error',
		{
			vars: 'all',
			args: 'after-used',
			ignoreRestSiblings: true,
		},
	],
	'no-restricted-syntax': [
		'off',
		{
			selector: 'ForInStatement',
			message:
				'for..in loops iterate over the entire prototype chain, which is virtually never what you want. Use Object.{keys,values,entries}, and iterate over the resulting array.',
		},
		{
			selector: 'ForOfStatement',
			message:
				'iterators/generators require regenerator-runtime, which is too heavyweight for this guide to allow them. Separately, loops should be avoided in favor of array iterations.',
		},
		{
			selector: 'LabeledStatement',
			message: 'Labels are a form of GOTO; using them makes code confusing and hard to maintain and understand.',
		},
		{
			selector: 'WithStatement',
			message: '`with` is disallowed in strict mode because it makes code impossible to predict and optimize.',
		},
	],
	'max-classes-per-file': ['off', 1],
};
