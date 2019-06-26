const hooks = require('feathers-hooks-common');
const auth = require('@feathersjs/authentication');
const globalHooks = require('../../../hooks');

exports.before = {
	all: [auth.hooks.authenticate('jwt')],
	find: [hooks.disallow()],
	get: [hooks.disallow()],
	create: [hooks.disallow()],
	update: [hooks.disallow()],
	patch: [
		globalHooks.restrictToCurrentSchool,
	],
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
