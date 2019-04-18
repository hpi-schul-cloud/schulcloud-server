const auth = require('@feathersjs/authentication');
const globalHooks = require('../../../hooks');


exports.before = {
	all: [
		auth.hooks.authenticate('jwt'),
	],
	find: [],
	get: [],
	create: [],
	update: [],
	patch: [globalHooks.permitGroupOperation],
	remove: [globalHooks.permitGroupOperation],
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
