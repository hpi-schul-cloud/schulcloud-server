const { authenticate } = require('@feathersjs/authentication');
const nanoid = require('nanoid');
const {
	iff, isProvider,
} = require('feathers-hooks-common');
const {
	injectUserId,
	restrictToUsersOwnLessons,
	hasPermission,
	ifNotLocal,
	permitGroupOperation,
	checkCorrectCourseOrTeamId,
	getRestrictPopulatesHook,
	preventPopulate,
} = require('../../../hooks');
const lesson = require('../model');
const checkIfCourseGroupLesson = require('./checkIfCourseGroupLesson');

// add a shareToken to a lesson if course has a shareToken
/**
 * @afterHook
 */
const addShareTokenIfCourseShareable = async (context) => {
	const { courseId, _id } = context.result;
	if (!courseId) {
		return context;
	}
	const course = await context.app.service('courses').get(courseId, {
		query: {
			$select: ['shareToken'],
		},
	});

	if (!course.shareToken) {
		return context;
	}

	return lesson.findByIdAndUpdate(_id, { shareToken: nanoid(12) })
		.then(() => context);
};

const setPosition = async (context) => {
	const { courseId, courseGroupId } = context.data;
	if (courseId || courseGroupId) {
		const query = courseId ? { courseId } : { courseGroupId };
		context.data.position = await lesson.count(query).exec(); // next free position
	}

	return context;
};

const mapUsers = (context) => {
	if (context.data && context.data.contents) {
		context.data.contents = (context.data.contents || []).map((item) => {
			item.user = item.user || context.params.account.userId;
			return item;
		});
	}
	return context;
};

const populateWhitelist = {
	materialIds: [
		'name', 'description', 'date', 'time', 'contents', 'materialIds',
		'courseId', 'courseGroupId', 'teamId', 'hidden', 'shareToken',
		'isCopyFrom', 'position',
	],
};

exports.before = () => ({
	all: [authenticate('jwt'), mapUsers],
	find: [
		hasPermission('TOPIC_VIEW'),
		iff(isProvider('external'), getRestrictPopulatesHook(populateWhitelist)),
		ifNotLocal(restrictToUsersOwnLessons),
	],
	get: [
		hasPermission('TOPIC_VIEW'),
		iff(isProvider('external'), getRestrictPopulatesHook(populateWhitelist)),
		ifNotLocal(restrictToUsersOwnLessons),
	],
	create: [
		checkIfCourseGroupLesson.bind(this, 'COURSEGROUP_CREATE', 'TOPIC_CREATE', true),
		injectUserId,
		checkCorrectCourseOrTeamId,
		setPosition,
		iff(isProvider('external'), preventPopulate),
	],
	update: [
		iff(isProvider('external'), preventPopulate),
		checkIfCourseGroupLesson.bind(this, 'COURSEGROUP_EDIT', 'TOPIC_EDIT', false),
	],
	patch: [
		checkIfCourseGroupLesson.bind(this, 'COURSEGROUP_EDIT', 'TOPIC_EDIT', false),
		permitGroupOperation,
		ifNotLocal(checkCorrectCourseOrTeamId),
		iff(isProvider('external'), preventPopulate),
	],
	remove: [
		checkIfCourseGroupLesson.bind(this, 'COURSEGROUP_CREATE', 'TOPIC_CREATE', false),
		permitGroupOperation,
		iff(isProvider('external'), preventPopulate),
	],
});

exports.after = {
	all: [],
	find: [ifNotLocal(restrictToUsersOwnLessons)],
	get: [ifNotLocal(restrictToUsersOwnLessons)],
	create: [addShareTokenIfCourseShareable],
	update: [],
	patch: [],
	remove: [],
};
