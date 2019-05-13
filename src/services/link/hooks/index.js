const hooks = require('feathers-hooks-common');
const globalHooks = require('../../../hooks');

exports.before = {
	all: [],
	find: [],
	get: [hooks.disallow('external')],	// handled by redirection middleware
	create: [globalHooks.authenticateJWT, globalHooks.hasPermission('LINK_CREATE')],
	update: [hooks.disallow()],
	patch: [hooks.disallow()],
	remove: [globalHooks.ifNotLocal(hooks.disallow())],
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
