const reqlib = require('app-root-path').require;

const { Forbidden } = reqlib('src/errors');
const { equal: compareIds } = require('../../../helper/compare').ObjectId;
const { ScopePermissionService } = require('../../helpers/scopePermissions');

/**
 * Role names used in the database
 */
const courseRoles = {
	teacher: 'courseTeacher',
	substitutionTeacher: 'courseSubstitutionTeacher',
	student: 'courseStudent',
	administrator: 'courseAdministrator',
	superhero: 'courseAdministrator', // Not a typo. There is no dedicated superhero role
};

const belongsToSameSchool = (user, course) => compareIds(user.schoolId, course.schoolId);
const userIsAdmin = (u) => u.roles.some((role) => role.name === 'administrator');
const userIsSuperhero = (u) => u.roles.some((role) => role.name === 'superhero');

/**
 * Setup the userPermissions service for the course scope
 */
const setup = (app) => {
	const getPermissions = async (roleName) => {
		const permissions = await app.service('roles/:roleName/permissions').find({
			route: {
				roleName,
			},
		});
		return permissions;
	};

	/**
	 * Determine the permissions a specific user has in a specific course
	 * @param {ObjectId} userId a userId
	 * @param {Course} course a course object
	 * @returns {Array<String>} array of permissions (strings)
	 */
	const determineCoursePermissions = async (userId, course) => {
		if (!userId || !course) return [];

		const user = await app.service('users').get(userId, { query: { $populate: 'roles' } });
		if (userIsSuperhero(user)) {
			return getPermissions(courseRoles.superhero);
		}
		if (userIsAdmin(user) && belongsToSameSchool(user, course)) {
			return getPermissions(courseRoles.administrator);
		}

		if ((course.teacherIds || []).some((id) => compareIds(userId, id))) {
			return getPermissions(courseRoles.teacher);
		}
		if ((course.substitutionIds || []).some((id) => compareIds(userId, id))) {
			return getPermissions(courseRoles.substitutionTeacher);
		}
		if ((course.userIds || []).some((id) => compareIds(userId, id))) {
			return getPermissions(courseRoles.student);
		}
		throw new Forbidden(`User ${userId} ist nicht Teil des Kurses`);
	};

	ScopePermissionService.initialize(app, '/courses/:scopeId/userPermissions', determineCoursePermissions);
};

module.exports = {
	setup,
	courseRoles,
};
