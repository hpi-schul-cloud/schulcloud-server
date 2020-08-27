const { authenticate } = require('@feathersjs/authentication');
const { BadRequest, NotFound } = require('@feathersjs/errors');
const nanoid = require('nanoid');
const {
	iff, isProvider,
} = require('feathers-hooks-common');
const { equal } = require('../../../helper/compare').ObjectId;
const {
	hasRoleNoHook,
	injectUserId,
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

const validateLessonFind = (context) => {
	const query = (context.params || {}).query || {};
	if (query.courseId || query.courseGroupId || query.shareToken) {
		return context;
	}
	throw new BadRequest('this operation requires courseId, courseGroupId, or shareToken');
};

const getCourseAndCourseGroup = async (courseId, courseGroupId, app) => {
	let tempCourseId = courseId;
	let courseGroup;
	if (courseGroupId) {
		courseGroup = await app.service('courseGroupModel').get(courseGroupId);
		tempCourseId = courseGroup.courseId;
	}
	const course = await app.service('courseModel').get(tempCourseId);
	return { course, courseGroup };
};

const restrictToUsersCoursesLessons = async (context) => {
	const { userId, schoolId } = context.params.account;
	const userIsSuperhero = await hasRoleNoHook(context, userId, 'superhero');
	const userIsAdmin = await hasRoleNoHook(context, userId, 'administrator');

	let courseId;
	let courseGroupId;
	if (context.method === 'find') {
		if (context.params.query.shareToken) return context;
		({ courseId, courseGroupId } = context.params.query);
	} else {
		const lesson = await context.app.service('lessons').get(context.id);
		({ courseId, courseGroupId } = lesson);
	}

	const { course, courseGroup } = await getCourseAndCourseGroup(courseId, courseGroupId, context.app);
	let studentsWithAccess = course.userIds;
	if (courseGroup) studentsWithAccess = courseGroup.userIds;

	const hasAdminAccess = userIsSuperhero || (userIsAdmin && equal(course.schoolId, schoolId));
	const userInCourse = studentsWithAccess.some((id) => equal(id, userId))
		|| course.teacherIds.some((id) => equal(id, userId))
		|| course.substitutionIds.some((id) => equal(id, userId));

	if (!(userInCourse || hasAdminAccess)) {
		throw new NotFound(`no record found for id '${context.id || courseGroupId || courseId}'`);
	}
	return context;
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
		iff(isProvider('external'), restrictToUsersCoursesLessons),
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
	find: [],
	get: [],
	create: [addShareTokenIfCourseShareable],
	update: [],
	patch: [],
	remove: [],
};
