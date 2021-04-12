const { authenticate } = require('@feathersjs/authentication').hooks;
const { disallow } = require('feathers-hooks-common');

const { hasPermission } = require('../../../hooks');

const before = {
	all: [authenticate('jwt')],
	find: [hasPermission('TOOL_VIEW')],
	get: [hasPermission('TOOL_VIEW')],
	create: [hasPermission('TOOL_CREATE')],
	update: [disallow()],
	patch: [disallow()],
	remove: [disallow()], // TODO: is added later
};

const after = {
	all: [],
	find: [],
	get: [],
	create: [],
	update: [],
	patch: [],
	remove: [],
};

module.exports = {
	before,
	after,
};
