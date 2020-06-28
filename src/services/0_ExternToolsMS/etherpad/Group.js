const { authenticate } = require('@feathersjs/authentication').hooks;
const { disallow } = require('feathers-hooks-common');
const { Forbidden } = require('@feathersjs/errors');

const logger = require('../../../logger');
const { hasPermission, restrictToUsersOwnCourses, injectUserId } = require('../hooks');
const EtherpadClient = require('../logic/EtherpadClient');

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

const GroupHooks = {
	before: {
		all: [authenticate('jwt')],
		find: [disallow()],
		get: [disallow()],
		create: [
			hasPermission('COURSE_VIEW'),
			injectUserId,
			injectCourseId,
			restrictToUsersOwnCourses,
			getCourseData,
		],
		update: [disallow()],
		patch: [disallow()],
		remove: [disallow()],
	},
	after: {
		all: [],
		find: [],
		get: [],
		create: [],
		update: [],
		patch: [],
		remove: [],
	},
};

class Group {
	constructor(options) {
		this.options = options || {};
		this.docs = {};
	}

	create(params) {
		return EtherpadClient.createOrGetGroup({
			name: params.name,
			groupMapper: params.id,
		});
	}

	setup(app) {
		this.app = app;
	}
}

module.exports = {
	Group,
	GroupHooks,
	getCourseData,
	injectCourseId,
};
