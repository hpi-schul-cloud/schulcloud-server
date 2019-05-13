const hooks = require('feathers-hooks-common');
const globalHooks = require('../../../hooks');

exports.before = {
	all: [],
	find: [globalHooks.authenticateJWT],
	get: [hooks.disallow()],
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
