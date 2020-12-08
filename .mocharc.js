module.exports = {
	// This file applies defaults for mocha https://mochajs.org/#configuring-mocha-nodejs
	// List of available options https://mochajs.org/#command-line-usage
	diff: true,
	extension: ['js', 'ts'],
	recursive: true,
	package: './package.json',
	slow: 75,
	timeout: 20000000,
	'watch-files': ['test/*', 'src/*', 'config/*'],
	spec: ['./{,!(node_modules)/**/}*.test.js', './{,!(node_modules)/**/}*.test.ts'], // ts files needs to be added too
};
