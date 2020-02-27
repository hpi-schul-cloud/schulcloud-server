const hooks = require('feathers-hooks-common');
const { authenticate } = require('@feathersjs/authentication');
const globalHooks = require('../../../hooks');
const { PERMISSIONS } = require('../logic/constants');

exports.before = {
	all: [
		authenticate('jwt'),
		globalHooks.lookupSchool,
	],
	find: [],
	get: [globalHooks.hasPermission(PERMISSIONS.VIEW_GLOBAL_STATS)],
	create: [hooks.disallow()],
	update: [hooks.disallow()],
	patch: [hooks.disallow()],
	remove: [hooks.disallow()],
};

exports.after = {
	all: [],
	find: [],
	get: [],
	create: [],
	update: [],
	patch: [],
	remove: [],
};
