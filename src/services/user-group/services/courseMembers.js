const { ScopeMembersService } = require('../../helpers/scopePermissions/ScopeMembersService');
const { getScopePermissions } = require('../../helpers/scopePermissions/hooks/checkScopePermissions');

/**
 * Setup the members service for the course scope
 */
const setup = (app) => {
	const getPermissions = (course, userId) => getScopePermissions(app, userId, { id: course, name: 'courses' });

	const getCourseMembers = async (params) => {
		const members = {};
		const ids = []
			.concat(params.scope.userIds || [])
			.concat(params.scope.teacherIds || [])
			.concat(params.scope.substitutionIds || []);
		for (const id of ids) {
			members[id] = await getPermissions(params.scope.id, id);
		}
		return members;
	};

	ScopeMembersService.initialize(app, '/courses/:scopeId/members', getCourseMembers);
};

module.exports = {
	setup,
};
