const errors = require('@feathersjs/errors');
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


exports.checkUniqueAccount = (context) => {
	const accountService = context.app.service('/accounts');
	const { email } = context.data;
	if (!email) {
		// Nothing to check here, E-Mail does not get updated
		return Promise.resolve(context);
	}
	if(!context.params || !context.params.provider){
		// skip for internal calls (without params)
		return Promise.resolve(context)
	}
	const accountQuery = { username: email.toLowerCase() };
	if (context.params.account && context.params.account._id) {
		accountQuery._id = { $ne: context.params.account._id };
	}
	return accountService.find({ query: accountQuery })
		.then((result) => {
			if (result.length > 0) {
				return Promise.reject(new errors
					.BadRequest(`Ein Account mit dieser E-Mail Adresse ${email} existiert bereits!`));
			}
			return Promise.resolve(context);
		});
};
