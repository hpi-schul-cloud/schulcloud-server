const hooks = require('feathers-hooks-common');
const { authenticate } = require('@feathersjs/authentication');
const globalHooks = require('../../../hooks');

exports.before = {
	all: [authenticate('jwt')],
	find: [globalHooks.hasPermission('RELEASES_VIEW')],
	get: [globalHooks.hasPermission('RELEASES_VIEW')],
	create: [globalHooks.hasPermission('RELEASES_CREATE')],
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
