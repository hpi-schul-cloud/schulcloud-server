const reqlib = require('app-root-path').require;

const { NotAuthenticated } = reqlib('src/errors');

const errorHandlers = [
	{
		match: (error) => error instanceof NotAuthenticated,
		code: 'WRONG_CREDENTIALS',
		message: 'Wrong search-user credentials',
	},
	{
		match: (error) => error.errors && error.errors.errno === 'ENOTFOUND',
		code: 'WRONG_URL',
		message: 'Wrong server URL',
	},
	{
		match: (error) => error.lde_message === 'No Such Object',
		code: 'WRONG_SEARCH_PATH',
		message: 'Wrong search or base path',
	},
	{
		match: (error) => error.message === 'Invalid configuration object',
		code: 'INVALID_CONFIGURATION_OBJECT',
		message: 'Invalid configuration object',
	},
];

module.exports = errorHandlers;
