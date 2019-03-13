const auth = require('feathers-authentication');

exports.before = {
	all: [
		auth.hooks.authenticate('jwt'),
	],
	find: [],
	get: [],
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
