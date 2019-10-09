const globalHooks = require('../../../hooks');

/**
 * Warning: Role Changes are not handled yet.
 * @param context {object} - the hook of the server-request
 * @returns {object} - the same hook
 */
exports.hasEditPermissionForUser = async (context) => {
	const { id, service: userService } = context;
	const requestedUser = await userService.get(id, { query: { $populate: 'roles' } });
	const requestedUserRoles = requestedUser.roles.map((r) => r.name);
	if (requestedUserRoles.includes('adminstrator')) {
		await globalHooks.hasPermission(['ADMIN_EDIT'])(context);
	}
	if (requestedUserRoles.includes('teacher')) {
		await globalHooks.hasPermission(['TEACHER_EDIT'])(context);
	}
	if (requestedUserRoles.includes('student')) {
		await globalHooks.hasPermission(['STUDENT_EDIT'])(context);
	}
	return context;
};

