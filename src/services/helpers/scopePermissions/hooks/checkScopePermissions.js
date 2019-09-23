const { BadRequest, Forbidden } = require('@feathersjs/errors');
const { resolveScope } = require('./resolveScope');

const getScope = async (context) => {
	const { scopeName, scopeId } = await resolveScope(context);
	if (scopeName === undefined || scopeId === undefined) {
		throw new BadRequest('Cannot find scope name or scopeId.');
	}
	return { scopeName, scopeId };
};

const getPermissionService = (context, scopeName) => {
	const permissionServicePath = `/${scopeName}/:scopeId/userPermissions`;
	const permissionService = context.app.service(permissionServicePath);
	if (permissionService === undefined) {
		throw new BadRequest(`There is no userPermission service for the scope '${scopeName}'.`);
	}
	return permissionService;
};

/**
 * Resolves the context if the (authenticated) user has the required permissions inside the scope.
 * @param {Array<Permission>} requiredPermissions an array of strings identifying permissions in the scope
 * @requires auth.hooks.authenticate('jwt')
 */
const checkScopePermissions = (requiredPermissions) => async (context) => {
	const { scopeName, scopeId } = await getScope(context);
	const permissionService = getPermissionService(context, scopeName);
	const { userId } = context.params.account;
	const userPermissions = await permissionService.get(userId, {
		route: {
			scopeId,
		},
	});
	if (requiredPermissions.every((permission) => userPermissions.includes(permission))) {
		return context;
	}
	throw new Forbidden(`Missing one of the required permissions ${requiredPermissions}.`, {
		userId, scopeName, scopeId, requiredPermissions,
	});
};

module.exports = {
	checkScopePermissions,
};
