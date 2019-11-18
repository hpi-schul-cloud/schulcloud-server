const auth = require('@feathersjs/authentication');
const { disallow } = require('feathers-hooks-common');
const globalHooks = require('../../../hooks');
const { getCookie } = require('./getCookie');

/* all: [auth.hooks.authenticate('jwt'), lookupSchool],
	find: [globalHooks.hasPermission('INSIGHTS_VIEW')], */

// disallow all entry
exports.before = {
	all: [getCookie],
	find: [],
	get: [disallow()],
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
