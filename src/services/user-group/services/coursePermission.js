const { Forbidden } = require('@feathersjs/errors');

const { ScopePermissionService } = require('../../helpers/scopePermissions');

const compareIds = s => f => (f._id ? f._id : f).toString() === s.toString();

module.exports = function setup() {
	const app = this;

	ScopePermissionService.initialize(app, '/courses/:scopeId/userPermissions', async (userId, course) => {
		let roleName;

		if (course.teacherIds.some(compareIds(userId))
            || course.substitutionIds.some(compareIds(userId))) {
			roleName = 'teacher';
		} else if (course.memberIds.some(compareIds(userId))) {
			roleName = 'student';
		} else {
			throw new Forbidden(`User '${userId}' ist nicht Teil des Kurses`);
		}

		const permissions = await app.service('roles/:roleName/permissions').find({
			route: {
				roleName,
			},
		});

		return permissions;
	});
};
