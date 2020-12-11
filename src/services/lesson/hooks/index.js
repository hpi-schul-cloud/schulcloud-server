const { authenticate } = require('@feathersjs/authentication');
const reqlib = require('app-root-path').require;
const { Configuration } = require('@hpi-schul-cloud/commons');

const { NotFound, BadRequest } = reqlib('src/errors');
const nanoid = require('nanoid');
const { iff, isProvider } = require('feathers-hooks-common');
const { equal } = require('../../../helper/compare').ObjectId;
const {
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

	return lessonModel.findByIdAndUpdate(_id, { shareToken: nanoid(12) }).then(() => context);
};

// Generate a new url for material that have merlin as source.
// The url expires after 2 hours
const convertMerlinUrl = async (context) => {
	const hasSchool =
		context.params &&
		context.params.authentication &&
		context.params.authentication.payload &&
		context.params.authentication.payload.schoolId;
	if (Configuration.get('FEATURE_ES_MERLIN_ENABLED') === false || !hasSchool) {
		return context;
	}

	// Converts urls to valid merlin urls on the fly
	// This if snippet only applies if the user went to the course first and added content from the course
	if (context.result && context.result.contents && context.result.contents.length) {
		await Promise.all(
			context.result.contents.map(async (content) => {
				if (content && content.content && content.content.resources && content.content.resources.length) {
					await Promise.all(
						content.content.resources.map(async (resource) => {
							if (resource && resource.merlinReference) {
								context.params.query.merlinReference = resource.merlinReference;
								resource.url = await context.app.service('edu-sharing/merlinToken').find(context.params);
							}
						})
					);
				}
			})
		);
	}

	// Converts url to a valid merlin url if a merlin reference is stored in in the material
	if (
		context.result &&
		context.result.materialIds &&
		context.result.materialIds.some((material) => material.merlinReference)
	) {
		const { materialIds } = context.result;
		await Promise.all(
			materialIds.map(async (material) => {
				if (material.merlinReference) {
					context.params.query.merlinReference = material.merlinReference;
					material.url = await context.app.service('edu-sharing/merlinToken').find(context.params);
				}
			})
		);
	}
	return context;
};

const attachMerlinReferenceToLesson = (context) => {
	if (Configuration.get('FEATURE_ES_MERLIN_ENABLED') === false) {
		return context;
	}
	if (context.data && context.data.contents && context.data.contents.length) {
		context.data.contents.forEach((c) => {
			if (c.content && c.content.resources && c.content.resources.length) {
				c.content.resources.forEach((resource) => {
					const merlinUrl = new URL(resource.url);
					if (
						`${merlinUrl.protocol}//${merlinUrl.hostname}${merlinUrl.pathname}` ===
							Configuration.get('ES_MERLIN_AUTH_URL') &&
						merlinUrl.searchParams.get('identifier').length
					) {
						resource.merlinReference = merlinUrl.searchParams.get('identifier');
					}
				});
			}
		});
	}

	return context;
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

/**
 * this hook checks that the user has access to a lesson. this is true for the following cases:
 * 1. read access if the user has a correct shareToken.
 * 2. students can access lessons in their courses that dont have a coursegroup, and lessons of their coursegroups.
 * 3. teachers can access all lessons in their courses.
 * 4. administrators can access all lessons on courses of their school. (this might change in the future)
 * for FIND requests, the course or coursegroup can be found in the query, for other requests in the lesson itself.
 * @param {*} context feathers context
 */
const restrictToUsersCoursesLessons = async (context) => {
	const { userId, schoolId } = context.params.account;
	const user = await context.app.service('users').get(context.params.account.userId, { query: { $populate: 'roles' } });
	const userIsSuperhero = user.roles.filter((u) => u.name === 'superhero').length > 0;
	const userIsAdmin = user.roles.filter((u) => u.name === 'administrator').length > 0;

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
	const userInCourse =
		studentsWithAccess.some((id) => equal(id, userId)) ||
		course.teacherIds.some((id) => equal(id, userId)) ||
		course.substitutionIds.some((id) => equal(id, userId));

	if (!(userInCourse || hasAdminAccess)) {
		throw new NotFound(`no record found for id '${context.id || courseGroupId || courseId}'`);
	}
	return context;
};

const populateWhitelist = {
	materialIds: [
		'_id',
		'originId',
		'title',
		'client',
		'url',
		'merlinReference',
		'license',
		'description',
		'contentType',
		'lastModified',
		'language',
		'subjects',
		'targetGroups',
		'target',
		'tags',
		'relatedResources',
		'popularity',
		'thumbnailUrl',
		'editorsPick',
		'createdAt',
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
		attachMerlinReferenceToLesson,
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
	get: [convertMerlinUrl],
	create: [addShareTokenIfCourseShareable],
	update: [],
	patch: [],
	remove: [],
};
