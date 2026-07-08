const { authenticate } = require('@feathersjs/authentication');
const { disallow } = require('feathers-hooks-common');
const { hasPermission } = require('../../../hooks');

exports.before = {
	all: [authenticate('jwt')],
	find: [hasPermission('CLASS_CREATE')],
	get: [hasPermission('CLASS_CREATE')],
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
