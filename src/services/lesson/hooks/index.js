const auth = require('@feathersjs/authentication');
const nanoid = require('nanoid');
const {
	injectUserId,
	restrictToUsersOwnLessons,
	hasPermission,
	ifNotLocal,
	permitGroupOperation,
	checkCorrectCourseOrTeamId,
} = require('../../../hooks');
const lesson = require('../model');
const checkIfCourseGroupLesson = require('./checkIfCourseGroupLesson');

// add a shareToken to a lesson if course has a shareToken
const checkIfCourseShareable = (hook) => {
	if (hook.result.courseId && hook.result.courseId !== 'undefined') {
		const { courseId } = hook.result;
		const courseService = hook.app.service('courses');

		return courseService.get(courseId)
			.then((course) => {
				if (!course.shareToken) return hook;

				return lesson.findByIdAndUpdate(hook.result._id, { shareToken: nanoid(12) })
					.then(() => hook);
			});
	}
	return hook;
};

const setPosition = async (context) => {
	const { courseId, courseGroupId } = context.data;
	if (courseId || courseGroupId) {
		const lessons = await context.app.service('lessons').find({
			query: {
				courseId,
				$select: '_id',
			},
		});
		context.data.position = lessons.total; // next free position
	}

	return context;
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
		hasPermission('TOPIC_VIEW'),
		ifNotLocal(restrictToUsersOwnLessons),
	],
	get: [
		hasPermission('TOPIC_VIEW'),
		ifNotLocal(restrictToUsersOwnLessons),
	],
	create: [
		checkIfCourseGroupLesson.bind(this, 'COURSEGROUP_CREATE', 'TOPIC_CREATE', true),
		injectUserId,
		checkCorrectCourseOrTeamId,
		setPosition,
	],
	update: [
		checkIfCourseGroupLesson.bind(this, 'COURSEGROUP_EDIT', 'TOPIC_EDIT', false),
	],
	patch: [
		checkIfCourseGroupLesson.bind(this, 'COURSEGROUP_EDIT', 'TOPIC_EDIT', false),
		permitGroupOperation,
		checkCorrectCourseOrTeamId,
	],
	remove: [
		checkIfCourseGroupLesson.bind(this, 'COURSEGROUP_CREATE', 'TOPIC_CREATE', false),
		permitGroupOperation,
	],
});

exports.after = {
	all: [],
	find: [ifNotLocal(restrictToUsersOwnLessons)],
	get: [ifNotLocal(restrictToUsersOwnLessons)],
	create: [checkIfCourseShareable],
	update: [],
	patch: [],
	remove: [],
};
