const fs = require('fs');
const path = require('path');
const { FlatCompat } = require('@eslint/eslintrc');

const compat = new FlatCompat({
	baseDirectory: __dirname,
	resolvePluginsRelativeTo: __dirname,
});

const legacyConfig = require('./.eslintrc.js');
const eslintIgnorePath = path.join(__dirname, '.eslintignore');

const ignorePatterns = fs.existsSync(eslintIgnorePath)
	? fs
			.readFileSync(eslintIgnorePath, 'utf8')
			.split(/\r?\n/u)
			.map((line) => line.trim())
			.filter((line) => line && !line.startsWith('#'))
	: [];

module.exports = [
	{
		ignores: ignorePatterns,
	},
	...compat.config(legacyConfig),
];
