const { disallow } = require('feathers-hooks-common');


/* all: [auth.hooks.authenticate('jwt'), lookupSchool],
	find: [globalHooks.hasPermission('INSIGHTS_VIEW')], */

// disallow all entry
exports.before = {
	all: [],
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
