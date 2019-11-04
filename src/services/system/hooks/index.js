const { authenticate } = require('@feathersjs/authentication');
const { permitGroupOperation } = require('../../../hooks');
const globalHooks = require('../../../hooks');

exports.before = {
	all: [],
	find: [],
	get: [],
	create: [authenticate('jwt'), globalHooks.hasPermission('SYSTEM_CREATE')],
	update: [authenticate('jwt'), globalHooks.hasPermission('SYSTEM_EDIT')],
	patch: [authenticate('jwt'), globalHooks.hasPermission('SYSTEM_EDIT'), permitGroupOperation],
	remove: [authenticate('jwt'), globalHooks.hasPermission('SYSTEM_CREATE'), permitGroupOperation],
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
