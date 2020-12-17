const reqlib = require('app-root-path').require;

const { NotFound, BadRequest } = reqlib('src/errors');
const { hasRoleNoHook } = require('../../../hooks');
const { equal } = require('../../../helper/compare').ObjectId;

const restrictToUsersCourses = async (context) => {
	const userIsSuperhero = await hasRoleNoHook(context, context.params.account.userId, 'superhero');
	if (userIsSuperhero) return context;

	const { userId } = context.params.account;
	const usersCourses = await context.app.service('courses').find({
		query: {
			$or: [{ userIds: userId }, { teacherIds: userId }, { substitutionIds: userId }],
		},
	});
	const usersCoursesIds = usersCourses.data.map((c) => c._id);

	if (context.method === 'create') {
		if (!context.data.courseId) {
			throw new BadRequest('courseId required');
		}
	}

	if (['create', 'patch', 'update'].includes(context.method)) {
		if (context.data.courseId && !usersCoursesIds.some((uid) => equal(uid, context.data.courseId))) {
			throw new NotFound('invalid courseId');
		}
	}

	if (['find', 'patch', 'update', 'remove'].includes(context.method)) {
		context.params.query.$and = context.params.query.$and || [];
		context.params.query.$and.push({
			courseId: { $in: usersCoursesIds },
		});
	}
	return context;
};

const denyIfNotInCourse = async (context) => {
	const { userId } = context.params.account;
	const course = await context.app.service('courses').get(context.result.courseId);
	const userInCourse =
		course.userIds.some((id) => equal(id, userId)) ||
		course.teacherIds.some((id) => equal(id, userId)) ||
		course.substitutionIds.some((id) => equal(id, userId));
	if (!userInCourse) throw new NotFound(`no record found for id '${context.id}'`);
	return context;
};

module.exports = { denyIfNotInCourse, restrictToUsersCourses };
