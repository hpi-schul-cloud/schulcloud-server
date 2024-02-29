const { authenticate } = require('@feathersjs/authentication');
const { iff, isProvider } = require('feathers-hooks-common');

const { NotFound, BadRequest } = require('../../../errors');
const { ObjectId } = require('../../../helper/compare');
const checkIfCourseGroupLesson = require('./checkIfCourseGroupLesson');
const { equal } = require('../../../helper/compare').ObjectId;

const addLessonToParams = async (context) => {
	const { lessonId } = context.params.route;
	if (!ObjectId.isValid(lessonId)) {
		throw new BadRequest(`Invalid lessonId: "${lessonId}"`);
	}
	// @deprecated - use nest endpoint instead to get lesson
	const lesson = await context.app.service('lessons').get(lessonId);
	context.params.lesson = lesson;

	return context;
};

const getCourseFromLesson = async (lesson, app) => {
	let { courseId } = lesson;
	if (lesson.courseGroupId) {
		({ courseId } = await app.service('courseGroupModel').get(lesson.courseGroupId));
	}
	return app.service('courseModel').get(courseId);
};

const restrictToUsersCoursesLessons = async (context) => {
	const { userId } = context.params.account;
	const course = await getCourseFromLesson(context.params.lesson, context.app);

	const userInCourse =
		course.userIds.some((id) => equal(id, userId)) ||
		course.teacherIds.some((id) => equal(id, userId)) ||
		course.substitutionIds.some((id) => equal(id, userId));
	if (!userInCourse) throw new NotFound(`no record found for id '${context.params.route.lessonId}'`);
};

const validateRecord = (record) => {
	['title', 'client', 'url'].forEach((key) => {
		const value = record[key];
		if (value === undefined) {
			throw new BadRequest(`Missing required attribute "${key}"`);
		}
		if (typeof value !== 'string') {
			throw new BadRequest(`Expected "${key}" to be a string`);
		}
	});
};

const validateData = async (context) => {
	if (!context.data) {
		throw new BadRequest('Data missing');
	}

	if (Array.isArray(context.data)) {
		context.data.forEach((record) => validateRecord(record));
	} else {
		validateRecord(context.data);
	}

	return context;
};

module.exports = {
	before: () => {
		return {
			all: [authenticate('jwt')],
			create: [
				validateData,
				addLessonToParams,
				iff(isProvider('external'), restrictToUsersCoursesLessons),
				// checks permission for COURSE and TOPIC for creation
				checkIfCourseGroupLesson.bind(this, 'COURSEGROUP_EDIT', 'TOPIC_EDIT', true),
			],
		};
	},
};
