const { BadRequest } = require('@feathersjs/errors');
const { authenticate } = require('@feathersjs/authentication');
const { ObjectId } = require('../../../helper/compare');
const checkIfCourseGroupLesson = require('./checkIfCourseGroupLesson');

const addLessonToParams = async (context) => {
	const { lessonId } = context.params.route;
	if (!ObjectId.isValid(lessonId)) {
		throw new BadRequest(`Invalid lessonId: "${lessonId}"`);
	}

	const lesson = await context.app.service('lessons').get(lessonId);
	context.params.lesson = lesson;

	return context;
};

const validateData = async (context) => {
	if (!context.data) {
		throw new BadRequest('Data missing');
	}

	['title', 'client', 'url'].forEach((key) => {
		const value = context.data[key];
		if (value === undefined) {
			throw new BadRequest(`Missing required attribute "${key}"`);
		}
		if (typeof value !== 'string') {
			throw new BadRequest(`Expected "${key}" to be a string`);
		}
	});

	return context;
};

module.exports = {
	before: () => ({
		all: [authenticate('jwt')],
		create: [
			validateData,
			addLessonToParams,
			// checks permission for COURSE and TOPIC for creation
			checkIfCourseGroupLesson.bind(
				this,
				'COURSEGROUP_EDIT',
				'TOPIC_EDIT',
				true,
			),
		],
	}),
};
