const { authenticate } = require('@feathersjs/authentication').hooks;
const { disallow } = require('feathers-hooks-common');

const { Configuration } = require('@hpi-schul-cloud/commons');
const { hasPermission } = require('../../../hooks');
const { InternalServerError } = require('../../../errors');

const isNexbordEnabled = () => {
	if (!Configuration.get('NEXBOARD_USER_ID') || !Configuration.get('NEXBOARD_API_KEY')) {
		throw new InternalServerError('nexBoard is not configured');
	}
};

const before = {
	all: [authenticate('jwt'), isNexbordEnabled],
	find: [disallow()],
	get: [disallow()],
	create: [hasPermission('TOOL_CREATE')],
	update: [disallow()],
	patch: [disallow()],
	remove: [disallow()],
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
