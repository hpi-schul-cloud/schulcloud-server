const { authenticate } = require('@feathersjs/authentication').hooks;
const { disallow } = require('feathers-hooks-common');
const { Forbidden } = require('@feathersjs/errors');

const logger = require('../../../logger');

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

const before = {
	all: [authenticate('jwt')],
	find: [disallow()],
	get: [disallow()],
	create: [
		getCourseData,
	],
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
