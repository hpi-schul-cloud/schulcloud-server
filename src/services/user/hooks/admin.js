
const { authenticate } = require('feathers-authentication').hooks;
// is admin
// restricted to current school

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
