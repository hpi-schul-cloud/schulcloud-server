const _ = require('lodash');
const { BadRequest } = require('@feathersjs/errors');
const globalHooks = require('../../../hooks');
const ClassModel = require('../model').classModel;

const restrictToCurrentSchool = globalHooks.ifNotLocal(globalHooks.restrictToCurrentSchool);
const restrictToUsersOwnCourses = globalHooks.ifNotLocal(globalHooks.restrictToUsersOwnCourses);


const courseInviteHook = async (context) => {
	if (context.path === 'courses' && context.params.query && context.params.query.link) {
		// link is used as "authorization"
		const dbLink = await context.app.service('link').get(context.params.query.link);
		delete context.params.query.link;
		if (dbLink) return restrictToCurrentSchool(context);
	}

	return restrictToUsersOwnCourses(context);
};

const patchPermissionHook = async (context) => {
	const query = context.params.query || {};
	const defaultPermissionHook = ctx => Promise.resolve(globalHooks.hasPermission('USERGROUP_EDIT')(ctx))
		.then(_ctx => restrictToUsersOwnCourses(_ctx));

	if (query.link) {
		const dbLink = await context.app.service('link').get(query.link); // link is used as "authorization"
		delete context.params.query.link;
		if (dbLink) return context;
	}

	return defaultPermissionHook(context);
};

/**
 * If the course is expired (archived), only the untilDate and startDate may be changed.
 * @param context contains the feathers context of the request
 */
const restrictChangesToArchivedCourse = async (context) => {
	const course = await context.app.service('courses').get(context.id);
	if (course.isArchived === false) {
		return context;
	}
	// course is expired
	const disallowedKeys = Object.keys(context.data)
		.filter(key => !['untilDate', 'startDate', 'schoolId'].includes(key));
	if (disallowedKeys.length > 0) {
		return Promise.reject(new BadRequest('This course is archived. To activate it, please change the end date.'));
	}
	return context;
};

/**
 * adds memberIds to courses which represents the list of userIds and the userIds of related classes
 * @param {*} course
 */
const computeMembers = async (course) => {
	// resolve class users
	const userIdsInClasses = await ClassModel
		.find({ _id: { $in: course.classIds || [] } }, { userIds: 1, _id: 0 })
		.lean().exec(); // todo use aggregate instead
	// combine userIds with userIds from classes
	const userIds = userIdsInClasses.reduce(
		(result, element) => result.concat(element.userIds || []),
		course.userIds || [],
	);
	// return as array but remove duplicates before
	return [...new Set(userIds.map(userId => userId.toString()))];
};

const resolveMembersOnce = async (context) => {
	if (context && context.result) {
		context.result.memberIds = await computeMembers(context.result);
	}
};

const resolveMembers = async (context) => {
	if (context && context.result && Array.isArray(context.result.data)) {
		context.result.data = await Promise.all(context.result.data.map(async (course) => {
			course.memberIds = await computeMembers(course);
			return course;
		}));
	}
};


module.exports = {
	computeMembers,
	resolveMembersOnce,
	resolveMembers,
	courseInviteHook,
	patchPermissionHook,
	restrictChangesToArchivedCourse,
};
