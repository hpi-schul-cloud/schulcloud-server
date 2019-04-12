const hooks = require('feathers-hooks-common');
const auth = require('@feathersjs/authentication');
const globalHooks = require('../../../hooks');

exports.before = {
	all: [auth.hooks.authenticate('jwt'), globalHooks.isSuperHero()],
	find: [],
	get: [],
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
	remove: []
};
