const { authenticate } = require('@feathersjs/authentication');
const hooks = require('feathers-hooks-common');

exports.before = {
	all: [],
	find: [authenticate('jwt')],
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
