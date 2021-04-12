const globalHooks = require('../../../hooks');
const { ObjectId } = require('../../../helper/compare');

/**
 * Warning: Role Changes are not handled yet.
 * @param context {object} - the hook of the server-request
 * @returns {object} - the same hook
 */
exports.hasEditPermissionForUser = async (context) => {
	const { id, service: userService } = context;
	// check if user is editing his own profile.
	if (ObjectId.equal(((context.params || {}).account || {}).userId, id)) {
		return context;
	}
	const requestedUser = await userService.get(id, { query: { $populate: 'roles' } });
	const requestedUserRoles = requestedUser.roles.map((r) => r.name);
	if (requestedUserRoles.includes('administrator')) {
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

exports.hasReadPermissionForUser = async (context) => {
	const { id, service: userService } = context;
	// check if user is viewing his own profile
	if (ObjectId.equal(((context.params || {}).account || {}).userId, id)) {
		return context;
	}
	const requestedUser = await userService.get(id, { query: { $populate: 'roles' } });
	const requestedUserRoles = requestedUser.roles.map((r) => r.name);
	if (requestedUserRoles.includes('teacher')) {
		await globalHooks.hasPermission(['TEACHER_LIST'])(context);
	}
	if (requestedUserRoles.includes('student')) {
		await globalHooks.hasSchoolPermission(['STUDENT_LIST'])(context);
	}
	return context;
};
