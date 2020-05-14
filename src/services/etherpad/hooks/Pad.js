const { authenticate } = require('@feathersjs/authentication').hooks;
const { disallow } = require('feathers-hooks-common');
const { Forbidden } = require('@feathersjs/errors');

const logger = require('../../../logger');

const { hasPermission } = require('../../../hooks');

const getGroupData = async (context) => {
	const groupService = context.app.service('etherpad/groups').create(context.data);
	try {
		const response = JSON.parse(await groupService);
		context.data = {
			...context.data,
			groupID: response.data.groupID,
		};
		return context;
	} catch (err) {
		logger.error('Failed to get course data: ', err);
		throw new Forbidden('Failed to get course data');
	}
};

const before = {
	all: [authenticate('jwt')],
	find: [disallow()],
	get: [disallow()],
	create: [
		hasPermission('TOOL_CREATE'),
		getGroupData,
	],
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
