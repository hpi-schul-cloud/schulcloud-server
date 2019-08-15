const { ScopePermissionService } = require('../../helpers/scopePermissions');

module.exports = function setup() {
	const app = this;

	ScopePermissionService.initialize(app, '/courses/:scopeId/userPermissions', async (userId, course) => {
		let roleName = 'student';

		if (course.teacherIds.includes(userId)
            || course.substitutionIds.includes(userId)) {
			roleName = 'teacher';
		}

		const role = await app.service('roles').findOne({
			name: roleName,
		});

		return role.permissions;
	});
};
