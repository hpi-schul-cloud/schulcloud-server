const hooks = require('feathers-hooks-common');

const globalHooks = require('../../../hooks');

exports.before = {
	all: [],
	find: hooks.disallow('external'),
	get: hooks.disallow('external'),
	create: [globalHooks.authenticateJWT],
	update: hooks.disallow('external'),
	patch: hooks.disallow('external'),
	remove: hooks.disallow('external'),
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
