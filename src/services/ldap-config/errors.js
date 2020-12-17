const reqlib = require('app-root-path').require;
const LDAPConnectionError = require('../ldap/LDAPConnectionError');

const { NotAuthenticated } = reqlib('src/errors');

const errorHandlers = [
	{
		match: (error) => error instanceof NotAuthenticated,
		type: 'WRONG_CREDENTIALS',
		message: () => 'Wrong search-user credentials',
	},
	{
		match: (error) => error instanceof LDAPConnectionError,
		type: 'CONNECTION_ERROR',
		message: (error) => `${error.data.code}: ${error.data.message}`,
	},
	{
		match: (error) => error.lde_message === 'No Such Object' || error.lde_message === 'invalid DN',
		type: 'WRONG_SEARCH_PATH',
		message: () => 'Wrong search or base path',
	},
	{
		match: (error) => error.message === 'Invalid configuration object',
		type: 'INVALID_CONFIGURATION_OBJECT',
		message: () => 'Invalid configuration object',
	},
];

module.exports = errorHandlers;
