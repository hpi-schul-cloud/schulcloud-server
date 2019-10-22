const { authenticate } = require('@feathersjs/authentication');
const { Forbidden, NotFound } = require('@feathersjs/errors');
const { disallow } = require('feathers-hooks-common');

const logger = require('../../../logger/');
const { injectUserId, mapPayload } = require('../../../hooks');
const lesson = require('../model');
const checkIfCourseGroupLesson = require('./checkIfCourseGroupLesson');
const resolveStorageType = require('../../fileStorage/hooks/resolveStorageType');

const checkForShareToken = (context) => {
	const { shareToken = '', lessonId } = context.data;
	const currentUserId = context.params.account.userId.toString();
	return lesson.findOne({ _id: lessonId })
		.populate('courseId')
		.select('shareToken courseId')
		.lean()
		.exec()
		.then((_lesson) => {
			const course = _lesson.courseId;
			if (
				_lesson.shareToken === shareToken
				|| course.shareToken === shareToken
				|| course.teacherIds.some((t) => t.toString() === currentUserId)
			) {
				return context;
			}
			throw new Forbidden("The entered lesson doesn't belong to you or is not allowed to be shared!");
		})
		.catch((err) => {
			logger.warning(err);
			throw new NotFound('Lesson not found.', err);
		});
};


exports.before = () => ({
	all: [authenticate('jwt')],
	find: [disallow()],
	get: [disallow()],
	create: [
		mapPayload,
		checkIfCourseGroupLesson.bind(this, 'COURSEGROUP_CREATE', 'TOPIC_CREATE', true),
		injectUserId,
		checkForShareToken,
		resolveStorageType,
	],
	update: [disallow()],
	patch: [disallow()],
	remove: [disallow()],
});
