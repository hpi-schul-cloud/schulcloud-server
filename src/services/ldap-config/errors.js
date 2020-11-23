const reqlib = require('app-root-path').require;

const { NotAuthenticated } = reqlib('src/errors');

const errorHandlers = [
	{
		match: (error) => error instanceof NotAuthenticated,
		message: 'Wrong search-user credentials',
	},
	{
		match: (error) => error.errors && error.errors.errno === 'ENOTFOUND',
		message: 'Wrong server URL',
	},
	{
		match: (error) => error.lde_message === 'No Such Object',
		message: 'Wrong search or base path',
	},
	{
		match: (error) => error.message === 'Invalid configuration object',
		message: 'Invalid configuration object',
	},
];

module.exports = errorHandlers;
