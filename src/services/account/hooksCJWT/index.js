const hooks = require('feathers-hooks-common');
const globalHooks = require('../../../hooks');

exports.before = {
	all: [],
	find: [hooks.disallow()],
	get: [hooks.disallow()],
	create: [globalHooks.authenticateJWT, globalHooks.isSuperHero()],
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
