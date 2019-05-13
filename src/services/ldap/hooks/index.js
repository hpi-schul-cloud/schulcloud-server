const globalHooks = require('../../../hooks');

const restrictToCurrentSchool = globalHooks.ifNotLocal(globalHooks.restrictToCurrentSchool);

exports.before = {
	all: [],
	find: [globalHooks.authenticateJWT, restrictToCurrentSchool, globalHooks.hasPermission('SYSTEM_EDIT')],
	get: [globalHooks.authenticateJWT, restrictToCurrentSchool, globalHooks.hasPermission('SYSTEM_EDIT')],
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
