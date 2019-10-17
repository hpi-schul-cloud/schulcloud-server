const auth = require('@feathersjs/authentication');
const { disallow } = require('feathers-hooks-common');
const globalHooks = require('../../../hooks');

exports.before = {
	all: [
		// auth.hooks.authenticate('jwt'),
	],
	find: [/* globalHooks.hasPermission('INSIGHTS_VIEW') */],
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
