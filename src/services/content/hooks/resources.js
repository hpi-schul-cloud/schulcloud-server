const { authenticate } = require('@feathersjs/authentication');
const { disallow } = require('feathers-hooks-common');

exports.before = {
	all: [authenticate('jwt')],
	find: [],
	get: [],
	create: [disallow()],
	update: [disallow()],
	patch: [disallow()],
	remove: [disallow()],
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
