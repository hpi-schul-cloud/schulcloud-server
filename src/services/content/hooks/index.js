const globalHooks = require('../../../hooks');


exports.before = {
	all: [
		globalHooks.authenticateJWT,
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
