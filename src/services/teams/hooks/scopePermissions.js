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
		create: [],
		update: [],
		patch: [],
		remove: [],
	},
	after: {
		all: [],
		find: [],
		get: [],
		create: [],
		update: [],
		patch: [],
		remove: [],
	},
	error: {
		all: [],
		find: [],
		get: [],
		create: [],
		update: [],
		patch: [],
		remove: [],
	},
};
