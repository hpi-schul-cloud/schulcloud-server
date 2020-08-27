const { authenticate } = require('@feathersjs/authentication');
const { BadRequest, NotFound } = require('@feathersjs/errors');
const nanoid = require('nanoid');
const {
	iff, isProvider,
} = require('feathers-hooks-common');
const { equal } = require('../../../helper/compare').ObjectId;
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
const lessonModel = require('../model');
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

	return lessonModel.findByIdAndUpdate(_id, { shareToken: nanoid(12) })
		.then(() => context);
};

const setPosition = async (context) => {
	const { courseId, courseGroupId } = context.data;
	if (courseId || courseGroupId) {
		const query = courseId ? { courseId } : { courseGroupId };
		context.data.position = await lessonModel.count(query).exec(); // next free position
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

/* const validateLessonFind = (context) => {
	const query = (context.params || {}).query || {};
	if (query.courseId || query.courseGroupId || query.shareToken) {
		return context;
	}
	throw new BadRequest('this operation requires courseId, courseGroupId, or shareToken');
}; */

const getCourseAndCourseGroup = async (lessonId, app) => {
	const lesson = await app.service('lessons').get(lessonId);
	let { courseId } = lesson;
	let courseGroup;
	if (lesson.courseGroupId) {
		courseGroup = await app.service('courseGroupModel').get(lesson.courseGroupId);
		({ courseId } = courseGroup);
	}
	const course = await app.service('courseModel').get(courseId);
	return { course, courseGroup };
};

const restrictToUsersCoursesLessons = async (context) => {
	const { userId } = context.params.account;
	const { course, courseGroup } = await getCourseAndCourseGroup(context.id, context.app);

	let studentsWithAccess = course.userIds;
	if (courseGroup) studentsWithAccess = courseGroup.userIds;

	const userInCourse = studentsWithAccess.some((id) => equal(id, userId))
		|| course.teacherIds.some((id) => equal(id, userId))
		|| course.substitutionIds.some((id) => equal(id, userId));
	if (!userInCourse) throw new NotFound(`no record found for id '${context.id}'`);
};

const populateWhitelist = {
	materialIds: [
		'_id', 'originId', 'title', 'client', 'url', 'license', 'description',
		'contentType', 'lastModified', 'language', 'subjects', 'targetGroups',
		'target', 'tags', 'relatedResources', 'popularity', 'thumbnailUrl',
		'editorsPick', 'createdAt',
	],
};

exports.before = () => ({
	all: [authenticate('jwt'), mapUsers],
	find: [
		hasPermission('TOPIC_VIEW'),
		iff(isProvider('external'), validateLessonFind),
		iff(isProvider('external'), getRestrictPopulatesHook(populateWhitelist)),
		ifNotLocal(restrictToUsersOwnLessons),
	],
	get: [
		hasPermission('TOPIC_VIEW'),
		iff(isProvider('external'), getRestrictPopulatesHook(populateWhitelist)),
		iff(isProvider('external'), restrictToUsersCoursesLessons),
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
		permitGroupOperation,
		ifNotLocal(checkCorrectCourseOrTeamId),
		iff(isProvider('external'), restrictToUsersCoursesLessons),
		checkIfCourseGroupLesson.bind(this, 'COURSEGROUP_EDIT', 'TOPIC_EDIT', false),
	],
	patch: [
		checkIfCourseGroupLesson.bind(this, 'COURSEGROUP_EDIT', 'TOPIC_EDIT', false),
		permitGroupOperation,
		ifNotLocal(checkCorrectCourseOrTeamId),
		iff(isProvider('external'), restrictToUsersCoursesLessons),
		iff(isProvider('external'), preventPopulate),
	],
	remove: [
		checkIfCourseGroupLesson.bind(this, 'COURSEGROUP_CREATE', 'TOPIC_CREATE', false),
		permitGroupOperation,
		iff(isProvider('external'), restrictToUsersCoursesLessons),
		iff(isProvider('external'), preventPopulate),
	],
});

exports.after = {
	all: [],
	find: [ifNotLocal(restrictToUsersOwnLessons)],
	get: [],
	create: [addShareTokenIfCourseShareable],
	update: [],
	patch: [],
	remove: [],
};
