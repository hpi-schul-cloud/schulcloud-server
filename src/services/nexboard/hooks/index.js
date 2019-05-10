const { authenticate } = require('@feathersjs/authentication').hooks;

const before = {
	all: [
		authenticate('jwt'),
	],
	find: [],
	get: [],
	create: [],
	update: [],
	patch: [],
	remove: [],
};

const after = {
	all: [],
	find: [],
	get: [],
	create: [],
	update: [],
	patch: [],
	remove: [],
};

module.exports = {
	before,
	after,
};
