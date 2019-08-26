const auth = require('@feathersjs/authentication');
const { disallow } = require('feathers-hooks-common');
const { hasPermission } = require('../../../hooks');

exports.before = {
	all: [auth.hooks.authenticate('jwt')],
	find: [hasPermission('USERGROUP_CREATE')],
	get: [hasPermission('USERGROUP_CREATE')],
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
