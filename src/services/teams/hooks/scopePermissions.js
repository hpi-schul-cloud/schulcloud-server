const auth = require('@feathersjs/authentication');
const logger = require('winston');
const {
	Forbidden, BadRequest, Conflict, NotImplemented, NotFound, MethodNotAllowed, NotAcceptable,
} = require('@feathersjs/errors');
const globalHooks = require('../../../hooks');

module.exports = {
	before: {
		all: [],
		find: [],
		get: [],
	},
	after: {
		all: [],
		find: [],
		get: [],
	},
	error: {
		all: [],
		find: [],
		get: [],
	},
};
