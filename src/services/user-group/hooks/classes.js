const { Configuration } = require('@hpi-schul-cloud/commons');
const { equal: equalIds } = require('../../../helper/compare').ObjectId;
const { NotFound } = require('../../../errors');

const prepareGradeLevelUnset = (context) => {
	if (!context.data.gradeLevel && context.data.name) {
		const unset = context.data.$unset || {};
		unset.gradeLevel = '';
		context.data.$unset = unset;
	}
	return context;
};

const sortByGradeAndOrName = (context) => {
	const defaultQuery = { year: 1, gradeLevel: 1, name: 1 };
	if (
		!context.params ||
		!context.params.query ||
		!context.params.query.$sort ||
		Object.keys(context.params.query.$sort).length === 0
	) {
		context.params = context.params || {};
		context.params.query = context.params.query || {};

		context.params.query.$sort = defaultQuery;
		return context;
	}

	if (context.params.query.$sort) {
		const displayNameSortOrder = context.params.query.$sort.displayName;
		if (displayNameSortOrder !== undefined) {
			Object.assign(context.params.query.$sort, { gradeLevel: displayNameSortOrder, name: displayNameSortOrder });
			delete context.params.query.$sort.displayName;
		}
	}
	return context;
};

const saveSuccessor = async (context) => {
	if (context.data.predecessor) {
		await context.app.service('classes').patch(context.data.predecessor, { successor: context.result._id });
	}
	return context;
};

const restrictFINDToClassesTheUserIsAllowedToSee = async (context) => {
	const currentUser = await context.app
		.service('users')
		.get(context.params.account.userId, { query: { $populate: 'roles' } });
	const skipHook = currentUser.roles.filter((u) => u.name === 'superhero' || u.name === 'administrator').length > 0;
	if (skipHook) return context;

	if (currentUser.roles.some((r) => r.name === 'teacher')) {
		const school = await context.app.service('schools').get(currentUser.schoolId);

		const teachersCanSeeAllSchoolStudents =
			Configuration.get('ADMIN_TOGGLE_STUDENT_VISIBILITY') === 'enabled' ||
			(school.permissions && school.permissions.teacher && school.permissions.teacher.STUDENT_LIST);

		if (teachersCanSeeAllSchoolStudents) {
			return context;
		}
	}

	const { _id } = currentUser;
	const userRestriction = [{ userIds: _id }, { teacherIds: _id }];

	if (typeof context.params.query.$or === 'undefined') {
		context.params.query.$or = userRestriction;
	} else {
		const orQuery = context.params.query.$or;
		delete context.params.query.$or;
		context.params.query.$and = [{ $or: userRestriction }, { $or: orQuery }];
	}

	return context;
};

const restrictToUsersOwnClasses = async (context) => {
	const currentUser = await context.app
		.service('users')
		.get(context.params.account.userId, { query: { $populate: 'roles' } });
	const skipHook = currentUser.roles.filter((u) => u.name === 'superhero' || u.name === 'administrator').length > 0;
	if (skipHook) return context;

	const klass = await context.app.service('classModel').get(context.id);

	const userId = context.params.account.userId.toString();
	if (!(klass.userIds.some((u) => equalIds(u, userId)) || klass.teacherIds.some((u) => equalIds(u, userId)))) {
		throw new NotFound('class not found');
	}
	return context;
};

module.exports = {
	prepareGradeLevelUnset,
	sortByGradeAndOrName,
	saveSuccessor,
	restrictFINDToClassesTheUserIsAllowedToSee,
	restrictToUsersOwnClasses,
};
