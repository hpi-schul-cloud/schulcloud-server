const { permitGroupOperation } = require('../../../hooks');
const globalHooks = require('../../../hooks');

exports.before = {
	all: [],
	find: [],
	get: [],
	create: [globalHooks.authenticateJWT, globalHooks.hasPermission('SYSTEM_CREATE')],
	update: [globalHooks.authenticateJWT, globalHooks.hasPermission('SYSTEM_EDIT')],
	patch: [globalHooks.authenticateJWT, globalHooks.hasPermission('SYSTEM_EDIT'), permitGroupOperation],
	remove: [globalHooks.authenticateJWT, globalHooks.hasPermission('SYSTEM_CREATE'), permitGroupOperation],
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
