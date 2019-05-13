const hooks = require('feathers-hooks-common');
const auth = require('@feathersjs/authentication');

exports.before = {
	all: [],
	find: hooks.disallow('external'),
	get: hooks.disallow('external'),
	create: [auth.hooks.authenticate('jwt')],
	update: hooks.disallow('external'),
	patch: hooks.disallow('external'),
	remove: hooks.disallow('external'),
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
