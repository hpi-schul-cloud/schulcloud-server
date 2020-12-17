const { authenticate } = require('@feathersjs/authentication').hooks;
const { disallow } = require('feathers-hooks-common');
const reqlib = require('app-root-path').require;

const { Forbidden } = reqlib('src/errors');

const logger = require('../../../logger');
const globalHooks = require('../../../hooks');

const getCourseData = async (context) => {
	const courseService = context.app.service('/courses').get(context.data.courseId);
	try {
		context.data = await courseService;
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
		globalHooks.hasPermission('COURSE_VIEW'),
		globalHooks.injectUserId,
		injectCourseId,
		globalHooks.restrictToUsersOwnCourses,
		getCourseData,
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
