const service = require('feathers-mongoose');
const auth = require('@feathersjs/authentication');
const hooks = require('feathers-hooks-common');
const { serviceModel } = require('../model');
const { customHook } = require('../hooks');

const globalHooks = require('../../../hooks');

/**
 * the datasources service manages the datasources collection.
 */
const simpleService = service({
	Model: serviceModel,
	paginate: {
		default: 25,
		max: 100,
	},
});

const simpleServiceHooks = {
	before: {
		all: [
			auth.hooks.authenticate('jwt'),
		],
		find: [customHook],
		get: [hooks.iff(hooks.isProvider('external'), hooks.keep('name'))],
		create: [],
		update: [hooks.disallow()],
		patch: [hooks.iff(hooks.isProvider('external'), hooks.keep('name'))],
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
};

module.exports = { simpleService, simpleServiceHooks };
