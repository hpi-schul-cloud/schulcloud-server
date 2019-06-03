

const commonHooks = require('feathers-hooks-common');
const auth = require('feathers-authentication');
const globalHooks = require('../../../hooks');

exports.before = {
	all: [],
	find: commonHooks.disable('external'),
	get: commonHooks.disable('external'),
	create: [auth.hooks.authenticate('jwt')],
	update: commonHooks.disable('external'),
	patch: commonHooks.disable('external'),
	remove: commonHooks.disable('external'),
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
