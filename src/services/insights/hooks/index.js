// const globalHooks = require('../../../hooks');
// const auth = require('@feathersjs/authentication');
const { disallow } = require('feathers-hooks-common');

// filter for demo user
// todo write function here

exports.before = {
	all: [
		// auth.hooks.authenticate('jwt'),
	],
	find: [],
	get: [disallow('external')],
	create: [disallow('external')],
	update: [disallow('external')],
	patch: [disallow('external')],
	remove: [disallow('external')],
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
