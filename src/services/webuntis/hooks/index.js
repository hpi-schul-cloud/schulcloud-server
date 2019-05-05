const { authenticate } = require('feathers-authentication').hooks;

// todo: should later only execute with superhero permissions.
exports.before = {
	all: [authenticate('jwt')],
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
