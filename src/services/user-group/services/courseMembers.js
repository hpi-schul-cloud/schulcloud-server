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
		const results = await Promise.all(
			ids.map((userId) => getPermissions(params.scope.id, userId).then((r) => [userId, r]))
		);
		for (const result of results) {
			members[result[0]] = result[1];
		}
		return members;
	};

	ScopeMembersService.initialize(app, '/courses/:scopeId/members', getCourseMembers);
};

module.exports = {
	setup,
};
