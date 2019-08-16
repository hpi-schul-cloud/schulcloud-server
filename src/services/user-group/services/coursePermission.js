const { ScopePermissionService } = require('../../helpers/scopePermissions');


const compareIds = s => (f) => {
	if (f.toString() === s.toString()) return true;

	return false;
};

module.exports = function setup() {
	const app = this;

	ScopePermissionService.initialize(app, '/courses/:scopeId/userPermissions', async (userId, course) => {
		let roleName = 'student';

		if (course.teacherIds.some(compareIds(userId))
            || course.substitutionIds.some(compareIds(userId))) {
			roleName = 'teacher';
		}

		const permissions = await app.service('roles/:roleName/permissions').find({
			route: {
				roleName,
			},
		});

		return permissions;
	});
};
