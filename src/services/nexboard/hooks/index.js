const { authenticate } = require('feathers-authentication').hooks;

const before = {
	all: [
		(context) => {
			console.log('HEADERS', context.params.headers)
			return context
		},
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
