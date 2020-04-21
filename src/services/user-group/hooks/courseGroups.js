const { authenticate } = require('@feathersjs/authentication');
const {	iff, isProvider } = require('feathers-hooks-common');
const {
	NotFound,
	BadRequest,
} = require('@feathersjs/errors');
const globalHooks = require('../../../hooks');
const { equal } = require('../../../helper/compare').ObjectId;

const restrictToCurrentSchool = globalHooks.ifNotLocal(globalHooks.restrictToCurrentSchool);

const restrictToUsersOwnCourses = async (context) => {
	const { userId } = context.params.account;
	const usersCourses = await context.app.service('courses').find({
		query: {
			$or: [
				{ userIds: userId },
				{ teacherIds: userId },
				{ substitutionIds: userId },
			],
		},
	});
	const usersCoursesIds = usersCourses.data.map((c) => c._id);

	if (context.method === 'create') {
		if (!context.data.courseId) {
			throw new BadRequest('courseId required');
		}
		if (!usersCoursesIds.some((uid) => equal(uid, context.data.courseId))) {
			throw new NotFound('invalid courseId');
		}
	}

	if (['find'].includes(context.method)) {
		context.params.query.$and = (context.params.query.$and || []);
		context.params.query.$and.push({
			courseId: { $in: [usersCoursesIds] },
		});
	}
	console.log(context.params.query)
};

const denyIfNotInCourse = async (context) => {
	const { userId } = context.params.account;
	const course = await context.app.service('courses').get(context.result.courseId);
	const userInCourse = course.userIds.some((id) => equal(id, userId))
		|| course.teacherIds.some((id) => equal(id, userId))
		|| course.substitutionIds.some((id) => equal(id, userId));
	if (!userInCourse) throw new NotFound(`no record found for id '${context.id}'`);
	return context;
};

exports.before = {
	all: [authenticate('jwt')],
	find: [iff(isProvider('external'), [
		globalHooks.hasPermission('COURSE_VIEW'), restrictToCurrentSchool, restrictToUsersOwnCourses,
	])],
	get: [globalHooks.hasPermission('COURSE_VIEW')],
	create: [iff(isProvider('external'), [
		globalHooks.hasPermission('COURSEGROUP_CREATE'), restrictToCurrentSchool, restrictToUsersOwnCourses,
	])],
	update: [globalHooks.hasPermission('COURSEGROUP_EDIT'), restrictToCurrentSchool],
	patch: [globalHooks.hasPermission('COURSEGROUP_EDIT'), restrictToCurrentSchool, globalHooks.permitGroupOperation],
	remove: [
		globalHooks.hasPermission('COURSEGROUP_CREATE'),
		restrictToCurrentSchool,
		globalHooks.permitGroupOperation,
	],
};

exports.after = {
	all: [],
	find: [],
	get: [iff(isProvider('external'), [
		globalHooks.denyIfNotCurrentSchool({
			errorMessage: 'You do not have valid permissions to access this.',
		}), denyIfNotInCourse,
	])],
	create: [],
	update: [],
	patch: [],
	remove: [],
};
