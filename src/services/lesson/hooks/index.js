const auth = require('@feathersjs/authentication');
const nanoid = require('nanoid');
const globalHooks = require('../../../hooks');
const lesson = require('../model');

const checkIfCourseGroupLesson = (permission1, permission2, isCreating, hook) => {
	// find courseGroupId in different ways (POST, FIND ...)
	const groupPromise = isCreating ? Promise.resolve({ courseGroupId: hook.data.courseGroupId }) : lesson.findOne({ _id: hook.id }).then(lesson => (JSON.stringify(lesson.courseGroupId) ? globalHooks.hasPermission(permission1)(hook) : globalHooks.hasPermission(permission2)(hook)));
};

// add a shareToken to a lesson if course has a shareToken
const checkIfCourseShareable = (hook) => {
	if (hook.result.courseId && hook.result.courseId !== 'undefined') {
		const { courseId } = hook.result;
		const courseService = hook.app.service('courses');
		const lessonsService = hook.app.service('lessons');

		return courseService.get(courseId)
			.then((course) => {
				if (!course.shareToken) return hook;

				return lesson.findByIdAndUpdate(hook.result._id, { shareToken: nanoid(12) })
					.then(lesson => hook);
			});
	}
	return hook;

	/* MERGE MASTER N/21 - comment is master. CHeck if side effects for course groups occur
	if ('courseGroupId' in hook.result) return hook;
	const courseId = hook.result.courseId;
	const courseService = hook.app.service('courses');
	const lessonsService = hook.app.service('lessons');

	return courseService.get(courseId)
		.then((course) => {
			if (!course.shareToken) return hook;

			return lesson.findByIdAndUpdate(hook.result._id, { shareToken: nanoid(12) })
				.then(lesson => hook);
		}); */
};

exports.before = () => ({
	all: [auth.hooks.authenticate('jwt'), (hook) => {
		if (hook.data && hook.data.contents) {
			hook.data.contents = (hook.data.contents || []).map((item) => {
				item.user = item.user || hook.params.account.userId;
				return item;
			});
		}
		return hook;
	}],
	find: [
		globalHooks.hasPermission('TOPIC_VIEW'),
		globalHooks.ifNotLocal(globalHooks.restrictToUsersOwnLessons),
	],
	get: [
		globalHooks.hasPermission('TOPIC_VIEW'),
		globalHooks.ifNotLocal(globalHooks.restrictToUsersOwnLessons),
	],
	create: [
		checkIfCourseGroupLesson.bind(this, 'COURSEGROUP_CREATE', 'TOPIC_CREATE', true),
		globalHooks.injectUserId,
		globalHooks.checkCorrectCourseOrTeamId],
	update: [
		checkIfCourseGroupLesson.bind(this, 'COURSEGROUP_EDIT', 'TOPIC_EDIT', false),
	],
	patch: [
		checkIfCourseGroupLesson.bind(this, 'COURSEGROUP_EDIT', 'TOPIC_EDIT', false),
		globalHooks.permitGroupOperation,
		globalHooks.checkCorrectCourseOrTeamId,
	],
	remove: [
		checkIfCourseGroupLesson.bind(this, 'COURSEGROUP_CREATE', 'TOPIC_CREATE', false),
		globalHooks.permitGroupOperation,
	],
});

exports.after = {
	all: [],
	find: [globalHooks.ifNotLocal(globalHooks.restrictToUsersOwnLessons)],
	get: [globalHooks.ifNotLocal(globalHooks.restrictToUsersOwnLessons)],
	create: [checkIfCourseShareable],
	update: [],
	patch: [],
	remove: [],
};
