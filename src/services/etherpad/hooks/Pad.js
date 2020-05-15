const { authenticate } = require('@feathersjs/authentication').hooks;
const { disallow } = require('feathers-hooks-common');
const { Forbidden } = require('@feathersjs/errors');

const logger = require('../../../logger');
const globalHooks = require('../../../hooks');

const restrictToUsersOwnCourses = globalHooks.restrictToUsersOwnCourses;

const getGroupData = async (context) => {
	context.data = {
		...context.data,
		userId: context.params.account.userId
	}
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

const injectCourseId = async (context) => {
	context.id = context.data.courseId;
	return context;
};

const before = {
	all: [authenticate('jwt')],
	find: [disallow()],
	get: [disallow()],
	create: [
		globalHooks.hasPermission('TOOL_CREATE'),
		injectCourseId,
		restrictToUsersOwnCourses,
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
