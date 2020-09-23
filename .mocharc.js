module.exports = {
	// This file applies defaults for mocha https://mochajs.org/#configuring-mocha-nodejs
	// List of available options https://mochajs.org/#command-line-usage
	diff: true,
	extension: ['js', 'ts'],
	recursive: true,
	package: './package.json',
	slow: 75,
	require: ['ts-node/register', 'tsconfig-paths/register', 'source-map-support/register'],
	timeout: 2000,
	'watch-files': ['test/*', 'src/*', 'build/*', 'config/*'],
	spec: ['test/**/*.test.js'], // ts files needs to be added too
};
