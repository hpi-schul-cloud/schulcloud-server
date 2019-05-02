const auth = require('@feathersjs/authentication');
const globalHooks = require('../../../hooks');

// todo check userId
exports.before = {
	all: [auth.hooks.authenticate('jwt')],
	find: [
		// globalHooks.ifNotLocal(),
	],
	get: [auth.hooks.authenticate('jwt')],
	create: [],
	update: [],
	patch: [],
	remove: [],
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
