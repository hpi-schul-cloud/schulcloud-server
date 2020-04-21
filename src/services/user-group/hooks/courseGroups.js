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

	if (context.method === 'find') {
		context.params.query.$and = (context.params.query.$and || []);
		context.params.query.$and.push({
			userId: { $in: [usersCoursesIds] },
		});
	}
};

exports.before = {
	all: [authenticate('jwt')],
	find: [globalHooks.hasPermission('COURSE_VIEW'), restrictToCurrentSchool],
	get: [globalHooks.hasPermission('COURSE_VIEW'), restrictToCurrentSchool],
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
	get: [],
	create: [],
	update: [],
	patch: [],
	remove: [],
};
