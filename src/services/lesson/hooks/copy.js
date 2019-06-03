

const hooks = require('feathers-hooks');
const auth = require('feathers-authentication');
const errors = require('feathers-errors');
const lesson = require('../model');
const globalHooks = require('../../../hooks');

const checkIfCourseGroupLesson = (permission1, permission2, isCreating, hook) => {
	// find courseGroupId in different ways (POST, FIND ...)
	const groupPromise = isCreating ? Promise.resolve({ courseGroupId: hook.data.courseGroupId }) : lesson.findOne({ _id: hook.id }).then(lesson => (JSON.stringify(lesson.courseGroupId) ? globalHooks.hasPermission(permission1)(hook) : globalHooks.hasPermission(permission2)(hook)));
};

const checkForShareToken = (hook) => {
	const { shareToken, lessonId } = hook.data;

	return lesson.findOne({ _id: lessonId }).populate('courseId')
		.then((topic) => {
			if ((topic.shareToken == shareToken && shareToken != undefined) || topic.courseId.teacherIds.filter(t => t.toString() == hook.params.account.userId).length > 0) return hook;
			throw new errors.Forbidden("The entered lesson doesn't belong to you or is not allowed to be shared!");
		});
};

exports.before = {
	all: [auth.hooks.authenticate('jwt')],
	find: [hooks.disable()],
	get: [hooks.disable()],
	create: [checkIfCourseGroupLesson.bind(this, 'COURSEGROUP_CREATE', 'TOPIC_CREATE', true), globalHooks.injectUserId, checkForShareToken],
	update: [hooks.disable()],
	patch: [hooks.disable()],
	remove: [hooks.disable()],
};
