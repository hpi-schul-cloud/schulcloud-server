const { authenticate } = require('@feathersjs/authentication');
const _ = require('lodash');
const globalHooks = require('../../../hooks');

const restrictToCurrentSchool = globalHooks.ifNotLocal(globalHooks.restrictToCurrentSchool);

const restrictToUsersOwnCourses = (context) => {
	const { userId } = context.params.account;
	const usersCourses = context.app.service('courses').find({
		query: {
			$or: [
				{ userIds: userId },
				{ teacherIds: userId },
				{ substitutionIds: userId },
			],
		},
	});
	const usersCoursesIds = usersCourses.data.map((c) => c._id);

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
	create: [globalHooks.hasPermission('COURSEGROUP_CREATE'), restrictToCurrentSchool],
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
