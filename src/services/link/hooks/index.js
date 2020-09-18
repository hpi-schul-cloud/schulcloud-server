const hooks = require('feathers-hooks-common');
const { authenticate } = require('@feathersjs/authentication');
const globalHooks = require('../../../hooks');

exports.before = {
	all: [],
	find: [],
	get: [hooks.disallow('external')], // handled by redirection middleware
	create: [authenticate('jwt'), globalHooks.hasPermission('LINK_CREATE'), globalHooks.blockDisposableEmail('toHash')],
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
