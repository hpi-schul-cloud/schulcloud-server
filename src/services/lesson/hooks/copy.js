const auth = require('@feathersjs/authentication');
const { Forbidden } = require('@feathersjs/errors');
const { disallow } = require('feathers-hooks-common');
const { injectUserId } = require('../../../hooks');
const lesson = require('../model');
const checkIfCourseGroupLesson = require('./checkIfCourseGroupLesson');
const resolveStorageType = require('../../fileStorage/hooks/resolveStorageType');

const checkForShareToken = (context) => {
	const { shareToken, lessonId } = context.data;
	const currentUserId = context.params.account.userId.toString();
	return lesson.findOne({ _id: lessonId })
		.populate('courseId')
		.then((topic) => {
			if (
				(shareToken !== undefined && topic.shareToken === shareToken)
				|| topic.courseId.teacherIds.some(t => t.toString() === currentUserId)
			) {
				return context;
			}
			throw new Forbidden("The entered lesson doesn't belong to you or is not allowed to be shared!");
		});
};


exports.before = () => ({
	all: [auth.hooks.authenticate('jwt')],
	find: [disallow()],
	get: [disallow()],
	create: [
		checkIfCourseGroupLesson.bind(this, 'COURSEGROUP_CREATE', 'TOPIC_CREATE', true),
		injectUserId,
		checkForShareToken,
		resolveStorageType,
	],
	update: [disallow()],
	patch: [disallow()],
	remove: [disallow()],
});
