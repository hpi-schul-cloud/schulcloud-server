const _ = require('lodash');
const { BadRequest, Forbidden } = require('@feathersjs/errors');
const globalHooks = require('../../../hooks');
const { classModel: ClassModel, courseModel: CourseModel } = require('../model');

const restrictToCurrentSchool = globalHooks.ifNotLocal(globalHooks.restrictToCurrentSchool);


/**
 * Adds memberIds to courses.
 * `memberIds` represents the combined list of course members (userIds) and class members
 * of course classes (classes belonging to the course).
 * @param {Course} course
 */
const computeMembers = async (course) => {
	// resolve class users
	const userIdsInClasses = await ClassModel
		.find({ _id: { $in: course.classIds || [] } }, { userIds: 1, _id: 0 })
		.lean().exec(); // todo use aggregate instead
	// combine userIds with userIds from classes
	const userIds = userIdsInClasses.reduce(
		(result, element) => result.concat(element.userIds || []),
		(course.userIds || []).map(elem => (elem._id ? elem._id : elem)),
	);
	// return as array but remove duplicates before
	return [...new Set(userIds.map(userId => userId.toString()))];
};

/**
 * checks if a userId is member of a given course
 * @param {string} userId
 * @param {Course} course with optionally populated userIds
 */
const isCourseMember = (userId,
	{ memberIds = [], teacherIds = [], substitutionIds = [] }) => memberIds.some(u => u.toString() === userId)
            || teacherIds.some(u => (u._id ? u._id : u).toString() === userId)
						|| substitutionIds.some(u => (u._id ? u._id : u).toString() === userId);


const allowForCourseMembersOnly = globalHooks.ifNotLocal(async (context) => {
	const course = await CourseModel.findById(context.id).lean().exec();
	course.memberIds = await computeMembers(course);
	const { userId } = context.params.account;
	const isMember = await isCourseMember(userId.toString(), course);
	if (!isMember) {
		throw new Forbidden('You are not a member of that course.');
	}
	return context;
});

const courseInviteHook = async (context) => {
	if (context.path === 'courses' && context.params.query && context.params.query.link) {
		// link is used as "authorization"
		const dbLink = await context.app.service('link').get(context.params.query.link);
		delete context.params.query.link;
		if (dbLink) return restrictToCurrentSchool(context);
	}

	return allowForCourseMembersOnly(context);
};

const patchPermissionHook = async (context) => {
	const query = context.params.query || {};
	const defaultPermissionHook = ctx => Promise.resolve(globalHooks.hasPermission('USERGROUP_EDIT')(ctx))
		.then(_ctx => allowForCourseMembersOnly(_ctx));

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


const populateMembers = (context, userIds) => context.app.service('/users')
	.find({
		paginate: false,
		query: { _id: { $in: userIds } },
	})
	.then(users => users.map(user => ({ fullName: user.fullName, _id: user._id })));


const resolveMembersOnce = async (context) => {
	if (context && context.result) {
		context.result.memberIds = await computeMembers(context.result);
		context.result.members = await populateMembers(context, context.result.memberIds);
	}
	return context;
};

const resolveMembers = async (context) => {
	if (context && context.result && Array.isArray(context.result.data)) {
		context.result.data = await Promise.all(context.result.data.map(async (course) => {
			course.memberIds = await computeMembers(course);
			course.members = await populateMembers(context, course.memberIds);
			return course;
		}));
	}
	return context;
};


const populateIds = (context) => {
	if (!context.params) {
		context.params = { };
	}
	if (!context.params.query) {
		context.params.query = { };
	}
	context.params.query.$populate = 	[
		'ltiToolIds',
		'classIds',
		'teacherIds',
		'userIds',
		'substitutionIds',
	];
	return context;
};


module.exports = {
	populateIds,
	computeMembers,
	resolveMembersOnce,
	resolveMembers,
	courseInviteHook,
	patchPermissionHook,
	restrictChangesToArchivedCourse,
	allowForCourseMembersOnly,
};
