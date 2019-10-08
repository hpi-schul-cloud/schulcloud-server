const { authenticate } = require('@feathersjs/authentication');
const hooks = require('feathers-hooks-common');

// todo check userId
exports.before = {
	all: [authenticate('jwt')],
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
	remove: [],
};
