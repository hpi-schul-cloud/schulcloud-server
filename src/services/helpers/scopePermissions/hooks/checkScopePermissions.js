const { BadRequest, Forbidden } = require('@feathersjs/errors');
const { resolveScope } = require('./resolveScope');

const getScope = async (context) => {
	const { scopeName, scopeId } = await resolveScope(context);
	if (scopeName === undefined || scopeId === undefined) {
		throw new BadRequest('Cannot find scope name or scopeId.');
	}
	return { scopeName, scopeId };
};

const getPermissionService = (app, scopeName) => {
	const permissionServicePath = `/${scopeName}/:scopeId/userPermissions`;
	const permissionService = app.service(permissionServicePath);
	if (permissionService === undefined) {
		throw new BadRequest(`There is no userPermission service for the scope '${scopeName}'.`);
	}
	return permissionService;
};

const getScopePermissions = async (app, userId, scope) => {
	const permissionService = getPermissionService(app, scope.name);
	return permissionService.get(userId, {
		route: {
			scopeId: scope.id,
		},
	});
};

/**
 * Resolves the context if the (authenticated) user has the required permissions inside the scope.
 * @param {Array<Permission>} requiredPermissions an array of strings identifying permissions in the scope
 * @requires auth.hooks.authenticate('jwt')
 */
const checkScopePermissions = (requiredPermissions) => async (context) => {
	const { scopeName, scopeId } = await getScope(context);
	const { userId } = context.params.account;
	const userPermissions = await getScopePermissions(context.app, userId, { id: scopeId, name: scopeName });

	if (requiredPermissions.every((permission) => userPermissions.includes(permission))) {
		return context;
	}
	throw new Forbidden(`Missing one of the required permissions ${requiredPermissions}.`, {
		userId, scopeName, scopeId, requiredPermissions,
	});
};

module.exports = {
	getScopePermissions,
	checkScopePermissions,
};
