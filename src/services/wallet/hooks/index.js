const { authenticate } = require('@feathersjs/authentication');
const hooks = require('feathers-hooks-common');

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
